import { buildReadinessPlan } from "../rules/planRules";
import type {
  Bulletin,
  ChecklistItem,
  HazardProfile,
  HouseholdProfile,
  OfflineCardSnapshotPayload
} from "../types";

export function buildOfflineCardSnapshotPayload({
  household,
  hazard,
  checklist,
  bulletin
}: {
  household: HouseholdProfile;
  hazard: HazardProfile;
  checklist: ChecklistItem[];
  bulletin: Bulletin;
}): OfflineCardSnapshotPayload {
  const packed = checklist.filter((item) => item.checked).length;
  const criticalItems = checklist
    .filter((item) => item.urgency === "critical")
    .map((item) => item.label);
  const criticalMissing = checklist
    .filter((item) => item.urgency === "critical" && !item.checked)
    .map((item) => item.label);
  const plan = buildReadinessPlan(household, hazard, bulletin);
  const ashfallActions = plan.find((section) => section.id === "ashfall")?.actions.slice(0, 3) ?? [];
  const evacuationActions =
    plan.find((section) => section.id === "evacuate-now")?.actions.slice(0, 2) ?? [];

  return {
    household: {
      province: household.province,
      municipality: household.municipality,
      barangay: household.barangay,
      householdSize: household.householdSize,
      elderlyMembers: household.elderlyMembers,
      children: household.children,
      infants: household.infants,
      hasPregnantMember: household.hasPregnantMember,
      hasAsthmaOrRespiratory: household.hasAsthmaOrRespiratory,
      hasMobilityLimitations: household.hasMobilityLimitations,
      pets: household.pets,
      hasVehicle: household.hasVehicle
    },
    contacts: household.contacts,
    hazardProfile: hazard,
    checklistProgress: {
      packed,
      total: checklist.length,
      percent: checklist.length > 0 ? Math.round((packed / checklist.length) * 100) : 0,
      criticalItems,
      criticalMissing
    },
    latestGuidance: {
      title: bulletin.title,
      summary: bulletin.summary,
      source: bulletin.source,
      issuedAt: bulletin.issuedAt,
      planActions: [...ashfallActions, ...evacuationActions].slice(0, 5)
    },
    generatedAt: new Date().toISOString()
  };
}
