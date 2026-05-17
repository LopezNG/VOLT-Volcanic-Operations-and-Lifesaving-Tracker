const axios = require("axios");
const cheerio = require("cheerio");

const PHIVOLCS_TAAL_URL = "https://wovodat.phivolcs.dost.gov.ph/bulletin/activity-tvo";
const KNOWN_RECENT_BID = 13947;
const CACHE_TTL_MS = 1000 * 60 * 30;
const MAX_CONSECUTIVE_INVALID = 5;
const MAX_SCAN_IDS = 75;
const SCAN_DELAY_MS = 250;

const axiosClient = axios.create({
  timeout: 10000,
  maxRedirects: 3,
  headers: {
    Accept: "text/html,application/xhtml+xml",
    "User-Agent":
      "VOLT/1.0 (+https://github.com/local/volt; volunteer safety app; non-aggressive bulletin cache)"
  },
  validateStatus: (status) => status >= 200 && status < 500
});

let latestIdCache = {
  value: undefined,
  expiresAt: 0
};
const bulletinCache = new Map();

function buildSourceUrl(id) {
  return `${PHIVOLCS_TAAL_URL}?bid=${encodeURIComponent(id)}&lang=en`;
}

function isFresh(cacheEntry) {
  return cacheEntry && cacheEntry.expiresAt > Date.now();
}

function cacheBulletin(bulletin) {
  bulletinCache.set(bulletin.id, {
    value: bulletin,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPublishedAt($, rawText) {
  const dateText = normalizeText($(".txt-date").first().text());
  const explicitDate = dateText.match(/Date:\s*(.+)$/i);
  if (explicitDate && explicitDate[1]) {
    return normalizeText(explicitDate[1]);
  }

  const rawDate = rawText.match(/\bDate:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})\b/i);
  return rawDate && rawDate[1] ? normalizeText(rawDate[1]) : undefined;
}

function extractAlertLevel($, rawText) {
  const circleText = normalizeText($(".circle").first().text());
  const circleLevel = circleText.match(/\b([0-5])\b/);
  if (circleLevel && circleLevel[1]) {
    return circleLevel[1];
  }

  const rawLevel = rawText.match(/ALERT\s+LEVEL\s*([0-5])/i);
  return rawLevel && rawLevel[1] ? rawLevel[1] : undefined;
}

function parseTaalBulletin(id, html) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const contentText = normalizeText($(".content").text());
  const bodyText = normalizeText($("body").text());
  const rawText = contentText || bodyText;
  const pageTitle = normalizeText($(".p-title").first().text() || $("title").first().text());
  const isTaalBulletin =
    /TAAL\s+VOLCANO/i.test(pageTitle) &&
    /ALERT\s+LEVEL/i.test(rawText) &&
    /PARAMETERS/i.test(rawText);

  if (!isTaalBulletin) {
    return undefined;
  }

  return {
    id,
    sourceUrl: buildSourceUrl(id),
    title: "Taal Volcano Bulletin",
    publishedAt: extractPublishedAt($, rawText),
    alertLevel: extractAlertLevel($, rawText),
    rawText,
    scrapedAt: new Date().toISOString()
  };
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAndParseBulletin(id) {
  const response = await axiosClient.get(PHIVOLCS_TAAL_URL, {
    params: {
      bid: id,
      lang: "en"
    }
  });

  if (response.status >= 400 || typeof response.data !== "string") {
    return undefined;
  }

  return parseTaalBulletin(id, response.data);
}

async function getTaalBulletinById(id) {
  const cached = bulletinCache.get(id);
  if (isFresh(cached)) {
    return cached.value;
  }

  const bulletin = await fetchAndParseBulletin(id);
  if (!bulletin) {
    throw createHttpError(404, `No valid Taal bulletin found for bid ${id}.`);
  }

  cacheBulletin(bulletin);
  return bulletin;
}

async function findLatestTaalBulletinId(startBid = KNOWN_RECENT_BID) {
  if (isFresh(latestIdCache)) {
    return latestIdCache.value;
  }

  let currentBid = startBid;
  let highestValidBid;
  let consecutiveInvalid = 0;
  let scanned = 0;

  while (consecutiveInvalid < MAX_CONSECUTIVE_INVALID && scanned < MAX_SCAN_IDS) {
    let bulletin;
    try {
      bulletin = await fetchAndParseBulletin(currentBid);
    } catch (error) {
      bulletin = undefined;
    }

    if (bulletin) {
      highestValidBid = currentBid;
      consecutiveInvalid = 0;
      cacheBulletin(bulletin);
    } else {
      consecutiveInvalid += 1;
    }

    currentBid += 1;
    scanned += 1;

    if (consecutiveInvalid < MAX_CONSECUTIVE_INVALID && scanned < MAX_SCAN_IDS) {
      await delay(SCAN_DELAY_MS);
    }
  }

  if (!highestValidBid) {
    throw createHttpError(502, "Unable to discover a recent valid Taal bulletin.");
  }

  latestIdCache = {
    value: highestValidBid,
    expiresAt: Date.now() + CACHE_TTL_MS
  };

  return highestValidBid;
}

async function getLatestTaalBulletin() {
  const latestId = await findLatestTaalBulletinId();
  return getTaalBulletinById(latestId);
}

module.exports = {
  KNOWN_RECENT_BID,
  buildSourceUrl,
  findLatestTaalBulletinId,
  getLatestTaalBulletin,
  getTaalBulletinById
};

