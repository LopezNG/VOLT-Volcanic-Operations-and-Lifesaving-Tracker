import type { Bulletin, ChecklistItem, HazardProfile, HouseholdProfile } from "../types";

export const sampleHousehold: HouseholdProfile = {
  province: "Batangas",
  municipality: "Talisay",
  barangay: "Banga",
  householdSize: 5,
  elderlyMembers: 1,
  children: 1,
  infants: 0,
  hasPregnantMember: false,
  hasAsthmaOrRespiratory: true,
  hasMobilityLimitations: false,
  pets: 1,
  hasVehicle: false,
  contacts: [
    { id: "contact-lgu", name: "Talisay MDRRMO", role: "Local emergency", phone: "911 / local hotline" },
    { id: "contact-family", name: "Nanay Lita", role: "Family contact", phone: "0917 000 0186" }
  ]
};

export const sampleHazardProfile: HazardProfile = {
  id: "batangas-talisay-banga",
  province: "Batangas",
  municipality: "Talisay",
  barangay: "Banga",
  distanceNote: "Near Taal Lake; local exposure varies by wind and LGU advisory.",
  ashfall: "Medium",
  volcanicGas: "Possible",
  baseSurge: "Monitor",
  lakeHazard: "Monitor",
  evacuationNote: "Use LGU pickup points if evacuation is ordered. No private vehicle is saved.",
  officialSourceNote: "Mock profile for demo. Follow PHIVOLCS hazard maps and LGU instructions."
};

export const hazardProfiles: HazardProfile[] = [
  sampleHazardProfile,
  {
    id: "batangas-agoncillo-bilibinwang",
    province: "Batangas",
    municipality: "Agoncillo",
    barangay: "Bilibinwang",
    distanceNote: "Lakeside barangay with heightened lake and gas monitoring needs.",
    ashfall: "Medium",
    volcanicGas: "Possible",
    baseSurge: "High",
    lakeHazard: "High",
    evacuationNote: "Coordinate early with barangay officials for transport and shelter assignment.",
    officialSourceNote: "Mock profile for demo. Follow PHIVOLCS hazard maps and LGU instructions."
  },
  {
    id: "cavite-tagaytay-maitimbang",
    province: "Cavite",
    municipality: "Tagaytay",
    barangay: "Maitim 2nd East",
    distanceNote: "Elevated area where ashfall and wind direction are the main demo concerns.",
    ashfall: "Medium",
    volcanicGas: "Low",
    baseSurge: "Low",
    lakeHazard: "Low",
    evacuationNote: "Prepare for ashfall disruptions and follow city advisories.",
    officialSourceNote: "Mock profile for demo. Follow PHIVOLCS hazard maps and LGU instructions."
  }
];

export const latestBulletin: Bulletin = {
  id: "taal-demo-2026-05-16",
  volcano: "Taal",
  alertLevel: "2",
  issuedAt: "2026-05-16T06:00:00+08:00",
  source: "PHIVOLCS-style demo bulletin",
  title: "Taal Volcano Alert Level 2 remains in effect",
  summary:
    "Elevated unrest continues. Weak ashfall and volcanic gas exposure are possible depending on activity, wind, and local advisories.",
  technicalText:
    "This is a sample PHIVOLCS-style bulletin for demo use. Taal Volcano remains at Alert Level 2, indicating increased unrest. Monitoring detected low-level volcanic tremor, weak upwelling in the main crater lake, and sulfur dioxide emissions that may affect nearby communities depending on wind direction. Sudden steam-driven or phreatic explosions, volcanic earthquakes, minor ashfall, and lethal accumulations of volcanic gas can occur and threaten areas within and around Taal Volcano Island. Entry into Taal Volcano Island, boating on Taal Lake near the island, and flying close to the volcano should be avoided. Residents should monitor official PHIVOLCS and local government advisories."
};

export const initialChecklist: ChecklistItem[] = [
  {
    id: "n95",
    label: "N95 masks",
    detail: "Enough for every household member, with extras for the asthma patient.",
    category: "respiratory",
    urgency: "critical",
    checked: false
  },
  {
    id: "goggles",
    label: "Goggles",
    detail: "Eye protection for ash cleanup or unavoidable outdoor movement.",
    category: "respiratory",
    urgency: "critical",
    checked: false
  },
  {
    id: "water",
    label: "Water",
    detail: "At least one day ready now; add more before evacuation.",
    category: "water",
    urgency: "soon",
    checked: true
  },
  {
    id: "medicines",
    label: "Medicines",
    detail: "Asthma inhaler, maintenance medicines, prescriptions, and dose notes.",
    category: "medical",
    urgency: "critical",
    checked: false
  },
  {
    id: "ids",
    label: "IDs and documents",
    detail: "IDs, health cards, birth certificates, and waterproof copies.",
    category: "documents",
    urgency: "critical",
    checked: true
  },
  {
    id: "power-bank",
    label: "Power bank",
    detail: "Fully charged with phone cables.",
    category: "power",
    urgency: "soon",
    checked: false
  },
  {
    id: "radio",
    label: "Battery radio",
    detail: "For LGU and emergency updates if mobile data fails.",
    category: "power",
    urgency: "soon",
    checked: false
  },
  {
    id: "baby-supplies",
    label: "Baby supplies",
    detail: "Diapers, formula, wipes, and comfort items if needed by relatives.",
    category: "family",
    urgency: "soon",
    checked: false
  },
  {
    id: "pet-needs",
    label: "Pet needs",
    detail: "Carrier, leash, water bowl, food, and vaccination notes.",
    category: "pet",
    urgency: "soon",
    checked: false
  },
  {
    id: "cash",
    label: "Cash",
    detail: "Small bills for transport, food, and charging stations.",
    category: "cash",
    urgency: "soon",
    checked: false
  },
  {
    id: "flashlight",
    label: "Flashlight",
    detail: "With spare batteries.",
    category: "light",
    urgency: "soon",
    checked: true
  },
  {
    id: "first-aid",
    label: "First-aid kit",
    detail: "Bandages, antiseptic, gloves, and basic wound care.",
    category: "medical",
    urgency: "soon",
    checked: false
  }
];
