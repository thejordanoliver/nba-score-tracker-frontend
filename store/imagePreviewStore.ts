// store/imagePreviewStore.ts

import { create } from "zustand";

type ImagePreviewState = {
  images: string[]; // array of URIs
  index: number;    // current image index
  setImages: (images: string[], index?: number) => void;
  clearImages: () => void;
};

export const useImagePreviewStore = create<ImagePreviewState>((set) => ({
  images: [],
  index: 0,
  setImages: (images, index = 0) => set({ images, index }),
  clearImages: () => set({ images: [], index: 0 }),
}));
