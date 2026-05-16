import type {
  Bulletin,
  HazardProfile,
  HouseholdProfile,
  ReadinessSection,
  Urgency
} from "../types";

export function buildReadinessPlan(
  household: HouseholdProfile,
  hazard: HazardProfile,
  bulletin: Bulletin
): ReadinessSection[] {
  const vulnerablePeople = [];

  if (household.elderlyMembers > 0) vulnerablePeople.push("elderly member");
  if (household.children > 0) vulnerablePeople.push("child");
  if (household.infants > 0) vulnerablePeople.push("infant");
  if (household.hasAsthmaOrRespiratory) vulnerablePeople.push("asthma or respiratory condition");
  if (household.hasMobilityLimitations) vulnerablePeople.push("mobility limitation");

  const vulnerabilityLine =
    vulnerablePeople.length > 0
      ? `Plan for ${vulnerablePeople.join(", ")} before conditions worsen.`
      : "Keep plans simple and shared with every household member.";

  return [
    {
      id: "normal",
      title: "Normal preparedness",
      tone: "neutral",
      actions: [
        `Keep the saved profile current for ${household.barangay}, ${household.municipality}.`,
        "Check PHIVOLCS and LGU updates before sharing any volcano information.",
        "Keep IDs, medicines, water, cash, flashlight, radio, and phone power together.",
        vulnerabilityLine
      ]
    },
    {
      id: "ashfall",
      title: "Ashfall mode",
      tone: "warning",
      actions: [
        "Stay indoors, close windows and doors, and cover gaps if ashfall begins.",
        "Use N95 masks and goggles for unavoidable outdoor movement.",
        "Keep children, elderly members, pets, and asthma patients away from ash.",
        "Avoid dry sweeping; lightly dampen ash before cleanup when officials say it is safe."
      ]
    },
    {
      id: "gas",
      title: "Gas exposure risk",
      tone: "info",
      actions: [
        `Saved gas exposure for this barangay: ${hazard.volcanicGas}. Treat this as uncertain if wind changes.`,
        "Move indoors and close openings if sulfur odor or breathing irritation is reported.",
        "Prepare early movement for asthma patients, elderly members, infants, and anyone short of breath.",
        "Follow LGU instructions if officials advise leaving low-lying or lakeside areas."
      ]
    },
    {
      id: "evacuation-prep",
      title: "Evacuation preparation",
      tone: "warning",
      actions: [
        household.hasVehicle
          ? "Fuel the vehicle and park it facing the safest exit route."
          : "Confirm the barangay pickup point now because no vehicle is saved.",
        "Pack medicines, IDs, water, masks, cash, radio, flashlight, baby needs, and pet needs.",
        "Assign one adult to the elderly member and one adult to the child during movement.",
        "Text your emergency contact before signal gets crowded."
      ]
    },
    {
      id: "evacuate-now",
      title: "Evacuate-now guidance",
      tone: "critical",
      actions: [
        "Leave immediately if PHIVOLCS, LGU, police, barangay, or rescuers order evacuation.",
        "Bring the go-bag only; do not delay for non-essential belongings.",
        "Turn off gas and electricity only if it is safe and fast.",
        `Go to the assigned pickup point or shelter. Current bulletin source: ${bulletin.source}.`
      ]
    }
  ];
}

export function getImmediateActions(household: HouseholdProfile, hazard: HazardProfile): string[] {
  const actions = [
    "Keep water and masks confirmed",
    "Pack medicines for senior household member",
    "Save LGU contact and family check-in status"
  ];

  if (!household.hasVehicle) actions.push("Confirm barangay transport or pickup point");
  if (household.pets > 0) actions.push("Add pet carrier, leash, food, and bowl");
  if (hazard.volcanicGas !== "Low") actions.push("Prepare indoor sealing plan for gas or ash");

  return actions.slice(0, 5);
}

export function getUrgencyLabel(urgency: Urgency): string {
  if (urgency === "critical") return "Critical";
  if (urgency === "soon") return "Soon";
  return "Ready";
}
