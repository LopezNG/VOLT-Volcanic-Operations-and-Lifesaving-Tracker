import * as SQLite from "expo-sqlite";

import { hazardProfiles, initialChecklist, latestBulletin, sampleHousehold } from "../data/mockData";
import type {
  AppSettings,
  Bulletin,
  CheckInRecord,
  CheckInStatus,
  ChecklistItem,
  EmergencyContact,
  ExplainerOutput,
  HazardExposure,
  HazardProfile,
  HouseholdProfile,
  NotificationPreference,
  NotificationReminderId,
  OfflineCardSnapshot,
  OfflineCardSnapshotPayload,
  Urgency
} from "../types";
import { createId } from "../utils/id";

const DATABASE_NAME = "volt-local.db";
const DATABASE_VERSION = 1;
const HOUSEHOLD_ID = "primary";

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

type HouseholdRow = {
  province: string;
  municipality: string;
  barangay: string;
  household_size: number;
  elderly_members: number;
  children: number;
  infants: number;
  has_pregnant_member: number;
  has_asthma_or_respiratory: number;
  has_mobility_limitations: number;
  pets: number;
  has_vehicle: number;
};

type EmergencyContactRow = {
  id: string;
  name: string;
  role: string;
  phone: string;
};

type HazardProfileRow = {
  id: string;
  province: string;
  municipality: string;
  barangay: string;
  distance_note: string;
  ashfall: HazardExposure;
  volcanic_gas: HazardExposure;
  base_surge: HazardExposure;
  lake_hazard: HazardExposure;
  evacuation_note: string;
  official_source_note: string;
};

type ChecklistItemRow = {
  id: string;
  label: string;
  detail: string;
  category: ChecklistItem["category"];
  urgency: Urgency;
  checked: number;
  is_custom: number;
};

type CheckInEventRow = {
  id: string;
  status: CheckInStatus;
  note: string;
  message: string | null;
  recipient_contact_ids: string | null;
  sms_available: number;
  sms_result: string | null;
  created_at: string;
};

type NotificationPreferenceRow = {
  id: NotificationReminderId;
  title: string;
  enabled: number;
  hour: number;
  minute: number;
  notification_id: string | null;
  updated_at: string;
};

type OfflineCardSnapshotRow = {
  id: string;
  payload: string;
  created_at: string;
};

export interface VoltLocalData {
  household: HouseholdProfile;
  bulletin: Bulletin;
  checklist: ChecklistItem[];
  hazardProfiles: HazardProfile[];
  checkIn?: CheckInRecord;
  explainer?: ExplainerOutput;
  offlineCardSnapshot?: OfflineCardSnapshot;
  notificationPreferences: NotificationPreference[];
  appSettings: AppSettings;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  await migrateDatabase(db);
  await seedInitialData();
  return db;
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
}

