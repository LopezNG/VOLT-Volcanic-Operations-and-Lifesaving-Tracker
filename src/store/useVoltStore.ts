import { create } from "zustand";

import {
  deleteChecklistItem as deleteChecklistItemFromDb,
  deleteEmergencyContact,
  getVoltLocalData,
  initializeDatabase,
  resetDatabaseToSeed,
  saveCheckInEvent,
  saveChecklistItem,
  saveExplainerOutput,
  saveHouseholdProfile,
  saveNotificationPreference,
  saveOfflineCardSnapshot,
  setChecklistItemChecked,
  upsertEmergencyContact
} from "../db";
import { findHazardProfile } from "../services/bulletin";
import { cancelLocalReminder, scheduleLocalReminder } from "../services/notifications";
import { buildOfflineCardSnapshotPayload } from "../services/offlineCard";
import type {
  AppSettings,
  Bulletin,
  CheckInRecord,
  CheckInStatus,
  ChecklistItem,
  EmergencyContact,
  ExplainerOutput,
  HazardProfile,
  HouseholdProfile,
  NotificationPreference,
  OfflineCardSnapshot
} from "../types";
import { createId } from "../utils/id";

const emptyHousehold: HouseholdProfile = {
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
  hasVehicle: false,
  contacts: []
};

const emptyBulletin: Bulletin = {
  id: "local-empty",
  volcano: "Taal",
  alertLevel: "0",
  issuedAt: new Date(0).toISOString(),
  source: "Local cache",
  title: "No bulletin loaded",
  summary: "Open VOLT again after the local cache finishes initializing.",
  technicalText: ""
};

interface SaveCheckInInput {
  message?: string;
  recipientContactIds?: string[];
  smsAvailable?: boolean;
  smsResult?: string;
  updatedAt?: string;
}

