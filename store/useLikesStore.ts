import { create } from "zustand";

interface LikeState {
  likes: Record<string, { liked: boolean; count: number }>;
  setLike: (postId: string, liked: boolean, count: number) => void;
  toggleLike: (postId: string) => void;
}

export const useLikesStore = create<LikeState>((set) => ({
  likes: {},
  setLike: (postId, liked, count) =>
    set((state) => ({
      likes: {
        ...state.likes,
        [postId]: { liked, count },
      },
    })),
  toggleLike: (postId) =>
    set((state) => {
      const prev = state.likes[postId];
      if (!prev) return state;
      return {
        likes: {
          ...state.likes,
          [postId]: {
            liked: !prev.liked,
            count: prev.count + (prev.liked ? -1 : 1),
          },
        },
      };
    }),
}));
