/**
 * Utility: Mask Rendering Helper
 * Functions for rendering polygon masks on canvas
 */

import { PolygonMaskAnnotation, MaskRenderOptions } from '../types/polygon-mask';

export class MaskRenderer {
  /**
   * Render a polygon mask on canvas context
   */
  static renderMask(
    ctx: CanvasRenderingContext2D,
    mask: PolygonMaskAnnotation,
    options: MaskRenderOptions,
    scale: number = 1,
    offset: { x: number; y: number } = { x: 0, y: 0 }
  ): void {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);

    // Draw filled mask
    if (mask.points.length >= 2) {
      ctx.fillStyle = this.hexToRgba(options.color, options.opacity);
      ctx.beginPath();
      ctx.moveTo(mask.points[0].x, mask.points[0].y);

      for (let i = 1; i < mask.points.length; i++) {
        ctx.lineTo(mask.points[i].x, mask.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Draw boundary if enabled
    if (options.drawBoundary && mask.points.length >= 2) {
      ctx.strokeStyle = options.boundaryColor;
      ctx.lineWidth = options.boundaryWidth;
      ctx.beginPath();
      ctx.moveTo(mask.points[0].x, mask.points[0].y);

      for (let i = 1; i < mask.points.length; i++) {
        ctx.lineTo(mask.points[i].x, mask.points[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw vertices as small circles
    mask.points.forEach((point, index) => {
      ctx.fillStyle = options.boundaryColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw point index if small
      if (mask.points.length <= 10) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(index.toString(), point.x, point.y);
      }
    });

    ctx.restore();
  }

  /**
   * Create mask image data for export
   */
  static createMaskImageData(
    mask: PolygonMaskAnnotation,
    imageWidth: number,
    imageHeight: number,
    backgroundColor: string = '#ffffff'
  ): ImageData {
    const canvas = new OffscreenCanvas(imageWidth, imageHeight);
    const ctx = canvas.getContext('2d')!;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, imageWidth, imageHeight);

    // Draw mask polygon
    if (mask.points.length >= 2) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(mask.points[0].x, mask.points[0].y);

      for (let i = 1; i < mask.points.length; i++) {
        ctx.lineTo(mask.points[i].x, mask.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }

    return ctx.getImageData(0, 0, imageWidth, imageHeight);
  }

  /**
   * Convert mask to binary representation
   */
  static getMaskBinaryData(
    imageData: ImageData,
    threshold: number = 128
  ): Uint8Array {
    const data = imageData.data;
    const binary = new Uint8Array(imageData.width * imageData.height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = (r + g + b) / 3;
      binary[i / 4] = gray > threshold ? 255 : 0;
    }

    return binary;
  }

  /**
   * Convert hex color to RGBA string
   */
  private static hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Check if point is inside polygon (for hit testing)
   */
  static isPointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>): boolean {
    const { x, y } = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }
}

/**
 * Polygon simplification using Douglas-Peucker algorithm
 */
export function simplifyPolygon(points: Array<{ x: number; y: number }>, epsilon: number = 1.0): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;

  const line = {
    start: points[0],
    end: points[points.length - 1],
  };

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], line);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolygon(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPolygon(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function perpendicularDistance(
  point: { x: number; y: number },
  line: { start: { x: number; y: number }; end: { x: number; y: number } }
): number {
  const { x, y } = point;
  const { start, end } = line;
  const A = x - start.x;
  const B = y - start.y;
  const C = end.x - start.x;
  const D = end.y - start.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = start.x;
    yy = start.y;
  } else if (param > 1) {
    xx = end.x;
    yy = end.y;
  } else {
    xx = start.x + param * C;
    yy = start.y + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

export default MaskRenderer;
