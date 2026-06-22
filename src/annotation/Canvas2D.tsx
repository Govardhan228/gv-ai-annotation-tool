import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  AnnotationShape, ToolType, Point, ViewTransform, DEFAULT_TRANSFORM,
  genId, nextTrackId, screenToImage, imageToScreen, pointInBBox,
  getHandleAt, resizeBBox, getVertexAt, getEdgeAt, hitTest,
  pointsToBBox, distance, HandleId, Vertex,
} from '../annotation/engine';

interface AnnotationClass {
  name: string;
  color: string;
}

interface Canvas2DProps {
  classes: AnnotationClass[];
  selectedClass: string;
  tool: ToolType;
  darkMode: boolean;
  shapes: AnnotationShape[];
  setShapes: (s: AnnotationShape[]) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

const HANDLE_SIZE = 8;
const VERTEX_RADIUS = 5;

export default function Canvas2D({
  classes, selectedClass, tool, darkMode, shapes, setShapes, selectedId, setSelectedId,
}: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<ViewTransform>(DEFAULT_TRANSFORM);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [imgMousePos, setImgMousePos] = useState<Point>({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<string>('default');

  // Interaction state
  const drawingRef = useRef(false);
  const dragRef = useRef(false);
  const panningRef = useRef(false);
  const resizingRef = useRef<HandleId | null>(null);
  const vertexDragRef = useRef<number>(-1);
  const startPosRef = useRef<Point>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const tempShapeRef = useRef<AnnotationShape | null>(null);
  const polygonInProgressRef = useRef<Vertex[]>([]);
  const lastMouseRef = useRef<Point>({ x: 0, y: 0 });

  // Undo/redo stacks
  const undoStack = useRef<AnnotationShape[][]>([]);
  const redoStack = useRef<AnnotationShape[][]>([]);
  const [, forceUpdate] = useState(0);
  const reRender = useCallback(() => forceUpdate((n) => n + 1), []);

  const CLASS_COLORS: Record<string, string> = {};
  classes.forEach((c) => (CLASS_COLORS[c.name] = c.color));

  const getColor = (label: string): string => CLASS_COLORS[label] || '#3b82f6';

  // ---- Undo/Redo ----
  const pushUndo = useCallback(() => {
    undoStack.current.push(JSON.parse(JSON.stringify(shapes)));
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
  }, [shapes]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev) {
      redoStack.current.push(JSON.parse(JSON.stringify(shapes)));
      setShapes(prev);
      setSelectedId(null);
    }
  }, [shapes, setShapes, setSelectedId]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (next) {
      undoStack.current.push(JSON.parse(JSON.stringify(shapes)));
      setShapes(next);
      setSelectedId(null);
    }
  }, [shapes, setShapes, setSelectedId]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          pushUndo();
          setShapes(shapes.filter((s) => s.id !== selectedId));
          setSelectedId(null);
        }
      } else if (e.key === 'Escape') {
        polygonInProgressRef.current = [];
        setSelectedId(null);
        reRender();
      } else if (tool === 'polygon' && e.key === 'Enter') {
        // Finish polygon
        const pts = polygonInProgressRef.current;
        if (pts.length >= 3) {
          pushUndo();
          const newShape: AnnotationShape = {
            id: genId(),
            type: 'polygon',
            label: selectedClass,
            color: getColor(selectedClass),
            points: [...pts],
            visible: true,
            locked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setShapes([...shapes, newShape]);
          setSelectedId(newShape.id);
          polygonInProgressRef.current = [];
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tool, selectedId, shapes, selectedClass, undo, redo, pushUndo, setShapes, setSelectedId, reRender]);

  // ---- Zoom/pan with wheel and middle-click ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const delta = -e.deltaY * 0.002;
        const newScale = Math.max(0.1, Math.min(20, transform.scale * (1 + delta)));
        const factor = newScale / transform.scale;
        setTransform({
          scale: newScale,
          offsetX: mx - (mx - transform.offsetX) * factor,
          offsetY: my - (my - transform.offsetY) * factor,
        });
      } else {
        // Pan
        setTransform({
          ...transform,
          offsetX: transform.offsetX - e.deltaX,
          offsetY: transform.offsetY - e.deltaY,
        });
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [transform]);

  // ---- Drawing/rendering ----
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear
    const bg = darkMode ? '#0f172a' : '#f1f5f9';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Grid
    drawGrid(ctx, rect.width, rect.height, transform, darkMode);

    // Apply transform
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    // Draw all shapes
    for (const shape of shapes) {
      if (!shape.visible) continue;
      drawShape(ctx, shape, shape.id === selectedId, transform.scale);
    }

    // Draw temp shape (being drawn)
    if (tempShapeRef.current) {
      drawShape(ctx, tempShapeRef.current, false, transform.scale, true);
    }

    // Draw polygon in progress
    if (polygonInProgressRef.current.length > 0) {
      drawPolygonInProgress(ctx, polygonInProgressRef.current, getColor(selectedClass), transform.scale);
    }

    // Draw cursor crosshair when drawing
    if (drawingRef.current && tempShapeRef.current) {
      // Already drawn
    }

    ctx.restore();
  }, [shapes, selectedId, transform, darkMode, selectedClass]);

  useEffect(() => { draw(); }, [draw]);

  // ---- Mouse handlers ----
  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const screenPt = getCanvasPoint(e);
    const imgPt = screenToImage(screenPt.x, screenPt.y, transform);
    startPosRef.current = imgPt;
    lastMouseRef.current = screenPt;

    // Middle button or space-pan: pan
    if (e.button === 1 || (e.button === 0 && tool === 'pan') || (e.button === 0 && e.altKey)) {
      panningRef.current = true;
      lastMouseRef.current = screenPt;
      setCursor('grabbing');
      return;
    }

    if (tool === 'select') {
      // Check handles of selected shape
      if (selectedId) {
        const selected = shapes.find((s) => s.id === selectedId);
        if (selected?.bbox) {
          const handle = getHandleAt(imgPt, selected.bbox, 8 / transform.scale);
          if (handle) {
            pushUndo();
            resizingRef.current = handle.id;
            setCursor(handle.cursor);
            return;
          }
        }
        if (selected?.points) {
          const vi = getVertexAt(imgPt, selected.points, 8 / transform.scale);
          if (vi >= 0) {
            pushUndo();
            vertexDragRef.current = vi;
            setCursor('move');
            return;
          }
        }
      }

      // Hit test shapes
      const hit = hitTest(imgPt, shapes, 8 / transform.scale);
      if (hit) {
        setSelectedId(hit.shapeId);
        const s = shapes.find((sh) => sh.id === hit.shapeId);
        if (s) {
          dragOffsetRef.current = { x: imgPt.x - (s.bbox?.x || s.point?.x || s.points?.[0]?.x || 0), y: imgPt.y - (s.bbox?.y || s.point?.y || s.points?.[0]?.y || 0) };
          pushUndo();
          dragRef.current = true;
          setCursor('move');
        }
      } else {
        setSelectedId(null);
      }
    } else if (tool === 'bounding-box') {
      drawingRef.current = true;
      const color = getColor(selectedClass);
      tempShapeRef.current = {
        id: 'temp',
        type: 'bbox',
        label: selectedClass,
        color,
        bbox: { x: imgPt.x, y: imgPt.y, width: 0, height: 0 },
        visible: true,
        locked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setCursor('crosshair');
    } else if (tool === 'polygon' || tool === 'polyline') {
      // Check if clicking near first point to close
      const pts = polygonInProgressRef.current;
      if (pts.length >= 3 && distance(imgPt, pts[0]) <= 8 / transform.scale) {
        if (tool === 'polygon') {
          pushUndo();
          const newShape: AnnotationShape = {
            id: genId(),
            type: 'polygon',
            label: selectedClass,
            color: getColor(selectedClass),
            points: [...pts],
            visible: true,
            locked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setShapes([...shapes, newShape]);
          setSelectedId(newShape.id);
          polygonInProgressRef.current = [];
          reRender();
        }
        return;
      }
      polygonInProgressRef.current.push({ x: imgPt.x, y: imgPt.y });
      reRender();
      setCursor('crosshair');
    } else if (tool === 'point') {
      pushUndo();
      const newShape: AnnotationShape = {
        id: genId(),
        type: 'point',
        label: selectedClass,
        color: getColor(selectedClass),
        point: { x: imgPt.x, y: imgPt.y },
        visible: true,
        locked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setShapes([...shapes, newShape]);
      setSelectedId(newShape.id);
    }
  }, [tool, transform, selectedId, shapes, selectedClass, setSelectedId, setShapes, pushUndo, reRender]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const screenPt = getCanvasPoint(e);
    const imgPt = screenToImage(screenPt.x, screenPt.y, transform);
    setMousePos(screenPt);
    setImgMousePos(imgPt);
    lastMouseRef.current = screenPt;

    if (panningRef.current) {
      setTransform((prev) => ({
        ...prev,
        offsetX: prev.offsetX + (screenPt.x - lastMouseRef.current.x),
        offsetY: prev.offsetY + (screenPt.y - lastMouseRef.current.y),
      }));
      lastMouseRef.current = screenPt;
      return;
    }

    if (drawingRef.current && tempShapeRef.current?.bbox) {
      const dx = imgPt.x - startPosRef.current.x;
      const dy = imgPt.y - startPosRef.current.y;
      tempShapeRef.current.bbox = {
        x: Math.min(startPosRef.current.x, imgPt.x),
        y: Math.min(startPosRef.current.y, imgPt.y),
        width: Math.abs(dx),
        height: Math.abs(dy),
      };
      draw();
    } else if (dragRef.current && selectedId) {
      const idx = shapes.findIndex((s) => s.id === selectedId);
      if (idx >= 0) {
        const s = { ...shapes[idx] };
        const dx = imgPt.x - dragOffsetRef.current.x;
        const dy = imgPt.y - dragOffsetRef.current.y;
        if (s.bbox) {
          s.bbox = { ...s.bbox, x: dx, y: dy };
        } else if (s.point) {
          s.point = { x: dx, y: dy };
        } else if (s.points) {
          const origBBox = pointsToBBox(shapes[idx].points!);
          const newBBox = pointsToBBox(s.points);
          const offX = dx - origBBox.x;
          const offY = dy - origBBox.y;
          s.points = s.points.map((p) => ({ x: p.x + offX, y: p.y + offY }));
        }
        const newShapes = [...shapes];
        newShapes[idx] = s;
        setShapes(newShapes);
      }
    } else if (resizingRef.current && selectedId) {
      const idx = shapes.findIndex((s) => s.id === selectedId);
      if (idx >= 0 && shapes[idx].bbox) {
        const delta = { x: imgPt.x - startPosRef.current.x, y: imgPt.y - startPosRef.current.y };
        const newBBox = resizeBBox(shapes[idx].bbox!, resizingRef.current, delta);
        const newShapes = [...shapes];
        newShapes[idx] = { ...newShapes[idx], bbox: newBBox };
        setShapes(newShapes);
        startPosRef.current = imgPt;
      }
    } else if (vertexDragRef.current >= 0 && selectedId) {
      const idx = shapes.findIndex((s) => s.id === selectedId);
      if (idx >= 0 && shapes[idx].points) {
        const vi = vertexDragRef.current;
        const newShapes = [...shapes];
        const newPoints = [...shapes[idx].points!];
        newPoints[vi] = { x: imgPt.x, y: imgPt.y };
        newShapes[idx] = { ...newShapes[idx], points: newPoints };
        setShapes(newShapes);
      }
    } else if (tool === 'select') {
      // Update cursor for hover
      if (selectedId) {
        const selected = shapes.find((s) => s.id === selectedId);
        if (selected?.bbox) {
          const handle = getHandleAt(imgPt, selected.bbox, 8 / transform.scale);
          if (handle) { setCursor(handle.cursor); return; }
        }
      }
      const hit = hitTest(imgPt, shapes, 8 / transform.scale);
      setCursor(hit ? 'move' : 'default');
    } else if (tool === 'polygon' || tool === 'polyline') {
      setCursor('crosshair');
      draw(); // re-render to show preview line
    }
  }, [tool, transform, selectedId, shapes, setShapes, draw]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (panningRef.current) {
      panningRef.current = false;
      setCursor(tool === 'select' ? 'default' : 'crosshair');
      return;
    }

    if (drawingRef.current && tempShapeRef.current?.bbox) {
      const bbox = tempShapeRef.current.bbox;
      if (bbox.width > 3 && bbox.height > 3) {
        pushUndo();
        const newShape: AnnotationShape = {
          ...tempShapeRef.current,
          id: genId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setShapes([...shapes, newShape]);
        setSelectedId(newShape.id);
      }
      tempShapeRef.current = null;
      drawingRef.current = false;
      setCursor('default');
      draw();
    }

    dragRef.current = false;
    resizingRef.current = null;
    vertexDragRef.current = -1;
  }, [shapes, setShapes, selectedId, setSelectedId, pushUndo, draw, tool]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (tool === 'polygon' || tool === 'polyline') {
      const pts = polygonInProgressRef.current;
      if (pts.length >= (tool === 'polygon' ? 3 : 2)) {
        pushUndo();
        const newShape: AnnotationShape = {
          id: genId(),
          type: tool === 'polygon' ? 'polygon' : 'polyline',
          label: selectedClass,
          color: getColor(selectedClass),
          points: [...pts],
          visible: true,
          locked: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setShapes([...shapes, newShape]);
        setSelectedId(newShape.id);
        polygonInProgressRef.current = [];
        reRender();
      }
    }
  }, [tool, selectedClass, shapes, setShapes, setSelectedId, pushUndo, reRender]);

  // ---- Drawing helpers ----
  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: ViewTransform, dm: boolean) {
    if (t.scale < 0.3) return;
    const gridSize = 20 * t.scale;
    if (gridSize < 5) return;
    ctx.strokeStyle = dm ? 'rgba(51,65,85,0.3)' : 'rgba(203,213,225,0.4)';
    ctx.lineWidth = 1;
    const startX = t.offsetX % gridSize;
    const startY = t.offsetY % gridSize;
    ctx.beginPath();
    for (let x = startX; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = startY; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }

  function drawShape(ctx: CanvasRenderingContext2D, shape: AnnotationShape, isSelected: boolean, scale: number, isTemp = false) {
    const alpha = isTemp ? 0.4 : shape.visible ? 1 : 0.3;
    ctx.globalAlpha = alpha;

    if (shape.type === 'bbox' && shape.bbox) {
      const { x, y, width, height } = shape.bbox;
      // Fill
      ctx.fillStyle = shape.color + '20';
      ctx.fillRect(x, y, width, height);
      // Border
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(x, y, width, height);

      // Label
      if (!isTemp) {
        const fontSize = 12 / scale;
        ctx.font = `${fontSize}px sans-serif`;
        const labelW = ctx.measureText(shape.label).width + 8 / scale;
        const labelH = 16 / scale;
        ctx.fillStyle = shape.color;
        ctx.fillRect(x, y - labelH, Math.max(labelW, 40 / scale), labelH);
        ctx.fillStyle = '#fff';
        ctx.fillText(shape.label, x + 4 / scale, y - 4 / scale);
      }

      if (isSelected && !isTemp) {
        drawHandles(ctx, shape.bbox, scale);
      }
    } else if ((shape.type === 'polygon' || shape.type === 'polyline' || shape.type === 'mask') && shape.points) {
      const pts = shape.points;
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      if (shape.type === 'polygon' || shape.type === 'mask') {
        ctx.closePath();
      }

      if (shape.type === 'mask' || shape.type === 'polygon') {
        ctx.fillStyle = shape.color + '30';
        ctx.fill();
      }
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();

      // Label
      if (!isTemp && shape.type === 'polygon') {
        const bb = pointsToBBox(pts);
        const fontSize = 12 / scale;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = shape.color;
        ctx.fillRect(bb.x, bb.y - 16 / scale, Math.max(ctx.measureText(shape.label).width + 8 / scale, 40 / scale), 16 / scale);
        ctx.fillStyle = '#fff';
        ctx.fillText(shape.label, bb.x + 4 / scale, bb.y - 4 / scale);
      }

      if (isSelected && !isTemp) {
        drawVertices(ctx, pts, scale);
      }
    } else if (shape.type === 'point' && shape.point) {
      ctx.beginPath();
      ctx.arc(shape.point.x, shape.point.y, 5 / scale, 0, Math.PI * 2);
      ctx.fillStyle = shape.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5 / scale;
      ctx.stroke();

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(shape.point.x, shape.point.y, 10 / scale, 0, Math.PI * 2);
        ctx.strokeStyle = shape.color;
        ctx.setLineDash([4 / scale, 4 / scale]);
        ctx.lineWidth = 1.5 / scale;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawHandles(ctx: CanvasRenderingContext2D, bbox: { x: number; y: number; width: number; height: number }, scale: number) {
    const s = HANDLE_SIZE / scale;
    const handles = [
      [bbox.x, bbox.y],
      [bbox.x + bbox.width / 2, bbox.y],
      [bbox.x + bbox.width, bbox.y],
      [bbox.x, bbox.y + bbox.height / 2],
      [bbox.x + bbox.width, bbox.y + bbox.height / 2],
      [bbox.x, bbox.y + bbox.height],
      [bbox.x + bbox.width / 2, bbox.y + bbox.height],
      [bbox.x + bbox.width, bbox.y + bbox.height],
    ];
    handles.forEach(([hx, hy]) => {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / scale;
      ctx.fillRect(hx - s / 2, hy - s / 2, s, s);
      ctx.strokeRect(hx - s / 2, hy - s / 2, s, s);
    });
  }

  function drawVertices(ctx: CanvasRenderingContext2D, pts: Vertex[], scale: number) {
    const r = VERTEX_RADIUS / scale;
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    });
  }

  function drawPolygonInProgress(ctx: CanvasRenderingContext2D, pts: Vertex[], color: string, scale: number) {
    if (pts.length === 0) {
      // Show cursor preview
      return;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    // Dashed line to current mouse
    const lastImg = screenToImage(mousePos.x, mousePos.y, transform);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.lineTo(lastImg.x, lastImg.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw vertices
    drawVertices(ctx, pts, scale);

    // Highlight first vertex if near
    if (pts.length >= 3) {
      const lastImg2 = screenToImage(mousePos.x, mousePos.y, transform);
      if (distance(lastImg2, pts[0]) <= 8 / scale) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, (VERTEX_RADIUS + 4) / scale, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
    }
  }

  // Double-click to insert vertex on selected polygon edge
  const onCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (tool === 'select' && selectedId) {
      const screenPt = getCanvasPoint(e);
      const imgPt = screenToImage(screenPt.x, screenPt.y, transform);
      const idx = shapes.findIndex((s) => s.id === selectedId);
      if (idx >= 0 && shapes[idx].points) {
        const edgeIdx = getEdgeAt(imgPt, shapes[idx].points!, 6 / transform.scale);
        if (edgeIdx >= 0) {
          pushUndo();
          const newPts = [...shapes[idx].points!];
          newPts.splice(edgeIdx + 1, 0, { x: imgPt.x, y: imgPt.y });
          const newShapes = [...shapes];
          newShapes[idx] = { ...newShapes[idx], points: newPts };
          setShapes(newShapes);
          return;
        }
      }
    }
    onDoubleClick(e);
  }, [tool, selectedId, shapes, transform, setShapes, pushUndo, onDoubleClick]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onCanvasDoubleClick}
      />
      {/* Status overlay */}
      <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-mono pointer-events-none ${darkMode ? 'bg-slate-900/80 text-slate-400' : 'bg-white/80 text-slate-500'} backdrop-blur`}>
        {Math.round(imgMousePos.x)}, {Math.round(imgMousePos.y)} · Zoom: {Math.round(transform.scale * 100)}% · {shapes.length} annotations
      </div>
      {/* Polygon hint */}
      {tool === 'polygon' && polygonInProgressRef.current.length > 0 && (
        <div className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'bg-slate-900/90 text-slate-300' : 'bg-white/90 text-slate-700'} backdrop-blur shadow-lg`}>
          Click to add vertices · Click first point or Enter to close · {polygonInProgressRef.current.length} points · Esc to cancel
        </div>
      )}
    </div>
  );
}
