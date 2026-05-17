const DEFAULT_UNCERTAINTY =
  "This explanation is based only on the official bulletin text provided.";
const DEFAULT_SAFETY_NOTE =
  "Always follow official PHIVOLCS advisories and local government instructions.";

function compactList(items, fallback) {
  const compacted = items
    .filter(Boolean)
    .map((item) => String(item).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3);

  return compacted.length > 0 ? compacted : [fallback];
}

function explainBulletin(bulletin, options = {}) {
  const rawText = bulletin.rawText.toLowerCase();
  const whatHappened = ["The bulletin reports observed activity for Taal Volcano."];
  const whatItMeans = [];
  const whatToAvoid = [];
  const whatToPrepare = [];
  const highRiskPeople = [];

  if (bulletin.alertLevel) {
    whatHappened.push(`Alert Level ${bulletin.alertLevel} was detected in the bulletin text.`);
    whatItMeans.push(`Use the bulletin as an Alert Level ${bulletin.alertLevel} readiness update.`);
  } else {
    whatHappened.push("Alert level information was not clearly detected in the parsed text.");
    whatItMeans.push("Check the official source for the complete alert level wording.");
  }

  if (/sulfur|sulphur|so2|dioxide|degassing|plume/.test(rawText)) {
    whatHappened.push("Sulfur dioxide, plume, or degassing information was mentioned.");
    whatToAvoid.push("Avoid unnecessary exposure to volcanic gas or plume areas mentioned by officials.");
    highRiskPeople.push("People with respiratory sensitivity may need extra caution around gas or plume exposure.");
  }

  if (/earthquake|seismic|tremor/.test(rawText)) {
    whatHappened.push("Volcanic earthquake, seismicity, or tremor information was mentioned.");
    whatItMeans.push("Seismic terms describe monitored volcano activity, not a prediction by VOLT.");
  }

  if (/ashfall|eruption|lava|base surge|pyroclastic|tsunami/.test(rawText)) {
    whatHappened.push("Potential eruption-related hazards were mentioned in the bulletin text.");
    whatToAvoid.push("Avoid entering hazard areas unless officials say it is safe.");
    whatToPrepare.push("Keep masks, water, lights, documents, medicines, and go-bag items ready.");
  }

  if (options.context?.household) {
    const household = options.context.household;
    if (
      household.elderly ||
      household.children ||
      household.infants ||
      household.mobilityIssues ||
      household.respiratorySensitivity
    ) {
      highRiskPeople.push("Household members needing assistance should be prioritized in readiness plans.");
    }
    if (household.pets) {
      whatToPrepare.push("Include pet needs in household readiness planning.");
    }
    if (household.vehicleAvailable === false) {
      whatToPrepare.push("Plan transport options with family, neighbors, or LGU guidance.");
    }
  }

  whatToPrepare.push("Keep monitoring PHIVOLCS and local government instructions.");

  return {
    id: bulletin.id,
    sourceUrl: bulletin.sourceUrl,
    model: "rule-based fallback",
    whatHappened: compactList(
      whatHappened,
      "The bulletin reports observed activity for Taal Volcano."
    ),
    whatItMeans: compactList(
      whatItMeans,
      "Treat this as a source-grounded readiness summary, not a forecast."
    ),
    whatToAvoid: compactList(
      whatToAvoid,
      "Avoid acting on rumors or unofficial volcano updates."
    ),
    whatToPrepare: compactList(
      whatToPrepare,
      "Keep monitoring PHIVOLCS and local government instructions."
    ),
    highRiskPeople: compactList(
      highRiskPeople,
      "People who need help moving, children, elderly people, and those sensitive to ash or gas may need extra support."
    ),
    uncertainty: DEFAULT_UNCERTAINTY,
    safetyNote: DEFAULT_SAFETY_NOTE,
    generatedAt: new Date().toISOString(),
    fallback: true,
    fallbackReason: options.fallbackReason || "Rule-based explanation generated without Gemini."
  };
}

module.exports = {
  DEFAULT_SAFETY_NOTE,
  DEFAULT_UNCERTAINTY,
  explainBulletin
};
