import { create } from "zustand";

export interface SettingsState {
  // Notification types
  liveClassesNotif: boolean;
  announcementsNotif: boolean;
  testsNotif: boolean;
  doubtsNotif: boolean;
  feesNotif: boolean;

  // Data saver
  smallerThumbnails: boolean;
  noAutoplay: boolean;

  // Actions
  toggleLiveClassesNotif: () => void;
  toggleAnnouncementsNotif: () => void;
  toggleTestsNotif: () => void;
  toggleDoubtsNotif: () => void;
  toggleFeesNotif: () => void;
  toggleSmallerThumbnails: () => void;
  toggleNoAutoplay: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  liveClassesNotif: true,
  announcementsNotif: true,
  testsNotif: true,
  doubtsNotif: true,
  feesNotif: true,

  smallerThumbnails: false,
  noAutoplay: false,

  toggleLiveClassesNotif: () =>
    set((state) => ({ liveClassesNotif: !state.liveClassesNotif })),
  toggleAnnouncementsNotif: () =>
    set((state) => ({ announcementsNotif: !state.announcementsNotif })),
  toggleTestsNotif: () =>
    set((state) => ({ testsNotif: !state.testsNotif })),
  toggleDoubtsNotif: () =>
    set((state) => ({ doubtsNotif: !state.doubtsNotif })),
  toggleFeesNotif: () =>
    set((state) => ({ feesNotif: !state.feesNotif })),
  toggleSmallerThumbnails: () =>
    set((state) => ({ smallerThumbnails: !state.smallerThumbnails })),
  toggleNoAutoplay: () =>
    set((state) => ({ noAutoplay: !state.noAutoplay })),
}));
