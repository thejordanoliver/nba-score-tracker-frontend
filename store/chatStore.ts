// store/chatStore.ts
import { create } from "zustand";

interface ChatStore {
  isOpen: boolean;
  gameId: string | null;
  openChat: (gameId: string | number) => void;
  closeChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  gameId: null,
  openChat: (gameId) => set({ isOpen: true, gameId: String(gameId) }),
  closeChat: () => set({ isOpen: false, gameId: null }),
}));