async function migrateDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  const result = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS household_profile (
        id TEXT PRIMARY KEY NOT NULL,
        province TEXT NOT NULL,
        municipality TEXT NOT NULL,
        barangay TEXT NOT NULL,
        household_size INTEGER NOT NULL,
        elderly_members INTEGER NOT NULL,
        children INTEGER NOT NULL,
        infants INTEGER NOT NULL,
        has_pregnant_member INTEGER NOT NULL,
        has_asthma_or_respiratory INTEGER NOT NULL,
        has_mobility_limitations INTEGER NOT NULL,
        pets INTEGER NOT NULL,
        has_vehicle INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hazard_profiles (
        id TEXT PRIMARY KEY NOT NULL,
        province TEXT NOT NULL,
        municipality TEXT NOT NULL,
        barangay TEXT NOT NULL,
        distance_note TEXT NOT NULL,
        ashfall TEXT NOT NULL,
        volcanic_gas TEXT NOT NULL,
        base_surge TEXT NOT NULL,
        lake_hazard TEXT NOT NULL,
        evacuation_note TEXT NOT NULL,
        official_source_note TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY NOT NULL,
        label TEXT NOT NULL,
        detail TEXT NOT NULL,
        category TEXT NOT NULL,
        urgency TEXT NOT NULL,
        checked INTEGER NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS check_in_events (
        id TEXT PRIMARY KEY NOT NULL,
        status TEXT NOT NULL,
        note TEXT NOT NULL,
        message TEXT,
        recipient_contact_ids TEXT,
        sms_available INTEGER NOT NULL DEFAULT 0,
        sms_result TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS offline_card_snapshots (
        id TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notification_preferences (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        enabled INTEGER NOT NULL,
        hour INTEGER NOT NULL,
        minute INTEGER NOT NULL,
        notification_id TEXT,
        updated_at TEXT NOT NULL
      );
    `);
    await tx.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  });
}

export async function seedInitialData() {
  const db = await getDatabase();
  const seeded = await getSetting("seeded_v1");

  if (seeded === "true") {
    return;
  }

  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT OR REPLACE INTO household_profile (
        id, province, municipality, barangay, household_size, elderly_members, children,
        infants, has_pregnant_member, has_asthma_or_respiratory, has_mobility_limitations,
        pets, has_vehicle, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      HOUSEHOLD_ID,
      sampleHousehold.province,
      sampleHousehold.municipality,
      sampleHousehold.barangay,
      sampleHousehold.householdSize,
      sampleHousehold.elderlyMembers,
      sampleHousehold.children,
      sampleHousehold.infants,
      toSqlBool(sampleHousehold.hasPregnantMember),
      toSqlBool(sampleHousehold.hasAsthmaOrRespiratory),
      toSqlBool(sampleHousehold.hasMobilityLimitations),
      sampleHousehold.pets,
      toSqlBool(sampleHousehold.hasVehicle),
      now
    );

    for (const [index, contact] of sampleHousehold.contacts.entries()) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO emergency_contacts (
          id, name, role, phone, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        contact.id,
        contact.name,
        contact.role,
        contact.phone,
        index,
        now,
        now
      );
    }

    for (const hazard of hazardProfiles) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO hazard_profiles (
          id, province, municipality, barangay, distance_note, ashfall, volcanic_gas,
          base_surge, lake_hazard, evacuation_note, official_source_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        hazard.id,
        hazard.province,
        hazard.municipality,
        hazard.barangay,
        hazard.distanceNote,
        hazard.ashfall,
        hazard.volcanicGas,
        hazard.baseSurge,
        hazard.lakeHazard,
        hazard.evacuationNote,
        hazard.officialSourceNote
      );
    }

    for (const [index, item] of initialChecklist.entries()) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO checklist_items (
          id, label, detail, category, urgency, checked, is_custom, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        item.id,
        item.label,
        item.detail,
        item.category,
        item.urgency,
        toSqlBool(item.checked),
        0,
        index,
        now,
        now
      );
    }

    await tx.runAsync(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);",
      "latest_bulletin",
      JSON.stringify(latestBulletin)
    );
    await tx.runAsync(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);",
      "setup_complete",
      "true"
    );

    const defaultPreferences: NotificationPreference[] = [
      {
        id: "go-bag",
        title: "Go-bag reminder",
        enabled: false,
        hour: 18,
        minute: 0,
        updatedAt: now
      },
      {
        id: "bulletin",
        title: "Check latest Taal bulletin",
        enabled: false,
        hour: 7,
        minute: 0,
        updatedAt: now
      }
    ];

    for (const preference of defaultPreferences) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO notification_preferences (
          id, title, enabled, hour, minute, notification_id, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        preference.id,
        preference.title,
        toSqlBool(preference.enabled),
        preference.hour,
        preference.minute,
        preference.notificationId ?? null,
        preference.updatedAt
      );
    }

    const snapshot = buildSeedSnapshot(now);
    await tx.runAsync(
      "INSERT OR REPLACE INTO offline_card_snapshots (id, payload, created_at) VALUES (?, ?, ?);",
      snapshot.id,
      JSON.stringify(snapshot.payload),
      snapshot.createdAt
    );

    await tx.runAsync(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);",
      "seeded_v1",
      "true"
    );
  });
}

export async function getVoltLocalData(): Promise<VoltLocalData> {
  const [
    contacts,
    profile,
    bulletin,
    checklist,
    localHazardProfiles,
    checkIn,
    explainer,
    offlineCardSnapshot,
    notificationPreferences,
    appSettings
  ] = await Promise.all([
    getEmergencyContacts(),
    getHouseholdProfileWithoutContacts(),
    getStoredBulletin(),
    getChecklistItems(),
    getHazardProfiles(),
    getLatestCheckInEvent(),
    getStoredExplainer(),
    getLatestOfflineCardSnapshot(),
    getNotificationPreferences(),
    getAppSettings()
  ]);

  return {
    household: { ...profile, contacts },
    bulletin,
    checklist,
    hazardProfiles: localHazardProfiles,
    checkIn,
    explainer,
    offlineCardSnapshot,
    offlineCardUpdatedAt: offlineCardSnapshot?.createdAt,
    notificationPreferences,
    appSettings
  } as VoltLocalData & { offlineCardUpdatedAt?: string };
}

export async function saveHouseholdProfile(profile: HouseholdProfile) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO household_profile (
      id, province, municipality, barangay, household_size, elderly_members, children,
      infants, has_pregnant_member, has_asthma_or_respiratory, has_mobility_limitations,
      pets, has_vehicle, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      province = excluded.province,
      municipality = excluded.municipality,
      barangay = excluded.barangay,
      household_size = excluded.household_size,
      elderly_members = excluded.elderly_members,
      children = excluded.children,
      infants = excluded.infants,
      has_pregnant_member = excluded.has_pregnant_member,
      has_asthma_or_respiratory = excluded.has_asthma_or_respiratory,
      has_mobility_limitations = excluded.has_mobility_limitations,
      pets = excluded.pets,
      has_vehicle = excluded.has_vehicle,
      updated_at = excluded.updated_at;`,
    HOUSEHOLD_ID,
    profile.province,
    profile.municipality,
    profile.barangay,
    profile.householdSize,
    profile.elderlyMembers,
    profile.children,
    profile.infants,
    toSqlBool(profile.hasPregnantMember),
    toSqlBool(profile.hasAsthmaOrRespiratory),
    toSqlBool(profile.hasMobilityLimitations),
    profile.pets,
    toSqlBool(profile.hasVehicle),
    now
  );
}

export async function getHouseholdProfile(): Promise<HouseholdProfile> {
  const [profile, contacts] = await Promise.all([
    getHouseholdProfileWithoutContacts(),
    getEmergencyContacts()
  ]);

  return { ...profile, contacts };
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EmergencyContactRow>(
    "SELECT id, name, role, phone FROM emergency_contacts ORDER BY sort_order ASC, created_at ASC;"
  );

  return rows.map(mapEmergencyContact);
}

export async function upsertEmergencyContact(contact: EmergencyContact) {
  const db = await getDatabase();
  const count = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM emergency_contacts;");
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO emergency_contacts (
      id, name, role, phone, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      role = excluded.role,
      phone = excluded.phone,
      updated_at = excluded.updated_at;`,
    contact.id,
    contact.name,
    contact.role,
    contact.phone,
    count?.count ?? 0,
    now,
    now
  );
}

export async function deleteEmergencyContact(id: string) {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM emergency_contacts WHERE id = ?;", id);
}

export async function getHazardProfiles(): Promise<HazardProfile[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<HazardProfileRow>(
    "SELECT * FROM hazard_profiles ORDER BY province ASC, municipality ASC, barangay ASC;"
  );

  return rows.map(mapHazardProfile);
}

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ChecklistItemRow>(
    `SELECT id, label, detail, category, urgency, checked, is_custom
     FROM checklist_items
     ORDER BY sort_order ASC, created_at ASC;`
  );

  return rows.map(mapChecklistItem);
}

export async function saveChecklistItem(item: ChecklistItem) {
  const db = await getDatabase();
  const count = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM checklist_items;");
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO checklist_items (
      id, label, detail, category, urgency, checked, is_custom, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      detail = excluded.detail,
      category = excluded.category,
      urgency = excluded.urgency,
      checked = excluded.checked,
      is_custom = excluded.is_custom,
      updated_at = excluded.updated_at;`,
    item.id,
    item.label,
    item.detail,
    item.category,
    item.urgency,
    toSqlBool(item.checked),
    toSqlBool(item.isCustom ?? false),
    count?.count ?? 0,
    now,
    now
  );
}

export async function setChecklistItemChecked(id: string, checked: boolean) {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE checklist_items SET checked = ?, updated_at = ? WHERE id = ?;",
    toSqlBool(checked),
    new Date().toISOString(),
    id
  );
}

export async function deleteChecklistItem(id: string) {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM checklist_items WHERE id = ? AND is_custom = 1;", id);
}

export async function saveExplainerOutput(output: ExplainerOutput) {
  await setSetting("saved_explainer", JSON.stringify(output));
}

export async function saveCheckInEvent(input: {
  status: CheckInStatus;
  note: string;
  updatedAt?: string;
  message?: string;
  recipientContactIds?: string[];
  smsAvailable?: boolean;
  smsResult?: string;
}): Promise<CheckInRecord> {
  const db = await getDatabase();
  const id = createId("checkin");
  const record: CheckInRecord = {
    id,
    status: input.status,
    note: input.note,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    message: input.message,
    recipientContactIds: input.recipientContactIds,
    smsAvailable: input.smsAvailable,
    smsResult: input.smsResult
  };

  await db.runAsync(
    `INSERT INTO check_in_events (
      id, status, note, message, recipient_contact_ids, sms_available, sms_result, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    id,
    record.status,
    record.note,
    record.message ?? null,
    JSON.stringify(record.recipientContactIds ?? []),
    toSqlBool(record.smsAvailable ?? false),
    record.smsResult ?? null,
    record.updatedAt
  );

  return record;
}

export async function saveOfflineCardSnapshot(
  payload: OfflineCardSnapshotPayload
): Promise<OfflineCardSnapshot> {
  const db = await getDatabase();
  const snapshot: OfflineCardSnapshot = {
    id: createId("offline-card"),
    createdAt: payload.generatedAt,
    payload
  };

  await db.runAsync(
    "INSERT INTO offline_card_snapshots (id, payload, created_at) VALUES (?, ?, ?);",
    snapshot.id,
    JSON.stringify(snapshot.payload),
    snapshot.createdAt
  );

  return snapshot;
}

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<NotificationPreferenceRow>(
    "SELECT * FROM notification_preferences ORDER BY id ASC;"
  );

  return rows.map(mapNotificationPreference);
}

export async function saveNotificationPreference(preference: NotificationPreference) {
  const db = await getDatabase();
  const updatedAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO notification_preferences (
      id, title, enabled, hour, minute, notification_id, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      enabled = excluded.enabled,
      hour = excluded.hour,
      minute = excluded.minute,
      notification_id = excluded.notification_id,
      updated_at = excluded.updated_at;`,
    preference.id,
    preference.title,
    toSqlBool(preference.enabled),
    preference.hour,
    preference.minute,
    preference.notificationId ?? null,
    updatedAt
  );
}

export async function resetDatabaseToSeed() {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync(`
      DELETE FROM app_settings;
      DELETE FROM household_profile;
      DELETE FROM emergency_contacts;
      DELETE FROM hazard_profiles;
      DELETE FROM checklist_items;
      DELETE FROM check_in_events;
      DELETE FROM offline_card_snapshots;
      DELETE FROM notification_preferences;
    `);
  });

  await seedInitialData();
}

