export type AlertLevel = "0" | "1" | "2" | "3" | "4" | "5";

export type HazardExposure = "Low" | "Medium" | "High" | "Possible" | "Monitor";

export type Urgency = "critical" | "soon" | "ready";

export type PlanMode =
  | "normal"
  | "ashfall"
  | "gas"
  | "evacuation-prep"
  | "evacuate-now";

export type CheckInStatus = "safe" | "need-help" | "evacuating" | "at-shelter";

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export interface HouseholdProfile {
  province: string;
  municipality: string;
  barangay: string;
  householdSize: number;
  elderlyMembers: number;
  children: number;
  infants: number;
  hasPregnantMember: boolean;
  hasAsthmaOrRespiratory: boolean;
  hasMobilityLimitations: boolean;
  pets: number;
  hasVehicle: boolean;
  contacts: EmergencyContact[];
}

export interface HazardProfile {
  id: string;
  province: string;
  municipality: string;
  barangay: string;
  distanceNote: string;
  ashfall: HazardExposure;
  volcanicGas: HazardExposure;
  baseSurge: HazardExposure;
  lakeHazard: HazardExposure;
  evacuationNote: string;
  officialSourceNote: string;
}

export interface Bulletin {
  id: string;
  volcano: "Taal";
  alertLevel: AlertLevel;
  issuedAt: string;
  source: string;
  title: string;
  summary: string;
  technicalText: string;
}

export interface ExplainerOutput {
  whatHappened: string[];
  whatItMeans: string[];
  whatToAvoid: string[];
  whatToPrepare: string[];
  mostAtRisk: string[];
  uncertainty: string;
  sourceReminder: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  category: "respiratory" | "water" | "medical" | "documents" | "power" | "family" | "pet" | "cash" | "light";
  urgency: Urgency;
  checked: boolean;
  isCustom?: boolean;
}

export interface ReadinessSection {
  id: PlanMode;
  title: string;
  tone: "neutral" | "info" | "warning" | "critical";
  actions: string[];
}

export interface CheckInRecord {
  id?: string;
  status: CheckInStatus;
  note: string;
  updatedAt: string;
  message?: string;
  recipientContactIds?: string[];
  smsAvailable?: boolean;
  smsResult?: string;
}

export interface AppSettings {
  setupComplete: boolean;
}

export type NotificationReminderId = "go-bag" | "bulletin";

export interface NotificationPreference {
  id: NotificationReminderId;
  title: string;
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId?: string;
  updatedAt: string;
}

export interface OfflineCardSnapshotPayload {
  household: {
    province: string;
    municipality: string;
    barangay: string;
    householdSize: number;
    elderlyMembers: number;
    children: number;
    infants: number;
    hasPregnantMember: boolean;
    hasAsthmaOrRespiratory: boolean;
    hasMobilityLimitations: boolean;
    pets: number;
    hasVehicle: boolean;
  };
  contacts: EmergencyContact[];
  hazardProfile: HazardProfile;
  checklistProgress: {
    packed: number;
    total: number;
    percent: number;
    criticalMissing: string[];
    criticalItems: string[];
  };
  latestGuidance: {
    title: string;
    summary: string;
    source: string;
    issuedAt: string;
    planActions: string[];
  };
  generatedAt: string;
}

export interface OfflineCardSnapshot {
  id: string;
  createdAt: string;
  payload: OfflineCardSnapshotPayload;
}
