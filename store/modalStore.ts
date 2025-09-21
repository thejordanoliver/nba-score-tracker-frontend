import { create } from "zustand";

interface ModalState {
  gifModalVisible: boolean;
  onGifSelected: ((gifUrl: string) => void) | null;
  closeGifModal: () => void;

  cropModalVisible: boolean;
  imageToCrop: string | null;
  onCropComplete: ((croppedUri: string) => void) | null;
  closeCropModal: () => void;

  openGifModal: (onGifSelected: (gifUrl: string) => void) => void;
  openCropModal: (
    imageUri: string,
    onCropComplete: (croppedUri: string) => void
  ) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  gifModalVisible: false,
  onGifSelected: null,
  closeGifModal: () =>
    set({ gifModalVisible: false, onGifSelected: null }),

  cropModalVisible: false,
  imageToCrop: null,
  onCropComplete: null,
  closeCropModal: () =>
    set({ cropModalVisible: false, imageToCrop: null, onCropComplete: null }),

  openGifModal: (onGifSelected) =>
    set({ gifModalVisible: true, onGifSelected }),

  openCropModal: (imageUri, onCropComplete) =>
    set({ cropModalVisible: true, imageToCrop: imageUri, onCropComplete }),
}));
