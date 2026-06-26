// Core annotation engine for GV.AI

export type ToolType =
  | 'select'
  | 'bounding-box'
  | 'rotated-box'
  | 'polygon'
  | 'polyline'
  | 'point'
  | 'brush'
  | 'eraser'
  | 'ruler'
  | 'magic-wand'
  | 'smart-polygon'
  | 'keypoint'
  | 'magnetic-polygon'
  | 'sem-seg'
  | 'instance-seg';

export type ShapeType = 'bbox' | 'polygon' | 'polyline' | 'point' | 'mask' | 'ruler' | 'rotated-box';

export interface Point {
  x: number;
  y: number;
}

export interface Vertex {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RotatedBox {
  cx: number;
  cy: number;
  width: number;
  height: number;
  angle: number; // radians
}

export interface AnnotationShape {
  id: string;
  type: ShapeType;
  label: string;
  color: string;
  bbox?: BoundingBox;
  rotatedBox?: RotatedBox;
  points?: Vertex[];
  point?: Point;
  keypoints?: { name: string; point: Point }[];
  trackId?: string;
  frameIndex?: number;
  visible: boolean;
  locked: boolean;
  groupId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

export const DEFAULT_TRANSFORM: ViewTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
};

let idCounter = 0;
export function genId(): string {
  idCounter++;
  return `ann-${Date.now()}-${idCounter}`;
}

let trackCounter = 0;
export function nextTrackId(): string {
  trackCounter++;
  return `TRK-${String(trackCounter).padStart(4, '0')}`;
}

export function screenToImage(
  screenX: number,
  screenY: number,
  transform: ViewTransform
): Point {
  return {
    x: (screenX - transform.offsetX) / transform.scale,
    y: (screenY - transform.offsetY) / transform.scale,
  };
}

export function imageToScreen(
  imgX: number,
  imgY: number,
  transform: ViewTransform
): Point {
  return {
    x: imgX * transform.scale + transform.offsetX,
    y: imgY * transform.scale + transform.offsetY,
  };
}

export function pointInBBox(p: Point, bbox: BoundingBox): boolean {
  return (
    p.x >= bbox.x &&
    p.x <= bbox.x + bbox.width &&
    p.y >= bbox.y &&
    p.y <= bbox.y + bbox.height
  );
}

export function pointsToBBox(points: Vertex[]): BoundingBox {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const proj: Point = { x: a.x + t * dx, y: a.y + t * dy };
  return distance(p, proj);
}

export function pointInPolygon(p: Point, polygon: Vertex[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export type HandleId = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export interface Handle {
  id: HandleId;
  x: number;
  y: number;
  cursor: string;
}

export function getHandles(bbox: BoundingBox): Handle[] {
  const { x, y, width, height } = bbox;
  return [
    { id: 'nw', x, y, cursor: 'nwse-resize' },
    { id: 'n', x: x + width / 2, y, cursor: 'ns-resize' },
    { id: 'ne', x: x + width, y, cursor: 'nesw-resize' },
    { id: 'w', x, y: y + height / 2, cursor: 'ew-resize' },
    { id: 'e', x: x + width, y: y + height / 2, cursor: 'ew-resize' },
    { id: 'sw', x, y: y + height, cursor: 'nesw-resize' },
    { id: 's', x: x + width / 2, y: y + height, cursor: 'ns-resize' },
    { id: 'se', x: x + width, y: y + height, cursor: 'nwse-resize' },
  ];
}

export function getHandleAt(point: Point, bbox: BoundingBox, threshold: number = 8): Handle | null {
  const handles = getHandles(bbox);
  for (const h of handles) {
    if (distance(point, { x: h.x, y: h.y }) <= threshold) {
      return h;
    }
  }
  return null;
}

export function resizeBBox(
  bbox: BoundingBox,
  handle: HandleId,
  delta: Point
): BoundingBox {
  let { x, y, width, height } = bbox;
  const right = x + width;
  const bottom = y + height;

  if (handle.includes('w')) {
    x = Math.min(bbox.x + delta.x, right - 5);
    width = right - x;
  }
  if (handle.includes('e')) {
    width = Math.max(5, width + delta.x);
  }
  if (handle.includes('n')) {
    y = Math.min(bbox.y + delta.y, bottom - 5);
    height = bottom - y;
  }
  if (handle.includes('s')) {
    height = Math.max(5, height + delta.y);
  }

  return { x, y, width, height };
}

export function getVertexAt(point: Point, vertices: Vertex[], threshold: number = 8): number {
  for (let i = 0; i < vertices.length; i++) {
    if (distance(point, vertices[i]) <= threshold) {
      return i;
    }
  }
  return -1;
}

export function getEdgeAt(point: Point, vertices: Vertex[], threshold: number = 6): number {
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    if (distanceToSegment(point, a, b) <= threshold) {
      return i;
    }
  }
  return -1;
}

export interface HitResult {
  shapeId: string;
  type: 'body' | 'handle' | 'vertex';
  handleId?: HandleId;
  vertexIndex?: number;
}

export function hitTest(point: Point, shapes: AnnotationShape[], threshold: number = 8): HitResult | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (!s.visible || s.locked) continue;

    if (s.type === 'bbox' && s.bbox) {
      if (pointInBBox(point, s.bbox)) {
        return { shapeId: s.id, type: 'body' };
      }
    } else if ((s.type === 'polygon' || s.type === 'mask') && s.points) {
      if (s.type === 'polygon' && pointInPolygon(point, s.points)) {
        return { shapeId: s.id, type: 'body' };
      }
      // Check edges
      for (let j = 0; j < s.points.length; j++) {
        const next = (j + 1) % s.points.length;
        if (distanceToSegment(point, s.points[j], s.points[next]) <= threshold) {
          return { shapeId: s.id, type: 'body' };
        }
      }
    } else if (s.type === 'polyline' && s.points) {
      for (let j = 0; j < s.points.length - 1; j++) {
        if (distanceToSegment(point, s.points[j], s.points[j + 1]) <= threshold) {
          return { shapeId: s.id, type: 'body' };
        }
      }
    } else if (s.type === 'point' && s.point) {
      if (distance(point, s.point) <= threshold + 3) {
        return { shapeId: s.id, type: 'body' };
      }
    } else if (s.type === 'ruler' && s.points && s.points.length >= 2) {
      if (distanceToSegment(point, s.points[0], s.points[s.points.length - 1]) <= threshold) {
        return { shapeId: s.id, type: 'body' };
      }
    } else if (s.type === 'rotated-box' && s.rotatedBox) {
      const rb = s.rotatedBox;
      const cos = Math.cos(rb.angle);
      const sin = Math.sin(rb.angle);
      const dx = point.x - rb.cx;
      const dy = point.y - rb.cy;
      const rx = dx * cos + dy * sin;
      const ry = -dx * sin + dy * cos;
      if (Math.abs(rx) <= rb.width / 2 && Math.abs(ry) <= rb.height / 2) {
        return { shapeId: s.id, type: 'body' };
      }
    }
  }
  return null;
}

export function fitTransform(
  imgWidth: number,
  imgHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 20
): ViewTransform {
  if (imgWidth === 0 || imgHeight === 0) return DEFAULT_TRANSFORM;
  const scale = Math.min(
    (canvasWidth - padding * 2) / imgWidth,
    (canvasHeight - padding * 2) / imgHeight
  );
  return {
    scale: Math.max(0.05, scale),
    offsetX: (canvasWidth - imgWidth * scale) / 2,
    offsetY: (canvasHeight - imgHeight * scale) / 2,
    rotation: 0,
  };
}

export function getTransformState(transform: ViewTransform): string {
  return JSON.stringify(transform);
}
