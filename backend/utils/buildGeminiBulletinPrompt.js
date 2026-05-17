const BULLETIN_EXPLANATION_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "integer" },
    sourceUrl: { type: "string" },
    model: { type: "string" },
    whatHappened: {
      type: "array",
      items: { type: "string" }
    },
    whatItMeans: {
      type: "array",
      items: { type: "string" }
    },
    whatToAvoid: {
      type: "array",
      items: { type: "string" }
    },
    whatToPrepare: {
      type: "array",
      items: { type: "string" }
    },
    highRiskPeople: {
      type: "array",
      items: { type: "string" }
    },
    uncertainty: { type: "string" },
    safetyNote: { type: "string" },
    generatedAt: { type: "string" }
  },
  required: [
    "id",
    "sourceUrl",
    "model",
    "whatHappened",
    "whatItMeans",
    "whatToAvoid",
    "whatToPrepare",
    "highRiskPeople",
    "uncertainty",
    "safetyNote",
    "generatedAt"
  ]
};

function compactBulletinText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

function buildOptionalContext(context) {
  if (!context) {
    return "No optional household or barangay risk context was provided.";
  }

  return JSON.stringify(context, null, 2);
}

function buildGeminiBulletinPrompt({ bulletin, context, model }) {
  return [
    "Role: You are VOLT, an emergency readiness assistant for Taal Volcano bulletins.",
    "",
    "Use only the provided source material: PHIVOLCS bulletin text, detected alert level, detected date, source URL, and optional household or barangay risk context.",
    "Do not invent alert levels, dates, locations, hazards, evacuation orders, or official instructions.",
    "Do not predict eruptions or claim certainty beyond the official bulletin.",
    "Do not replace PHIVOLCS, LGU, emergency responders, or medical professionals.",
    "Do not provide medical diagnosis.",
    "Write concise, app-friendly bullets. Use 1 to 3 bullets per array. Keep each bullet short.",
    "",
    "Return only valid JSON matching this schema:",
    JSON.stringify(BULLETIN_EXPLANATION_SCHEMA, null, 2),
    "",
    "Set uncertainty exactly to: This explanation is based only on the official bulletin text provided.",
    "Set safetyNote exactly to: Always follow official PHIVOLCS advisories and local government instructions.",
    "",
    "Detected bulletin metadata:",
    JSON.stringify(
      {
        id: bulletin.id,
        sourceUrl: bulletin.sourceUrl,
        model,
        alertLevel: bulletin.alertLevel || null,
        publishedAt: bulletin.publishedAt || null
      },
      null,
      2
    ),
    "",
    "Optional user context. Do not infer private details from it:",
    buildOptionalContext(context),
    "",
    "Official PHIVOLCS bulletin text:",
    compactBulletinText(bulletin.rawText)
  ].join("\n");
}

module.exports = {
  BULLETIN_EXPLANATION_SCHEMA,
  buildGeminiBulletinPrompt
};
