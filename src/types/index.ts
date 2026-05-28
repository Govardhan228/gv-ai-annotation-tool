export interface Point {
  x: number;
  y: number;
  z?: number;
}

export type AnnotationType =
  | 'rectangle' | 'circle' | 'polygon' | 'polyline' | 'text' | 'arrow'
  | 'ellipse' | 'freehand' | 'point' | 'line' | 'curve' | 'measurement'
  | 'bounding-box' | 'keypoints' | 'cuboid' | 'cuboid-3d' | 'segmentation'
  | '3d-cuboid' | 'point-cloud-segmentation' | '3d-tracking' | 'bev-annotation'
  | 'lane-annotation' | 'point-classification' | 'sensor-fusion';

export interface Annotation {
  id: string;
  type: AnnotationType;
  label: string;
  points: Point[];
  visible: boolean;
  locked: boolean;
  text?: string;
  fontSize?: number;
  color?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  confidence?: number;
  rotation?: number;
  trackId?: string;
  objectId?: string;
  occlusion?: 'none' | 'partial' | 'heavy' | 'full';
  truncation?: boolean;
  frameIndex?: number;
  zPosition?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
  attributes?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  projectType: '2d' | '3d' | '2d+3d';
  annotationMode: '2d' | '3d' | 'hybrid';
  priority: 'low' | 'medium' | 'high' | 'critical';
  imageCount: number;
  annotationCount: number;
  frameCount: number;
  lastModified: Date;
  dueDate?: Date;
  status: 'active' | 'completed' | 'archived' | 'review' | 'paused';
  thumbnail?: string;
  collaborators?: string[];
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  showConfidence: boolean;
  enableAI: boolean;
  defaultStrokeWidth: number;
  defaultFillOpacity: number;
  gridSize: number;
  snapToGrid: boolean;
  showMeasurements: boolean;
  pixelPerUnit: number;
  measurementUnit: string;
}

export interface AnnotationClass {
  id: string;
  name: string;
  color: string;
  description?: string;
  hotkey?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
  attributes?: ClassAttribute[];
}

export interface ClassAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  sortOrder?: number;
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  category: 'selection' | 'shapes' | 'drawing' | 'measurement' | 'ai' | 'navigation' | '3d';
  hotkey?: string;
  description?: string;
  mode?: '2d' | '3d';
}

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  supportsImages: boolean;
  supportsAnnotations: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  type: 'detection' | 'segmentation' | 'classification';
  description: string;
  confidence: number;
  enabled: boolean;
}

export interface Measurement {
  id: string;
  type: 'distance' | 'area' | 'angle' | 'perimeter';
  value: number;
  unit: string;
  points: Point[];
  label?: string;
}

export type ViewMode = 'dashboard' | 'projects' | 'annotation-2d' | 'annotation-3d' | 'taxonomy' | 'analytics' | 'tasks' | 'qa' | 'team' | 'settings' | 'ai-models';

export type AnnotationTool2D = 'select' | 'bounding-box' | 'polygon' | 'polyline' | 'keypoints' | 'cuboid' | 'circle' | 'ellipse' | 'text' | 'point' | 'line' | 'arrow' | 'freehand' | 'curve' | 'measurement' | 'segmentation' | 'zoom' | 'pan' | 'magic-wand' | 'auto-segment';
export type AnnotationTool3D = '3d-cuboid' | '3d-translate' | '3d-rotate' | '3d-scale' | 'point-selection' | 'ground-plane' | 'auto-track' | 'point-cloud-segmentation' | 'bev-annotation' | 'lane-annotation';
export type AnnotationTool = AnnotationTool2D | AnnotationTool3D;

export interface KeyPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  visible: boolean;
  confidence?: number;
}

export interface KeyPointTemplate {
  id: string;
  name: string;
  points: Array<{ id: string; name: string; connections?: string[] }>;
  skeleton?: Array<[string, string]>;
}

export interface EditHandle {
  id: string;
  x: number;
  y: number;
  type: 'corner' | 'edge' | 'center' | 'rotate' | 'keypoint';
  cursor: string;
}

export interface Task {
  id: string;
  projectId: string;
  assigneeId?: string;
  title: string;
  description: string;
  taskType: 'annotation' | 'review' | 'correction';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'skipped';
  priority: 'low' | 'medium' | 'high' | 'critical';
  frameRange?: string;
  progress: number;
  dueDate?: Date;
  createdAt: Date;
}

