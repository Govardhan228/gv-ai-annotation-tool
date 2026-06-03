/**
 * Enhanced 3D Cuboid Types
 * Defines interfaces for 2D and 3D cuboid operations
 */

export type CuboidDimension = '2d' | '3d';
export type CuboidHandle = 
  | 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br'
  | 'edge-top' | 'edge-bottom' | 'edge-left' | 'edge-right'
  | 'edge-center' | 'center' | 'rotate-handle' | 'scale-handle';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface CuboidDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface Cuboid2D {
  id: string;
  type: 'cuboid-2d';
  points: Array<{ x: number; y: number }>;
  dimensions: Omit<CuboidDimensions, 'depth'>; // 2D cuboid uses projected dimensions
  rotation: number; // Degrees, for 2D perspective
  depthOffset: number; // For 2D projection perspective
  perspective: number; // 0-1, how much perspective effect to apply
  color: string;
  strokeWidth: number;
  fillOpacity: number;
  visible: boolean;
  locked: boolean;
}

export interface Cuboid3D {
  id: string;
  type: 'cuboid-3d';
  position: Vector3D; // Center position in 3D space
  dimensions: CuboidDimensions;
  rotation: Quaternion; // Quaternion for full 3D rotation
  scale: Vector3D; // Non-uniform scaling
  color: string;
  wireframe: boolean;
  visible: boolean;
  locked: boolean;
  properties?: {
    label?: string;
    confidence?: number;
    trackId?: string;
    objectId?: string;
  };
}

export interface CuboidHandle3D {
  id: CuboidHandle;
  position: Vector3D;
  type: 'corner' | 'edge' | 'face' | 'center';
  axis?: 'x' | 'y' | 'z'; // Which axis this handle affects
  cursor: string;
}

export interface CuboidOperationContext {
  cuboid: Cuboid2D | Cuboid3D;
  startPosition: Vector3D;
  currentPosition: Vector3D;
  handle: CuboidHandle;
  operation: 'move' | 'resize' | 'rotate' | 'scale';
  constraint?: 'axis' | 'plane' | 'free'; // Movement constraint
}

export interface CuboidTransformMatrix {
  position: Vector3D;
  rotation: Quaternion;
  scale: Vector3D;
}

export interface CuboidBoundingBox {
  min: Vector3D;
  max: Vector3D;
  center: Vector3D;
  size: Vector3D;
}

// Axis-aligned helpers
export const AXIS = {
  X: { x: 1, y: 0, z: 0 },
  Y: { x: 0, y: 1, z: 0 },
  Z: { x: 0, y: 0, z: 1 },
} as const;

export const DEFAULT_CUBOID_3D: Cuboid3D = {
  id: '',
  type: 'cuboid-3d',
  position: { x: 0, y: 0, z: 0 },
  dimensions: { width: 1, height: 1, depth: 1 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#3b82f6',
  wireframe: false,
  visible: true,
  locked: false,
};
