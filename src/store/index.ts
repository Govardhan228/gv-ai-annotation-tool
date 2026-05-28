import { create } from 'zustand';
import { Annotation, AnnotationClass, Point, Project } from '../types';

interface AppState {
  // View
  viewMode: string;
  setViewMode: (v: string) => void;
  darkMode: boolean;
  toggleDark: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Projects
  projects: Project[];
  setProjects: (p: Project[]) => void;
  currentProjectId: string | null;
  setCurrentProject: (id: string | null) => void;

  // Annotations
  annotations: Annotation[];
  setAnnotations: (a: Annotation[]) => void;
  addAnnotation: (a: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  selectedAnnotationId: string | null;
  setSelectedAnnotation: (id: string | null) => void;

  // Tool
  tool: string;
  setTool: (t: string) => void;
  isDrawing: boolean;
  setIsDrawing: (v: boolean) => void;
  currentPoints: Point[];
  setCurrentPoints: (p: Point[]) => void;

  // Canvas
  scale: number;
  setScale: (s: number) => void;
  offset: Point;
  setOffset: (o: Point) => void;
  showGrid: boolean;
  toggleGrid: () => void;
  gridSize: number;
  setGridSize: (s: number) => void;
  snapToGrid: boolean;
  toggleSnap: () => void;
  image: HTMLImageElement | null;
  setImage: (i: HTMLImageElement | null) => void;
  imageName: string;
  setImageName: (n: string) => void;

  // Classes
  annotationClasses: AnnotationClass[];
  setAnnotationClasses: (c: AnnotationClass[]) => void;
  selectedClass: string;
  setSelectedClass: (c: string) => void;

  // History
  history: Annotation[][];
  historyIndex: number;
  pushHistory: (a: Annotation[]) => void;
  undo: () => void;
  redo: () => void;

  // Auto-save
  lastSaveTime: Date | null;
  setLastSaveTime: (d: Date) => void;
  dirty: boolean;
  setDirty: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  viewMode: 'dashboard',
  setViewMode: (v) => set({ viewMode: v }),
  darkMode: true,
  toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  projects: [],
  setProjects: (p) => set({ projects: p }),
  currentProjectId: null,
  setCurrentProject: (id) => set({ currentProjectId: id }),

  annotations: [],
  setAnnotations: (a) => set({ annotations: a, dirty: true }),
  addAnnotation: (a) => set((s) => {
    const next = [...s.annotations, a];
    return { annotations: next, dirty: true };
  }),
  updateAnnotation: (id, updates) => set((s) => ({
    annotations: s.annotations.map((a) => a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a),
    dirty: true,
  })),
  removeAnnotation: (id) => set((s) => ({
    annotations: s.annotations.filter((a) => a.id !== id),
    dirty: true,
  })),
  selectedAnnotationId: null,
  setSelectedAnnotation: (id) => set({ selectedAnnotationId: id }),

  tool: 'select',
  setTool: (t) => set({ tool: t }),
  isDrawing: false,
  setIsDrawing: (v) => set({ isDrawing: v }),
  currentPoints: [],
  setCurrentPoints: (p) => set({ currentPoints: p }),

  scale: 1,
  setScale: (s) => set({ scale: Math.max(0.1, Math.min(5, s)) }),
  offset: { x: 0, y: 0 },
  setOffset: (o) => set({ offset: o }),
  showGrid: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  gridSize: 20,
  setGridSize: (s) => set({ gridSize: s }),
  snapToGrid: false,
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  image: null,
  setImage: (i) => set({ image: i }),
  imageName: '',
  setImageName: (n) => set({ imageName: n }),

  annotationClasses: [],
  setAnnotationClasses: (c) => set({ annotationClasses: c }),
  selectedClass: 'Person',
  setSelectedClass: (c) => set({ selectedClass: c }),

  history: [],
  historyIndex: -1,
  pushHistory: (a) => set((s) => {
    const h = s.history.slice(0, s.historyIndex + 1);
    h.push([...a]);
    return { history: h, historyIndex: h.length - 1 };
  }),
  undo: () => set((s) => {
    if (s.historyIndex <= 0) return {};
    const i = s.historyIndex - 1;
    return { annotations: [...s.history[i]], historyIndex: i };
  }),
  redo: () => set((s) => {
    if (s.historyIndex >= s.history.length - 1) return {};
    const i = s.historyIndex + 1;
    return { annotations: [...s.history[i]], historyIndex: i };
  }),

  lastSaveTime: null,
  setLastSaveTime: (d) => set({ lastSaveTime: d, dirty: false }),
  dirty: false,
  setDirty: (v) => set({ dirty: v }),
}));
