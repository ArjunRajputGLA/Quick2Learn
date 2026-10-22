import { create } from 'zustand';

export interface DropdownStoreState {
  isOpen: boolean;
  openDropdown: () => void;
  closeDropdown: () => void;
  toggleDropdown: () => void;
  // Aliases for compatibility
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useDropdownStore = create<DropdownStoreState>((set) => ({
  isOpen: false,
  openDropdown: () => set({ isOpen: true }),
  closeDropdown: () => set({ isOpen: false }),
  toggleDropdown: () => set((state) => ({ isOpen: !state.isOpen })),
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export const useDrawerStore = useDropdownStore;
