import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

interface TaxonomyNode {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  children: TaxonomyNode[];
  attributes?: { id: string; name: string; type: string; required: boolean }[];
}

interface QualityCheck {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'pass' | 'fail' | 'pending';
  count: number;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  type: '2d' | '3d' | '2d+3d';
  status: 'active' | 'review' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  imageCount: number;
  annotationCount: number;
  frameCount: number;
  assignees: string[];
  dueDate: string;
  updatedAt: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  assigneeRole: string;
  status: 'pending' | 'in_progress' | 'done';
  itemCount: number;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  project: string;
  time: string;
  type: 'complete' | 'upload' | 'review' | 'ai' | 'reject';
}

interface AppStore {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  projects: Project[];
  taxonomy: TaxonomyNode[];
  qualityChecks: QualityCheck[];
  workflowStages: WorkflowStage[];
  activity: ActivityItem[];
  loading: boolean;
  toggleDark: () => void;
  toggleSidebar: () => void;
  loadSeedData: () => Promise<void>;
  toggleCheck: (id: string) => void;
  addProject: (p: Partial<Project>) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;
}

const SEED_PROJECTS: Project[] = [
  { id: 'p1', name: 'Urban Driving Dataset Q3', description: 'LiDAR + camera fusion for autonomous driving scene understanding', type: '2d+3d', status: 'active', priority: 'critical', progress: 67, imageCount: 12450, annotationCount: 38900, frameCount: 12450, assignees: ['AC', 'BS', 'CD'], dueDate: '2026-07-15', updatedAt: '2h ago' },
  { id: 'p2', name: 'Retail Store Analytics', description: 'Customer behavior tracking and product interaction detection', type: '2d', status: 'review', priority: 'high', progress: 92, imageCount: 8200, annotationCount: 24600, frameCount: 0, assignees: ['DW', 'EV'], dueDate: '2026-06-30', updatedAt: '15m ago' },
  { id: 'p3', name: 'Warehouse Robotics QC', description: 'Object detection for automated fulfillment center operations', type: '3d', status: 'active', priority: 'high', progress: 45, imageCount: 5400, annotationCount: 16200, frameCount: 5400, assignees: ['AC', 'FG'], dueDate: '2026-08-01', updatedAt: '1h ago' },
  { id: 'p4', name: 'Medical Imaging Segmentation', description: 'Organ and tissue segmentation for diagnostic AI training', type: '2d', status: 'active', priority: 'critical', progress: 78, imageCount: 3200, annotationCount: 28800, frameCount: 0, assignees: ['GH', 'IJ', 'KL'], dueDate: '2026-07-10', updatedAt: '3h ago' },
  { id: 'p5', name: 'Agricultural Crop Survey', description: 'Drone imagery annotation for crop health monitoring', type: '2d', status: 'completed', priority: 'medium', progress: 100, imageCount: 6800, annotationCount: 20400, frameCount: 0, assignees: ['MN', 'OP'], dueDate: '2026-06-01', updatedAt: '1d ago' },
  { id: 'p6', name: 'Traffic Flow Optimization', description: 'Multi-camera vehicle tracking and behavior classification', type: '2d+3d', status: 'paused', priority: 'low', progress: 23, imageCount: 9100, annotationCount: 8200, frameCount: 9100, assignees: ['QR'], dueDate: '2026-09-15', updatedAt: '2d ago' },
];

const SEED_TAXONOMY: TaxonomyNode[] = [
  {
    id: 't1', name: 'Person', color: '#3b82f6', parentId: null, children: [
      { id: 't1a', name: 'Walking', color: '#3b82f6', parentId: 't1', children: [], attributes: [{ id: 'a1', name: 'speed', type: 'select', required: false }] },
      { id: 't1b', name: 'Loading Goods', color: '#3b82f6', parentId: 't1', children: [] },
      { id: 't1c', name: 'Unloading Goods', color: '#3b82f6', parentId: 't1', children: [] },
      { id: 't1d', name: 'Inspecting Goods', color: '#3b82f6', parentId: 't1', children: [] },
      { id: 't1e', name: 'Guiding Truck', color: '#3b82f6', parentId: 't1', children: [] },
    ],
  },
  { id: 't2', name: 'Truck', color: '#ef4444', parentId: null, children: [] },
  { id: 't3', name: 'Forklift', color: '#f97316', parentId: null, children: [] },
  { id: 't4', name: 'Pallet', color: '#eab308', parentId: null, children: [] },
  { id: 't5', name: 'Box', color: '#22c55e', parentId: null, children: [] },
  { id: 't6', name: 'Dolly', color: '#a855f7', parentId: null, children: [] },
  {
    id: 't7', name: 'Vehicle', color: '#06b6d4', parentId: null, children: [
      { id: 't7a', name: 'Sedan', color: '#06b6d4', parentId: 't7', children: [] },
      { id: 't7b', name: 'SUV', color: '#06b6d4', parentId: 't7', children: [] },
      { id: 't7c', name: 'Van', color: '#06b6d4', parentId: 't7', children: [] },
    ],
  },
];