export interface Review {
  id: string;
  projectId: string;
  annotationId: string;
  reviewerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  comments: ReviewComment[];
  createdAt: Date;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  authorId: string;
  comment: string;
  category: 'general' | 'geometry' | 'attribute' | 'missing' | 'duplicate' | 'mislabel';
  position?: Point;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'admin' | 'reviewer' | 'annotator' | 'viewer';
  invitedAt: Date;
  acceptedAt?: Date;
}

// Tool definitions for the UI
export const TOOLS_2D: Tool[] = [
  { id: 'select', name: 'Select', icon: 'MousePointer2', category: 'selection', hotkey: 'S' },
  { id: 'bounding-box', name: 'Bounding Box', icon: 'Square', category: 'shapes', hotkey: 'B' },
  { id: 'polygon', name: 'Polygon', icon: 'Pentagon', category: 'shapes', hotkey: 'P' },
  { id: 'polyline', name: 'Polyline', icon: 'Spline', category: 'shapes', hotkey: 'L' },
  { id: 'circle', name: 'Circle', icon: 'Circle', category: 'shapes', hotkey: 'C' },
  { id: 'ellipse', name: 'Ellipse', icon: 'CircleDot', category: 'shapes', hotkey: 'E' },
  { id: 'point', name: 'Point', icon: 'MapPin', category: 'shapes', hotkey: 'O' },
  { id: 'line', name: 'Line', icon: 'Minus', category: 'shapes', hotkey: 'I' },
  { id: 'arrow', name: 'Arrow', icon: 'MoveRight', category: 'shapes', hotkey: 'A' },
  { id: 'freehand', name: 'Freehand', icon: 'Pencil', category: 'drawing', hotkey: 'F' },
  { id: 'curve', name: 'Curve', icon: 'SplineIcon', category: 'drawing', hotkey: 'U' },
  { id: 'segmentation', name: 'Segmentation', icon: 'PaintBucket', category: 'drawing', hotkey: 'G' },
  { id: 'keypoints', name: 'Keypoints', icon: 'GitBranch', category: 'shapes', hotkey: 'K' },
  { id: 'cuboid', name: 'Cuboid', icon: 'Box', category: 'shapes', hotkey: 'D' },
  { id: 'text', name: 'Text', icon: 'Type', category: 'shapes', hotkey: 'T' },
  { id: 'measurement', name: 'Measurement', icon: 'Ruler', category: 'measurement', hotkey: 'M' },
  { id: 'zoom', name: 'Zoom', icon: 'ZoomIn', category: 'navigation', hotkey: 'Z' },
  { id: 'pan', name: 'Pan', icon: 'Hand', category: 'navigation', hotkey: 'H' },
  { id: 'magic-wand', name: 'Magic Wand', icon: 'Wand2', category: 'ai', hotkey: 'W' },
  { id: 'auto-segment', name: 'Auto Segment', icon: 'Sparkles', category: 'ai', hotkey: 'Shift+G' },
];

export const TOOLS_3D: Tool[] = [
  { id: '3d-cuboid', name: '3D Cuboid', icon: 'Box', category: '3d', hotkey: 'B', mode: '3d' },
  { id: '3d-translate', name: 'Translate', icon: 'Move', category: '3d', hotkey: 'G', mode: '3d' },
  { id: '3d-rotate', name: 'Rotate', icon: 'RotateCw', category: '3d', hotkey: 'R', mode: '3d' },
  { id: '3d-scale', name: 'Scale', icon: 'Maximize2', category: '3d', hotkey: 'X', mode: '3d' },
  { id: 'point-selection', name: 'Point Select', icon: 'Crosshair', category: '3d', hotkey: 'Q', mode: '3d' },
  { id: 'ground-plane', name: 'Ground Plane', icon: 'AlignHorizontalSpaceAround', category: '3d', hotkey: 'Shift+P', mode: '3d' },
  { id: 'auto-track', name: 'Auto Track', icon: 'Radar', category: 'ai', hotkey: 'Shift+T', mode: '3d' },
  { id: 'point-cloud-segmentation', name: 'Point Cloud Seg', icon: 'ScatterChart', category: '3d', hotkey: 'Shift+S', mode: '3d' },
  { id: 'bev-annotation', name: 'BEV Annotate', icon: 'LayoutGrid', category: '3d', hotkey: 'Shift+B', mode: '3d' },
  { id: 'lane-annotation', name: 'Lane Annotate', icon: 'Route', category: '3d', hotkey: 'Shift+L', mode: '3d' },
];
