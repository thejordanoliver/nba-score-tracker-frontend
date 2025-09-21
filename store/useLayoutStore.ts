// store/useLayoutStore.ts
import { create } from 'zustand';

type LayoutMode = 'compact' | 'list';

type LayoutStore = {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  layoutMode: 'compact',
  setLayoutMode: (mode) => set({ layoutMode: mode }),
}));
