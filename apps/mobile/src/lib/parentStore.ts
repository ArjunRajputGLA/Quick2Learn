import { create } from "zustand";

export interface ParentStoreState {
  selectedChildId: string | null;
  setSelectedChildId: (childId: string | null) => void;
}

export const useParentStore = create<ParentStoreState>((set) => ({
  selectedChildId: null,
  setSelectedChildId: (childId: string | null) => set({ selectedChildId: childId }),
}));
