export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: 'rectangle' | 'circle' | 'polygon' | 'polyline' | 'text' | 'arrow' | 'ellipse' | 'freehand' | 'point' | 'line' | 'curve' | 'measurement';
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
  imageCount: number;
  annotationCount: number;
  lastModified: Date;
  status: 'active' | 'completed' | 'archived' | 'review';
  thumbnail?: string;
  collaborators?: string[];
  settings?: ProjectSettings;
  exportFormats?: string[];
}

export interface ProjectSettings {
  autoSave: boolean;
  showConfidence: boolean;
  enableAI: boolean;
  defaultStrokeWidth: number;
  defaultFillOpacity: number;
  gridSize: number;
  snapToGrid: boolean;
  showMeasurements: boolean;
}

export interface AnnotationClass {
  id: string;
  name: string;
  color: string;
  description?: string;
  hotkey?: string;
  attributes?: ClassAttribute[];
}

export interface ClassAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  category: 'selection' | 'shapes' | 'drawing' | 'measurement' | 'ai' | 'navigation';
  hotkey?: string;
  description?: string;
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

export type ViewMode = 'projects' | 'annotation-tool' | 'analytics' | 'settings' | 'collaboration' | 'ai-models';
export type AnnotationTool = 'select' | 'bounding-box' | 'polygon' | 'polyline' | 'keypoints' | 'cuboid' | 'cuboid-3d' | 'circle' | 'ellipse' | 'text' | 'point' | 'line' | 'arrow' | 'freehand' | 'measurement' | 'zoom' | 'pan' | 'magic-wand' | 'auto-segment';

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
  points: Array<{
    id: string;
    name: string;
    connections?: string[];
  }>;
  skeleton?: Array<[string, string]>;
}

export interface CuboidFace {
  points: Point[];
  visible: boolean;
}

export interface EditHandle {
  id: string;
  x: number;
  y: number;
  type: 'corner' | 'edge' | 'center' | 'rotate' | 'keypoint';
  cursor: string;
}