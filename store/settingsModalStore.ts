import { create } from "zustand";

type SettingsModalStore = {
  showSettingsModal: boolean;
  setShowSettingsModal: (value: boolean) => void;
  showOnReturn: boolean;
  setShowOnReturn: (value: boolean) => void;
};

export const useSettingsModalStore = create<SettingsModalStore>((set) => ({
  showSettingsModal: false,
  setShowSettingsModal: (value) => set({ showSettingsModal: value }),
  showOnReturn: false,
  setShowOnReturn: (value) => set({ showOnReturn: value }),
}));