async function getHouseholdProfileWithoutContacts(): Promise<Omit<HouseholdProfile, "contacts">> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<HouseholdRow>(
    `SELECT province, municipality, barangay, household_size, elderly_members, children,
      infants, has_pregnant_member, has_asthma_or_respiratory, has_mobility_limitations,
      pets, has_vehicle
     FROM household_profile
     WHERE id = ?;`,
    HOUSEHOLD_ID
  );

  if (!row) {
    return {
      province: "",
      municipality: "",
      barangay: "",
      householdSize: 1,
      elderlyMembers: 0,
      children: 0,
      infants: 0,
      hasPregnantMember: false,
      hasAsthmaOrRespiratory: false,
      hasMobilityLimitations: false,
      pets: 0,
      hasVehicle: false
    };
  }

  return {
    province: row.province,
    municipality: row.municipality,
    barangay: row.barangay,
    householdSize: row.household_size,
    elderlyMembers: row.elderly_members,
    children: row.children,
    infants: row.infants,
    hasPregnantMember: fromSqlBool(row.has_pregnant_member),
    hasAsthmaOrRespiratory: fromSqlBool(row.has_asthma_or_respiratory),
    hasMobilityLimitations: fromSqlBool(row.has_mobility_limitations),
    pets: row.pets,
    hasVehicle: fromSqlBool(row.has_vehicle)
  };
}

