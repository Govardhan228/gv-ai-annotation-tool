import create from "zustand";
import type { Annotation } from "./types/annotation";

export interface StoreState {
  annotations: Annotation[];
  selectedId: string | null;
  setAnnotations: (a: Annotation[]) => void;
  setSelectedId: (id: string | null) => void;
  addAnnotation: (a: Annotation) => void;
}

export const useStore = create<StoreState>((set) => ({
  annotations: [],
  selectedId: null,
  setAnnotations: (a) => set({ annotations: a }),
  setSelectedId: (id) => set({ selectedId: id }),
  addAnnotation: (a) => set(state => ({ annotations: [...state.annotations, a] }))
}));