interface VoltState {
  isReady: boolean;
  dbError?: string;
  appSettings: AppSettings;
  household: HouseholdProfile;
  bulletin: Bulletin;
  hazardProfiles: HazardProfile[];
  checklist: ChecklistItem[];
  explainer?: ExplainerOutput;
  checkIn?: CheckInRecord;
  offlineCardSnapshot?: OfflineCardSnapshot;
  offlineCardUpdatedAt: string;
  notificationPreferences: NotificationPreference[];
  initialize: () => Promise<void>;
  updateHousehold: (profile: HouseholdProfile) => Promise<void>;
  addContact: (contact: Omit<EmergencyContact, "id"> & { id?: string }) => Promise<void>;
  updateContact: (contact: EmergencyContact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  toggleChecklistItem: (id: string) => Promise<void>;
  setChecklistItem: (id: string, checked: boolean) => Promise<void>;
  addChecklistItem: (item: Omit<ChecklistItem, "id" | "checked" | "isCustom">) => Promise<void>;
  updateChecklistItem: (item: ChecklistItem) => Promise<void>;
  deleteChecklistItem: (id: string) => Promise<void>;
  saveExplainer: (output: ExplainerOutput) => Promise<void>;
  saveCheckIn: (
    status: CheckInStatus,
    note?: string,
    input?: SaveCheckInInput
  ) => Promise<CheckInRecord>;
  refreshOfflineCard: () => Promise<void>;
  updateNotificationPreference: (preference: NotificationPreference) => Promise<void>;
  scheduleReminder: (id: NotificationPreference["id"]) => Promise<void>;
  cancelReminder: (id: NotificationPreference["id"]) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

export const useVoltStore = create<VoltState>()((set, get) => ({
  isReady: false,
  appSettings: { setupComplete: false },
  household: emptyHousehold,
  bulletin: emptyBulletin,
  hazardProfiles: [],
  checklist: [],
  offlineCardUpdatedAt: "",
  notificationPreferences: [],
  initialize: async () => {
    try {
      await initializeDatabase();
      const data = await getVoltLocalData();
      set({
        isReady: true,
        dbError: undefined,
        appSettings: data.appSettings,
        household: data.household,
        bulletin: data.bulletin,
        hazardProfiles: data.hazardProfiles,
        checklist: data.checklist,
        explainer: data.explainer,
        checkIn: data.checkIn,
        offlineCardSnapshot: data.offlineCardSnapshot,
        offlineCardUpdatedAt: data.offlineCardSnapshot?.createdAt ?? "",
        notificationPreferences: data.notificationPreferences
      });
    } catch (error) {
      set({
        isReady: true,
        dbError: error instanceof Error ? error.message : "Unable to initialize local database."
      });
    }
  },
  updateHousehold: async (profile) => {
    const contacts = get().household.contacts;
    const next = { ...profile, contacts };
    set({ household: next });

    try {
      await saveHouseholdProfile(next);
    } catch (error) {
      setDbError(error, set);
    }
  },
  addContact: async (contact) => {
    const nextContact: EmergencyContact = {
      id: contact.id ?? createId("contact"),
      name: contact.name,
      role: contact.role,
      phone: contact.phone
    };
    const household = get().household;
    const contacts = [...household.contacts, nextContact];
    set({ household: { ...household, contacts } });

    try {
      await upsertEmergencyContact(nextContact);
    } catch (error) {
      setDbError(error, set);
    }
  },
  updateContact: async (contact) => {
    const household = get().household;
    const contacts = household.contacts.map((item) => (item.id === contact.id ? contact : item));
    set({ household: { ...household, contacts } });

    try {
      await upsertEmergencyContact(contact);
    } catch (error) {
      setDbError(error, set);
    }
  },
  deleteContact: async (id) => {
    const household = get().household;
    const contacts = household.contacts.filter((contact) => contact.id !== id);
    set({ household: { ...household, contacts } });

    try {
      await deleteEmergencyContact(id);
    } catch (error) {
      setDbError(error, set);
    }
  },
  toggleChecklistItem: async (id) => {
    const item = get().checklist.find((entry) => entry.id === id);
    if (!item) return;

    await get().setChecklistItem(id, !item.checked);
  },
  setChecklistItem: async (id, checked) => {
    const checklist = get().checklist.map((item) =>
      item.id === id ? { ...item, checked } : item
    );
    set({ checklist });

    try {
      await setChecklistItemChecked(id, checked);
    } catch (error) {
      setDbError(error, set);
    }
  },
  addChecklistItem: async (item) => {
    const nextItem: ChecklistItem = {
      ...item,
      id: createId("checklist"),
      checked: false,
      isCustom: true
    };
    set({ checklist: [...get().checklist, nextItem] });

    try {
      await saveChecklistItem(nextItem);
    } catch (error) {
      setDbError(error, set);
    }
  },
  updateChecklistItem: async (item) => {
    if (!item.isCustom) return;

    set({
      checklist: get().checklist.map((entry) => (entry.id === item.id ? item : entry))
    });

    try {
      await saveChecklistItem(item);
    } catch (error) {
      setDbError(error, set);
    }
  },
  deleteChecklistItem: async (id) => {
    set({ checklist: get().checklist.filter((item) => item.id !== id || !item.isCustom) });

    try {
      await deleteChecklistItemFromDb(id);
    } catch (error) {
      setDbError(error, set);
    }
  },
  saveExplainer: async (output) => {
    set({ explainer: output });

    try {
      await saveExplainerOutput(output);
    } catch (error) {
      setDbError(error, set);
    }
  },
  saveCheckIn: async (status, note = "", input = {}) => {
    const record = await saveCheckInEvent({
      status,
      note,
      message: input.message,
      recipientContactIds: input.recipientContactIds,
      smsAvailable: input.smsAvailable,
      smsResult: input.smsResult,
      updatedAt: input.updatedAt
    });
    set({ checkIn: record });
    return record;
  },
  refreshOfflineCard: async () => {
    const state = get();
    const hazard = findHazardProfile(state.household, state.hazardProfiles);
    const payload = buildOfflineCardSnapshotPayload({
      household: state.household,
      hazard,
      checklist: state.checklist,
      bulletin: state.bulletin
    });

    try {
      const snapshot = await saveOfflineCardSnapshot(payload);
      set({
        offlineCardSnapshot: snapshot,
        offlineCardUpdatedAt: snapshot.createdAt
      });
    } catch (error) {
      setDbError(error, set);
    }
  },
  updateNotificationPreference: async (preference) => {
    const next = {
      ...preference,
      updatedAt: new Date().toISOString()
    };
    set({
      notificationPreferences: get().notificationPreferences.map((item) =>
        item.id === next.id ? next : item
      )
    });

    try {
      await saveNotificationPreference(next);
    } catch (error) {
      setDbError(error, set);
    }
  },
  scheduleReminder: async (id) => {
    const preference = get().notificationPreferences.find((item) => item.id === id);
    if (!preference) return;

    try {
      await cancelLocalReminder(preference.notificationId);
      const notificationId = await scheduleLocalReminder(preference);
      const next = {
        ...preference,
        enabled: true,
        notificationId,
        updatedAt: new Date().toISOString()
      };
      set({
        notificationPreferences: get().notificationPreferences.map((item) =>
          item.id === id ? next : item
        )
      });
      await saveNotificationPreference(next);
    } catch (error) {
      setDbError(error, set);
      throw error;
    }
  },
  cancelReminder: async (id) => {
    const preference = get().notificationPreferences.find((item) => item.id === id);
    if (!preference) return;

    try {
      await cancelLocalReminder(preference.notificationId);
      const next = {
        ...preference,
        enabled: false,
        notificationId: undefined,
        updatedAt: new Date().toISOString()
      };
      set({
        notificationPreferences: get().notificationPreferences.map((item) =>
          item.id === id ? next : item
        )
      });
      await saveNotificationPreference(next);
    } catch (error) {
      setDbError(error, set);
      throw error;
    }
  },
  resetDemoData: async () => {
    try {
      await resetDatabaseToSeed();
      const data = await getVoltLocalData();
      set({
        appSettings: data.appSettings,
        household: data.household,
        bulletin: data.bulletin,
        hazardProfiles: data.hazardProfiles,
        checklist: data.checklist,
        explainer: data.explainer,
        checkIn: data.checkIn,
        offlineCardSnapshot: data.offlineCardSnapshot,
        offlineCardUpdatedAt: data.offlineCardSnapshot?.createdAt ?? "",
        notificationPreferences: data.notificationPreferences,
        dbError: undefined
      });
    } catch (error) {
      setDbError(error, set);
    }
  }
}));

function setDbError(error: unknown, set: (state: Partial<VoltState>) => void) {
  set({
    dbError: error instanceof Error ? error.message : "A local storage operation failed."
  });
}
