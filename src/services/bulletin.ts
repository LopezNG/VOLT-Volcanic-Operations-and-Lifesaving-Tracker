import { hazardProfiles, latestBulletin, sampleHazardProfile } from "../data/mockData";
import type { Bulletin, HazardProfile, HouseholdProfile } from "../types";

export async function getLatestBulletin(): Promise<Bulletin> {
  return latestBulletin;
}

export function findHazardProfile(profile: HouseholdProfile): HazardProfile {
  const match = hazardProfiles.find(
    (hazard) =>
      hazard.province.toLowerCase() === profile.province.toLowerCase() &&
      hazard.municipality.toLowerCase() === profile.municipality.toLowerCase() &&
      hazard.barangay.toLowerCase() === profile.barangay.toLowerCase()
  );

  return match ?? {
    ...sampleHazardProfile,
    id: `${profile.province}-${profile.municipality}-${profile.barangay}`.toLowerCase(),
    province: profile.province,
    municipality: profile.municipality,
    barangay: profile.barangay,
    officialSourceNote:
      "No exact mock hazard match. Treat this as uncertain and follow PHIVOLCS maps and LGU instructions."
  };
}
