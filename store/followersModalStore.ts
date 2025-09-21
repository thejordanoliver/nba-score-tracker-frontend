import { create } from "zustand";

interface FollowersModalState {
  isVisible: boolean;
  type: "followers" | "following";
  targetUserId: string | null;
  currentUserId: string | null;
  shouldRestore: boolean;

  openModal: (
    type: "followers" | "following",
    targetUserId: string,
    currentUserId?: string
  ) => void;
  closeModal: () => void;
  markForRestore: () => void;
  clearRestore: () => void;
}

export const useFollowersModalStore = create<FollowersModalState>((set, get) => ({
  isVisible: false,
  type: "followers",
  targetUserId: null,
  currentUserId: null,
  shouldRestore: false,

  openModal: (type, targetUserId, currentUserId) => {
    const state = get();

    // ✅ Prevent double-open if same modal is already active
    if (
      state.isVisible &&
      state.type === type &&
      state.targetUserId === targetUserId
    ) {
      return;
    }

    set({
      isVisible: true,
      type,
      targetUserId,
      currentUserId: currentUserId ?? null,
      shouldRestore: false,
    });
  },

  closeModal: () =>
    set({
      isVisible: false,
      targetUserId: null,
      currentUserId: null,
    }),

  markForRestore: () => set({ shouldRestore: true }),

  clearRestore: () => set({ shouldRestore: false }),
}));
