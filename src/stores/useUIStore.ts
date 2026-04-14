import { create } from 'zustand';

interface UIState {
  // 패널 열림 상태
  isEditorOpen: boolean;
  isInventoryOpen: boolean;
  isCollectionOpen: boolean;
  isGachaSetupOpen: boolean;
  isSettingsOpen: boolean;

  // 토스트 메시지
  toastMessage: string | null;

  // 액션
  openEditor: () => void;
  closeEditor: () => void;
  openInventory: () => void;
  closeInventory: () => void;
  openCollection: () => void;
  closeCollection: () => void;
  openGachaSetup: () => void;
  closeGachaSetup: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  closeAllPanels: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isEditorOpen: false,
  isInventoryOpen: false,
  isCollectionOpen: false,
  isGachaSetupOpen: false,
  isSettingsOpen: false,
  toastMessage: null,

  openEditor: () => set({ isEditorOpen: true }),
  closeEditor: () => set({ isEditorOpen: false }),
  openInventory: () => set({ isInventoryOpen: true }),
  closeInventory: () => set({ isInventoryOpen: false }),
  openCollection: () => set({ isCollectionOpen: true }),
  closeCollection: () => set({ isCollectionOpen: false }),
  openGachaSetup: () => set({ isGachaSetupOpen: true }),
  closeGachaSetup: () => set({ isGachaSetupOpen: false }),
  showToast: (message) => set({ toastMessage: message }),
  clearToast: () => set({ toastMessage: null }),
  closeAllPanels: () =>
    set({
      isEditorOpen: false,
      isInventoryOpen: false,
      isCollectionOpen: false,
      isGachaSetupOpen: false,
      isSettingsOpen: false,
    }),
}));
