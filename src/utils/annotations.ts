import { Annotation, Point } from '../types';

export const snapToGrid = (point: Point, gridSize: number): Point => ({
  x: Math.round(point.x / gridSize) * gridSize,
  y: Math.round(point.y / gridSize) * gridSize,
});

export const dist = (p1: Point, p2: Point): number =>
  Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

export const getHitTolerance = (scale: number): number => Math.max(4, 8 / scale);

export const hitRect = (p: Point, pts: Point[], tol: number): boolean => {
  if (pts.length < 2) return false;
  const [a, b] = pts;
  return p.x >= Math.min(a.x, b.x) - tol && p.x <= Math.max(a.x, b.x) + tol &&
    p.y >= Math.min(a.y, b.y) - tol && p.y <= Math.max(a.y, b.y) + tol;
};

export const hitCircle = (p: Point, center: Point, edge: Point, tol: number): boolean =>
  dist(p, center) <= dist(center, edge) + tol;

export const hitPolygon = (p: Point, pts: Point[], tol: number): boolean => {
  if (pointInPolygon(p, pts)) return true;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    if (pointNearLine(p, pts[i], pts[j], tol)) return true;
  }
  return false;
};

const pointInPolygon = (p: Point, poly: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi) / (yj - yi) + xi))
      inside = !inside;
  }
  return inside;
};

const pointNearLine = (p: Point, a: Point, b: Point, tol: number): boolean => {
  const lenSq = Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2);
  if (lenSq === 0) return dist(p, a) <= tol;
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }) <= tol;
};

export const polygonArea = (pts: Point[]): number => {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area / 2);
};

export const perimeter = (pts: Point[]): number => {
  let p = 0;
  for (let i = 0; i < pts.length; i++) p += dist(pts[i], pts[(i + 1) % pts.length]);
  return p;
};

export const validateAnnotation = (ann: Annotation): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const minPts: Record<string, number> = {
    point: 1, line: 2, arrow: 2, rectangle: 2, circle: 2, ellipse: 2,
    polygon: 3, polyline: 2, freehand: 2, measurement: 2, 'bounding-box': 2,
    curve: 3, segmentation: 3,
  };
  const req = minPts[ann.type] || 1;
  if (ann.points.length < req) errors.push(`${ann.type} requires at least ${req} points`);
  ann.points.forEach((pt, i) => {
    if (!isFinite(pt.x) || !isFinite(pt.y)) errors.push(`Point ${i} has invalid coordinates`);
  });
  if (ann.confidence !== undefined && (ann.confidence < 0 || ann.confidence > 1))
    errors.push('Confidence must be 0-1');
  return { valid: errors.length === 0, errors };
};

export const rotatePoint = (p: Point, center: Point, angle: number): Point => {
  const c = Math.cos(angle), s = Math.sin(angle);
  return {
    x: center.x + (p.x - center.x) * c - (p.y - center.y) * s,
    y: center.y + (p.x - center.x) * s + (p.y - center.y) * c,
  };
};

export const bbox = (ann: Annotation): { x: number; y: number; w: number; h: number } => {
  if (!ann.points.length) return { x: 0, y: 0, w: 0, h: 0 };
  const xs = ann.points.map(p => p.x), ys = ann.points.map(p => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
};
