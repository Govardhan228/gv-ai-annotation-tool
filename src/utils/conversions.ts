import { Annotation, BboxAnnotation, PolyAnnotation } from "../types/annotation";
import { v4 as uuid } from "uuid";

export function bboxToPolygon(bbox: BboxAnnotation): PolyAnnotation {
  const [x1, y1, x2, y2] = bbox.bbox;
  return {
    id: uuid(),
    type: "polygon",
    points: [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2]
    ],
    label: bbox.label
  };
}

export function polygonToBbox(poly: PolyAnnotation): BboxAnnotation {
  const xs = poly.points.map(p => p[0]);
  const ys = poly.points.map(p => p[1]);
  const x1 = Math.min(...xs);
  const x2 = Math.max(...xs);
  const y1 = Math.min(...ys);
  const y2 = Math.max(...ys);
  return {
    id: uuid(),
    type: "bbox",
    bbox: [x1, y1, x2, y2],
    label: poly.label
  };
}

export function polylineToPolygon(poly: PolyAnnotation): PolyAnnotation {
  // close the polyline
  const pts = poly.points.slice();
  if (pts.length > 2) pts.push(pts[0]);
  return {
    id: uuid(),
    type: "polygon",
    points: pts,
    label: poly.label
  };
}

// Best-effort conversion (returns a new annotation or throws)
export function convertAnnotation(a: Annotation, toType: string): Annotation {
  if (a.type === toType) return a;
  if (a.type === "bbox" && toType === "polygon") {
    return bboxToPolygon(a as BboxAnnotation);
  }
  if (a.type === "polygon" && toType === "bbox") {
    return polygonToBbox(a as PolyAnnotation);
  }
  if (a.type === "polyline" && toType === "polygon") {
    return polylineToPolygon(a as PolyAnnotation);
  }
  if (a.type === "polygon" && toType === "polyline") {
    // polygon to polyline: remove last point if same as first
    const pts = (a as PolyAnnotation).points.slice();
    if (pts.length > 1) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) pts.pop();
    }
    return {
      id: uuid(),
      type: "polyline",
      points: pts,
      label: (a as any).label
    } as any;
  }
  throw new Error(`Conversion ${a.type} -> ${toType} not implemented`);
}
