import type { Bulletin, ExplainerOutput, HazardProfile, HouseholdProfile } from "../types";

interface ExplainInput {
  bulletinText: string;
  bulletin: Bulletin;
  household: HouseholdProfile;
  hazard: HazardProfile;
}

export async function explainBulletinWithMockAi({
  bulletinText,
  bulletin,
  household,
  hazard
}: ExplainInput): Promise<ExplainerOutput> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const hasAsh = /ash|ashfall/i.test(bulletinText);
  const hasGas = /gas|sulfur|sulphur|so2/i.test(bulletinText);
  const hasTremor = /tremor|earthquake|unrest/i.test(bulletinText);

  return {
    whatHappened: [
      hasTremor
        ? "The bulletin describes continued unrest such as tremor, gas release, or crater activity."
        : "The bulletin reports a monitored change in Taal activity.",
      `The official alert shown in the source is Alert Level ${bulletin.alertLevel}. VOLT is not changing or inventing that level.`
    ],
    whatItMeans: [
      `${household.barangay}, ${household.municipality} should stay ready for barangay and municipal instructions.`,
      `${hazard.ashfall} ashfall exposure and ${hazard.volcanicGas.toLowerCase()} gas exposure are marked in the saved mock risk profile.`,
      "This does not predict an eruption. It means the household should prepare before conditions worsen."
    ],
    whatToAvoid: [
      "Do not enter Taal Volcano Island or restricted danger zones.",
      "Avoid boating near the volcano and avoid unnecessary lakeside activity during advisories.",
      hasAsh ? "Avoid sweeping dry ash; dampen ash lightly and use a mask and goggles." : "Avoid outdoor exposure if ash or gas is reported."
    ],
    whatToPrepare: [
      "Put N95 masks, goggles, IDs, medicines, water, cash, phone power, radio, and flashlight in the go-bag.",
      household.hasAsthmaOrRespiratory
        ? "Keep asthma medicine and inhaler reachable, with a written dose note for caregivers."
        : "Keep maintenance medicines and prescriptions in one waterproof pouch.",
      household.hasVehicle
        ? "Keep the vehicle fueled and parked facing the exit route."
        : "Confirm the LGU pickup point because no household vehicle is saved."
    ],
    mostAtRisk: [
      household.elderlyMembers > 0 ? "Elderly household members may need early movement and medicine checks." : "People with chronic illness may need extra time.",
      household.children + household.infants > 0
        ? "Children and infants should stay indoors during ashfall or gas advisories."
        : "Children in nearby homes remain sensitive to ash and gas.",
      household.hasAsthmaOrRespiratory || hasGas
        ? "People with asthma or breathing conditions are higher risk during ashfall or sulfur dioxide exposure."
        : "Anyone with breathing symptoms should reduce exposure and seek medical advice."
    ],
    uncertainty:
      "This is a mock AI explanation for demo use. It only interprets the pasted source text and saved profile; it does not forecast activity.",
    sourceReminder: "Follow PHIVOLCS, your LGU, barangay responders, and emergency services."
  };
}
