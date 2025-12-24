export type AnnotationType = "bbox" | "polygon" | "polyline" | "keypoints" | "cuboid" | "cuboid3d";

export interface Keypoint {
  name?: string;
  point: [number, number];
  visible?: boolean;
}

export interface AnnotationBase {
  id: string;
  type: AnnotationType;
  label?: string;
  zOrder?: number;
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface BboxAnnotation extends AnnotationBase {
  type: "bbox";
  // [x_min, y_min, x_max, y_max]
  bbox: [number, number, number, number];
}

export interface PolyAnnotation extends AnnotationBase {
  type: "polygon" | "polyline" | "cuboid";
  points: Array<[number, number]>;
}

export interface KeypointsAnnotation extends AnnotationBase {
  type: "keypoints";
  keypoints: Keypoint[];
}

export interface Cuboid3dAnnotation extends AnnotationBase {
  type: "cuboid3d";
  // center x,y,z and dimensions
  center: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}

export type Annotation =
  | BboxAnnotation
  | PolyAnnotation
  | KeypointsAnnotation
  | Cuboid3dAnnotation;
