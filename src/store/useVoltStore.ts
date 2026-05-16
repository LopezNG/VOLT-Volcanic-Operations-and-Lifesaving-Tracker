import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { initialChecklist, latestBulletin, sampleHousehold } from "../data/mockData";
import { storageKeys } from "../services/storage";
import type {
  Bulletin,
  CheckInRecord,
  CheckInStatus,
  ChecklistItem,
  ExplainerOutput,
  HouseholdProfile
} from "../types";

interface VoltState {
  household: HouseholdProfile;
  bulletin: Bulletin;
  checklist: ChecklistItem[];
  explainer?: ExplainerOutput;
  checkIn?: CheckInRecord;
  offlineCardUpdatedAt: string;
  updateHousehold: (profile: HouseholdProfile) => void;
  toggleChecklistItem: (id: string) => void;
  setChecklistItem: (id: string, checked: boolean) => void;
  saveExplainer: (output: ExplainerOutput) => void;
  saveCheckIn: (status: CheckInStatus, note?: string) => void;
  refreshOfflineCard: () => void;
  resetDemoData: () => void;
}

export const useVoltStore = create<VoltState>()(
  persist(
    (set) => ({
      household: sampleHousehold,
      bulletin: latestBulletin,
      checklist: initialChecklist,
      offlineCardUpdatedAt: new Date().toISOString(),
      updateHousehold: (profile) =>
        set({
          household: profile,
          offlineCardUpdatedAt: new Date().toISOString()
        }),
      toggleChecklistItem: (id) =>
        set((state) => ({
          checklist: state.checklist.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          ),
          offlineCardUpdatedAt: new Date().toISOString()
        })),
      setChecklistItem: (id, checked) =>
        set((state) => ({
          checklist: state.checklist.map((item) =>
            item.id === id ? { ...item, checked } : item
          ),
          offlineCardUpdatedAt: new Date().toISOString()
        })),
      saveExplainer: (output) =>
        set({
          explainer: output,
          offlineCardUpdatedAt: new Date().toISOString()
        }),
      saveCheckIn: (status, note = "") =>
        set({
          checkIn: {
            status,
            note,
            updatedAt: new Date().toISOString()
          },
          offlineCardUpdatedAt: new Date().toISOString()
        }),
      refreshOfflineCard: () => set({ offlineCardUpdatedAt: new Date().toISOString() }),
      resetDemoData: () =>
        set({
          household: sampleHousehold,
          bulletin: latestBulletin,
          checklist: initialChecklist,
          explainer: undefined,
          checkIn: undefined,
          offlineCardUpdatedAt: new Date().toISOString()
        })
    }),
    {
      name: storageKeys.app,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        household: state.household,
        bulletin: state.bulletin,
        checklist: state.checklist,
        explainer: state.explainer,
        checkIn: state.checkIn,
        offlineCardUpdatedAt: state.offlineCardUpdatedAt
      })
    }
  )
);