async function getStoredBulletin(): Promise<Bulletin> {
  const value = await getSetting("latest_bulletin");
  return value ? (JSON.parse(value) as Bulletin) : latestBulletin;
}

async function getStoredExplainer(): Promise<ExplainerOutput | undefined> {
  const value = await getSetting("saved_explainer");
  return value ? (JSON.parse(value) as ExplainerOutput) : undefined;
}

async function getLatestCheckInEvent(): Promise<CheckInRecord | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CheckInEventRow>(
    "SELECT * FROM check_in_events ORDER BY created_at DESC LIMIT 1;"
  );

  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    status: row.status,
    note: row.note,
    updatedAt: row.created_at,
    message: row.message ?? undefined,
    recipientContactIds: row.recipient_contact_ids
      ? (JSON.parse(row.recipient_contact_ids) as string[])
      : [],
    smsAvailable: fromSqlBool(row.sms_available),
    smsResult: row.sms_result ?? undefined
  };
}

async function getLatestOfflineCardSnapshot(): Promise<OfflineCardSnapshot | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<OfflineCardSnapshotRow>(
    "SELECT * FROM offline_card_snapshots ORDER BY created_at DESC LIMIT 1;"
  );

  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    createdAt: row.created_at,
    payload: JSON.parse(row.payload) as OfflineCardSnapshotPayload
  };
}

