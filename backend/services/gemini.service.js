const crypto = require("crypto");

const axios = require("axios");

const {
  BULLETIN_EXPLANATION_SCHEMA,
  buildGeminiBulletinPrompt
} = require("../utils/buildGeminiBulletinPrompt");
const {
  DEFAULT_SAFETY_NOTE,
  DEFAULT_UNCERTAINTY,
  explainBulletin
} = require("../utils/explainBulletin");

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const CACHE_TTL_MS = 1000 * 60 * 30;
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 10000);

const explanationCache = new Map();
let lastGeminiStatus = {
  ok: false,
  model: DEFAULT_GEMINI_MODEL,
  configured: false,
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastError: null
};

function isFresh(cacheEntry) {
  return cacheEntry && cacheEntry.expiresAt > Date.now();
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "PASTE_MY_KEY_HERE" || apiKey === "your_gemini_api_key_here") {
    return undefined;
  }

  return apiKey;
}

function getPublicGeminiStatus() {
  return {
    ...lastGeminiStatus,
    configured: Boolean(getGeminiApiKey()),
    model: getGeminiModel()
  };
}

function limitString(value, maxLength) {
  if (typeof value !== "string") {
    return undefined;
  }

  const compacted = value.replace(/\s+/g, " ").trim();
  return compacted ? compacted.slice(0, maxLength) : undefined;
}

function sanitizeBoolean(value) {
  return typeof value === "boolean" ? value : undefined;
}

function sanitizeCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return Math.min(99, Math.floor(parsed));
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function sanitizeHousehold(value) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const household = compactObject({
    elderly: sanitizeBoolean(value.elderly),
    children: sanitizeCount(value.children),
    infants: sanitizeCount(value.infants),
    respiratorySensitivity: sanitizeBoolean(value.asthma ?? value.respiratorySensitivity),
    mobilityIssues: sanitizeBoolean(value.mobilityIssues),
    pets: sanitizeBoolean(value.pets),
    vehicleAvailable: sanitizeBoolean(value.vehicleAvailable)
  });

  return Object.keys(household).length > 0 ? household : undefined;
}

function sanitizeRiskProfile(value) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const hazards = Array.isArray(value.hazards)
    ? value.hazards.map((hazard) => limitString(hazard, 40)).filter(Boolean).slice(0, 8)
    : undefined;

  const riskProfile = compactObject({
    barangay: limitString(value.barangay, 80),
    hazards
  });

  return Object.keys(riskProfile).length > 0 ? riskProfile : undefined;
}

function sanitizeExplanationContext(value) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const context = compactObject({
    household: sanitizeHousehold(value.household),
    riskProfile: sanitizeRiskProfile(value.riskProfile)
  });

  return Object.keys(context).length > 0 ? context : undefined;
}

function buildCacheKey(bulletin, context) {
  const contextHash = context
    ? crypto.createHash("sha256").update(JSON.stringify(context)).digest("hex").slice(0, 16)
    : "no-context";

  return `${bulletin.id}:${contextHash}`;
}

function parseGeminiJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Gemini returned non-JSON content.");
    }

    return JSON.parse(match[0]);
  }
}

function toStringArray(value, fallback) {
  const strings = Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.replace(/\s+/g, " ").trim() : ""))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return strings.length > 0 ? strings : [fallback];
}

function toStringValue(value, fallback) {
  return typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : fallback;
}

function normalizeGeminiExplanation(value, bulletin, model) {
  return {
    id: bulletin.id,
    sourceUrl: bulletin.sourceUrl,
    model,
    whatHappened: toStringArray(
      value.whatHappened,
      "The bulletin reports observed activity for Taal Volcano."
    ),
    whatItMeans: toStringArray(
      value.whatItMeans,
      "Treat this as a source-grounded readiness summary, not a forecast."
    ),
    whatToAvoid: toStringArray(
      value.whatToAvoid,
      "Avoid acting on rumors or unofficial volcano updates."
    ),
    whatToPrepare: toStringArray(
      value.whatToPrepare,
      "Keep monitoring PHIVOLCS and local government instructions."
    ),
    highRiskPeople: toStringArray(
      value.highRiskPeople,
      "People who need help moving, children, elderly people, and those sensitive to ash or gas may need extra support."
    ),
    uncertainty: toStringValue(value.uncertainty, DEFAULT_UNCERTAINTY),
    safetyNote: toStringValue(value.safetyNote, DEFAULT_SAFETY_NOTE),
    generatedAt: new Date().toISOString(),
    fallback: false
  };
}

function normalizeGeminiError(error) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Unknown Gemini error.";
  }

  const status = error.response?.status;
  const apiMessage = error.response?.data?.error?.message;
  if (status && apiMessage) {
    return `Gemini request failed with HTTP ${status}: ${apiMessage}`;
  }

  if (status) {
    return `Gemini request failed with HTTP ${status}.`;
  }

  if (error.code === "ECONNABORTED") {
    return "Gemini request timed out.";
  }

  return error.message || "Gemini request failed.";
}

async function requestGeminiExplanation(bulletin, context) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = getGeminiModel();
  const prompt = buildGeminiBulletinPrompt({ bulletin, context, model });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const response = await axios.post(
    url,
    {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 900,
        responseMimeType: "application/json",
        responseJsonSchema: BULLETIN_EXPLANATION_SCHEMA
      }
    },
    {
      timeout: GEMINI_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      }
    }
  );

  const candidate = response.data?.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();

  if (!text) {
    const reason = candidate?.finishReason || response.data?.promptFeedback?.blockReason;
    throw new Error(reason ? `Gemini returned no text (${reason}).` : "Gemini returned no text.");
  }

  return normalizeGeminiExplanation(parseGeminiJson(text), bulletin, model);
}

async function explainTaalBulletinWithGeminiFallback(bulletin, rawContext) {
  const context = sanitizeExplanationContext(rawContext);
  const cacheKey = buildCacheKey(bulletin, context);
  const cached = explanationCache.get(cacheKey);

  if (isFresh(cached)) {
    return cached.value;
  }

  let explanation;
  try {
    lastGeminiStatus = {
      ...getPublicGeminiStatus(),
      ok: false,
      lastAttemptAt: new Date().toISOString(),
      lastError: null
    };
    explanation = await requestGeminiExplanation(bulletin, context);
    lastGeminiStatus = {
      ...getPublicGeminiStatus(),
      ok: true,
      lastSuccessAt: new Date().toISOString(),
      lastError: null
    };
  } catch (error) {
    const reason = normalizeGeminiError(error);
    lastGeminiStatus = {
      ...getPublicGeminiStatus(),
      ok: false,
      lastAttemptAt: lastGeminiStatus.lastAttemptAt || new Date().toISOString(),
      lastError: reason
    };
    console.warn(`Gemini explainer unavailable: ${reason}`);
    explanation = explainBulletin(bulletin, {
      context,
      fallbackReason: "Gemini explanation unavailable; returned rule-based fallback."
    });
  }

  explanationCache.set(cacheKey, {
    value: explanation,
    expiresAt: Date.now() + CACHE_TTL_MS
  });

  return explanation;
}

module.exports = {
  DEFAULT_GEMINI_MODEL,
  explainTaalBulletinWithGeminiFallback,
  getPublicGeminiStatus,
  sanitizeExplanationContext
};