const SEED_CHECKS: QualityCheck[] = [
  { id: 'q1', name: 'Missing Annotations', severity: 'critical', status: 'fail', count: 23, description: 'Frames with detected objects but no annotations' },
  { id: 'q2', name: 'Duplicate Track IDs', severity: 'critical', status: 'fail', count: 8, description: 'Same track ID assigned to different objects' },
  { id: 'q3', name: 'Track Consistency', severity: 'warning', status: 'fail', count: 15, description: 'Discontinuous track segments across frames' },
  { id: 'q4', name: 'Behavior Consistency', severity: 'warning', status: 'fail', count: 6, description: 'Inconsistent behavior labels within a track' },
  { id: 'q5', name: 'Box Displacement', severity: 'warning', status: 'pending', count: 0, description: 'Large bbox jumps between consecutive frames' },
  { id: 'q6', name: 'Attribute Validation', severity: 'info', status: 'pass', count: 0, description: 'Required attributes present on all annotations' },
  { id: 'q7', name: 'Cross-Camera Validation', severity: 'warning', status: 'fail', count: 4, description: 'Track ID mismatch across camera views' },
  { id: 'q8', name: 'Label Confidence', severity: 'info', status: 'pass', count: 0, description: 'All annotations above confidence threshold' },
];

const SEED_WORKFLOW: WorkflowStage[] = [
  { id: 'w1', name: 'Project Creation', order: 0, assigneeRole: 'Admin', status: 'done', itemCount: 6 },
  { id: 'w2', name: 'Annotation', order: 1, assigneeRole: 'Annotator', status: 'in_progress', itemCount: 4 },
  { id: 'w3', name: 'QA Review', order: 2, assigneeRole: 'Reviewer', status: 'in_progress', itemCount: 2 },
  { id: 'w4', name: 'Rework', order: 3, assigneeRole: 'Annotator', status: 'pending', itemCount: 0 },
  { id: 'w5', name: 'Final QA', order: 4, assigneeRole: 'Senior Reviewer', status: 'pending', itemCount: 0 },
  { id: 'w6', name: 'Client Review', order: 5, assigneeRole: 'Client', status: 'pending', itemCount: 0 },
  { id: 'w7', name: 'Submission', order: 6, assigneeRole: 'Admin', status: 'pending', itemCount: 0 },
];

const SEED_ACTIVITY: ActivityItem[] = [
  { id: 'a1', user: 'Alice Chen', action: 'Completed 142 bounding boxes', project: 'Urban Driving Dataset', time: '2m ago', type: 'complete' },
  { id: 'a2', user: 'Bob Smith', action: 'Uploaded 500 new frames', project: 'Urban Driving Dataset', time: '15m ago', type: 'upload' },
  { id: 'a3', user: 'Carol Davis', action: 'QA approved batch #412', project: 'Retail Store Analytics', time: '38m ago', type: 'review' },
  { id: 'a4', user: 'AI Assistant', action: 'Auto-tracked 28 objects (94% confidence)', project: 'Warehouse Robotics QC', time: '1h ago', type: 'ai' },
  { id: 'a5', user: 'Dan Wilson', action: 'Rejected 3 annotations (tracking gap)', project: 'Urban Driving Dataset', time: '2h ago', type: 'reject' },
  { id: 'a6', user: 'Eve Park', action: 'Completed semantic segmentation batch', project: 'Medical Imaging', time: '3h ago', type: 'complete' },
];

function loadDark(): boolean {
  try { return localStorage.getItem('gv-dark') !== 'false'; } catch { return true; }
}

export const useAppStore = create<AppStore>((set, get) => ({
  darkMode: loadDark(),
  sidebarCollapsed: false,
  projects: SEED_PROJECTS,
  taxonomy: SEED_TAXONOMY,
  qualityChecks: SEED_CHECKS,
  workflowStages: SEED_WORKFLOW,
  activity: SEED_ACTIVITY,
  loading: false,

  toggleDark: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    try { localStorage.setItem('gv-dark', String(next)); } catch {}
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  loadSeedData: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(20);
      if (!error && data && data.length > 0) {
        // Map DB rows to Project shape if present
        const mapped: Project[] = data.map((d: any) => ({
          id: d.id,
          name: d.name || 'Untitled',
          description: d.description || '',
          type: (d.project_type || '2d') as Project['type'],
          status: (d.status || 'active') as Project['status'],
          priority: (d.priority || 'medium') as Project['priority'],
          progress: 0,
          imageCount: d.image_count || 0,
          annotationCount: d.annotation_count || 0,
          frameCount: d.frame_count || 0,
          assignees: [],
          dueDate: d.due_date || '',
          updatedAt: d.updated_at || '',
        }));
        if (mapped.length > 0) set({ projects: mapped });
      }
    } catch (e) {
      // keep seed data on failure
    }
    set({ loading: false });
  },

  toggleCheck: (id) => set((s) => ({
    qualityChecks: s.qualityChecks.map((c) => c.id === id ? { ...c, status: c.status === 'pass' ? 'fail' : 'pass' } : c),
  })),

  addProject: (p) => set((s) => {
    const newProj: Project = {
      id: 'p' + Date.now(),
      name: p.name || 'New Project',
      description: p.description || '',
      type: p.type || '2d',
      status: 'active',
      priority: p.priority || 'medium',
      progress: 0,
      imageCount: 0,
      annotationCount: 0,
      frameCount: p.frameCount || 0,
      assignees: [],
      dueDate: p.dueDate || '',
      updatedAt: 'just now',
    };
    return { projects: [newProj, ...s.projects] };
  }),

  updateProjectStatus: (id, status) => set((s) => ({
    projects: s.projects.map((p) => p.id === id ? { ...p, status, updatedAt: 'just now' } : p),
  })),
}));