async function getAppSettings(): Promise<AppSettings> {
  return {
    setupComplete: (await getSetting("setup_complete")) === "true"
  };
}

async function getSetting(key: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?;",
    key
  );

  return row?.value;
}

async function setSetting(key: string, value: string) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    key,
    value
  );
}

function mapEmergencyContact(row: EmergencyContactRow): EmergencyContact {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone
  };
}

function mapHazardProfile(row: HazardProfileRow): HazardProfile {
  return {
    id: row.id,
    province: row.province,
    municipality: row.municipality,
    barangay: row.barangay,
    distanceNote: row.distance_note,
    ashfall: row.ashfall,
    volcanicGas: row.volcanic_gas,
    baseSurge: row.base_surge,
    lakeHazard: row.lake_hazard,
    evacuationNote: row.evacuation_note,
    officialSourceNote: row.official_source_note
  };
}

function mapChecklistItem(row: ChecklistItemRow): ChecklistItem {
  return {
    id: row.id,
    label: row.label,
    detail: row.detail,
    category: row.category,
    urgency: row.urgency,
    checked: fromSqlBool(row.checked),
    isCustom: fromSqlBool(row.is_custom)
  };
}

function mapNotificationPreference(row: NotificationPreferenceRow): NotificationPreference {
  return {
    id: row.id,
    title: row.title,
    enabled: fromSqlBool(row.enabled),
    hour: row.hour,
    minute: row.minute,
    notificationId: row.notification_id ?? undefined,
    updatedAt: row.updated_at
  };
}

function buildSeedSnapshot(now: string): OfflineCardSnapshot {
  const seedHazard = hazardProfiles[0] ?? {
    id: "seed-hazard",
    province: sampleHousehold.province,
    municipality: sampleHousehold.municipality,
    barangay: sampleHousehold.barangay,
    distanceNote: "Seeded offline risk profile.",
    ashfall: "Monitor" as const,
    volcanicGas: "Monitor" as const,
    baseSurge: "Monitor" as const,
    lakeHazard: "Monitor" as const,
    evacuationNote: "Follow barangay and LGU evacuation instructions.",
    officialSourceNote: "Seed fallback. Follow PHIVOLCS maps and LGU instructions."
  };
  const packed = initialChecklist.filter((item) => item.checked).length;
  const criticalItems = initialChecklist
    .filter((item) => item.urgency === "critical")
    .map((item) => item.label);
  const criticalMissing = initialChecklist
    .filter((item) => item.urgency === "critical" && !item.checked)
    .map((item) => item.label);

  return {
    id: "offline-card-seed",
    createdAt: now,
    payload: {
      household: {
        province: sampleHousehold.province,
        municipality: sampleHousehold.municipality,
        barangay: sampleHousehold.barangay,
        householdSize: sampleHousehold.householdSize,
        elderlyMembers: sampleHousehold.elderlyMembers,
        children: sampleHousehold.children,
        infants: sampleHousehold.infants,
        hasPregnantMember: sampleHousehold.hasPregnantMember,
        hasAsthmaOrRespiratory: sampleHousehold.hasAsthmaOrRespiratory,
        hasMobilityLimitations: sampleHousehold.hasMobilityLimitations,
        pets: sampleHousehold.pets,
        hasVehicle: sampleHousehold.hasVehicle
      },
      contacts: sampleHousehold.contacts,
      hazardProfile: seedHazard,
      checklistProgress: {
        packed,
        total: initialChecklist.length,
        percent: Math.round((packed / initialChecklist.length) * 100),
        criticalItems,
        criticalMissing
      },
      latestGuidance: {
        title: latestBulletin.title,
        summary: latestBulletin.summary,
        source: latestBulletin.source,
        issuedAt: latestBulletin.issuedAt,
        planActions: [
          "Keep masks, IDs, medicines, water, cash, radio, flashlight, and phone power together.",
          "Follow PHIVOLCS, LGU, barangay responders, and emergency services.",
          "If evacuation is ordered, leave immediately with the go-bag only."
        ]
      },
      generatedAt: now
    }
  };
}

function toSqlBool(value: boolean) {
  return value ? 1 : 0;
}

function fromSqlBool(value: number) {
  return value === 1;
}
