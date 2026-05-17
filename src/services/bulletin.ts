import { getVoltLocalData } from "../db";
import type { Bulletin, HazardProfile, HouseholdProfile } from "../types";

export async function getLatestBulletin(): Promise<Bulletin> {
  const data = await getVoltLocalData();
  return data.bulletin;
}

export function findHazardProfile(
  profile: HouseholdProfile,
  hazardProfiles: HazardProfile[] = []
): HazardProfile {
  const match = hazardProfiles.find(
    (hazard) =>
      hazard.province.toLowerCase() === profile.province.toLowerCase() &&
      hazard.municipality.toLowerCase() === profile.municipality.toLowerCase() &&
      hazard.barangay.toLowerCase() === profile.barangay.toLowerCase()
  );

  return match ?? {
    id: `${profile.province}-${profile.municipality}-${profile.barangay}`.toLowerCase(),
    province: profile.province,
    municipality: profile.municipality,
    barangay: profile.barangay,
    distanceNote: "No saved offline risk profile matches this barangay yet.",
    ashfall: "Monitor",
    volcanicGas: "Monitor",
    baseSurge: "Monitor",
    lakeHazard: "Monitor",
    evacuationNote: "Confirm evacuation routes and pickup points with your barangay or LGU.",
    officialSourceNote:
      "No exact local hazard match. Treat this as uncertain and follow PHIVOLCS maps and LGU instructions."
  };
}
