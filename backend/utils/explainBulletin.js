function explainBulletin(bulletin) {
  const rawText = bulletin.rawText.toLowerCase();
  const summary = ["This bulletin reports the current observed activity of Taal Volcano."];

  if (bulletin.alertLevel) {
    summary.push(`Alert Level ${bulletin.alertLevel} information was detected.`);
  } else {
    summary.push("Alert Level information was not clearly detected in the parsed text.");
  }

  if (/sulfur|sulphur|so2|dioxide|degassing|plume/.test(rawText)) {
    summary.push("Sulfur dioxide, plume, or degassing information was mentioned.");
  }

  if (/earthquake|seismic|tremor/.test(rawText)) {
    summary.push("Volcanic earthquake, seismicity, or tremor information was mentioned.");
  }

  if (/ashfall|eruption|lava|base surge|pyroclastic|tsunami/.test(rawText)) {
    summary.push("Potential eruption-related hazards were mentioned in the bulletin text.");
  }

  return {
    id: bulletin.id,
    sourceUrl: bulletin.sourceUrl,
    plainLanguageSummary: summary,
    safetyNote: "Always follow official PHIVOLCS advisories and local government instructions."
  };
}

module.exports = {
  explainBulletin
};
