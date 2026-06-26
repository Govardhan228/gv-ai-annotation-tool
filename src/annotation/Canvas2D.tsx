import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  AnnotationShape, ToolType, Point, ViewTransform, DEFAULT_TRANSFORM,
  genId, screenToImage, imageToScreen, pointInBBox,
  getHandleAt, resizeBBox, getVertexAt, getEdgeAt, hitTest,
  pointsToBBox, distance, fitTransform, HandleId, Vertex,
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
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  fitTrigger?: number;
  actualSizeTrigger?: number;
}

const HANDLE_VISUAL = 8;
const VERTEX_VISUAL = 5;

export default function Canvas2D({
  classes, selectedClass, tool, darkMode, shapes, setShapes, selectedIds, setSelectedIds,
  imageUrl, setImageUrl, onUndo, onRedo, fitTrigger, actualSizeTrigger,
}: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState<ViewTransform>(DEFAULT_TRANSFORM);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [imgMousePos, setImgMousePos] = useState<Point>({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<string>('default');
  const [imgNatural, setImgNatural] = useState<{ width: number; height: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction state
  const drawingRef = useRef(false);
  const dragRef = useRef(false);
  const panningRef = useRef(false);
  const resizingRef = useRef<HandleId | null>(null);
  const vertexDragRef = useRef<number>(-1);
  const lassoRef = useRef<Point[]>([]);
  const startPosRef = useRef<Point>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const tempShapeRef = useRef<AnnotationShape | null>(null);
  const polygonInProgressRef = useRef<Vertex[]>([]);
  const lastMouseRef = useRef<Point>({ x: 0, y: 0 });
  const brushPointsRef = useRef<Point[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiSelectStartRef = useRef<Point | null>(null);
  const multiSelectRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Undo/redo stacks
  const undoStack = useRef<AnnotationShape[][]>([]);
  const redoStack = useRef<AnnotationShape[][]>([]);
  const [_, forceUpdate] = useState(0);
  const reRender = useCallback(() => forceUpdate((n) => n + 1), []);

  // Auto-save
  const autoSaveRef = useRef<number>(0);

  const CLASS_COLORS: Record<string, string> = {};
  classes.forEach((c) => (CLASS_COLORS[c.name] = c.color));
  const getColor = (label: string): string => CLASS_COLORS[label] || '#3b82f6';
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;

  // Load image
  useEffect(() => {
    if (!imageUrl) {
      imgRef.current = null;
      setImgNatural(null);
      setTransform(DEFAULT_TRANSFORM);
      return;
    }
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ width: img.naturalWidth, height: img.naturalHeight });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const t = fitTransform(img.naturalWidth, img.naturalHeight, rect.width, rect.height);
      setTransform(t);
    };
  }, [imageUrl]);

  // Fit trigger
  useEffect(() => {
    if (!imgNatural || !fitTrigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const t = fitTransform(imgNatural.width, imgNatural.height, rect.width, rect.height);
    setTransform(t);
  }, [fitTrigger, imgNatural]);

  // Actual size trigger
  useEffect(() => {
    if (!imgNatural || !actualSizeTrigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setTransform({
      scale: 1,
      offsetX: (rect.width - imgNatural.width) / 2,
      offsetY: (rect.height - imgNatural.height) / 2,
      rotation: 0,
    });
  }, [actualSizeTrigger, imgNatural]);

  // ---- Undo/Redo ----
  const pushUndo = useCallback(() => {
    undoStack.current.push(JSON.parse(JSON.stringify(shapes)));
    if (undoStack.current.length > 200) undoStack.current.shift();
    redoStack.current = [];
  }, [shapes]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev) {
      redoStack.current.push(JSON.parse(JSON.stringify(shapes)));
      setShapes(prev);
      setSelectedIds([]);
    }
  }, [shapes, setShapes, setSelectedIds]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (next) {
      undoStack.current.push(JSON.parse(JSON.stringify(shapes)));
      setShapes(next);
      setSelectedIds([]);
    }
  }, [shapes, setShapes, setSelectedIds]);

  useEffect(() => { if (onUndo) (window as any).__canvasUndo = undo; }, [undo, onUndo]);
  useEffect(() => { if (onRedo) (window as any).__canvasRedo = redo; }, [redo, onRedo]);

  // Auto-save
  useEffect(() => {
    const timer = setInterval(() => {
      autoSaveRef.current = Date.now();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault(); redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          pushUndo();
          setShapes(shapes.filter((s) => !selectedIds.includes(s.id)));
          setSelectedIds([]);
        }
      } else if (e.key === 'Escape') {
        polygonInProgressRef.current = [];
        brushPointsRef.current = [];
        lassoRef.current = [];
        multiSelectStartRef.current = null;
        multiSelectRectRef.current = null;
        setSelectedIds([]);
        setContextMenu({ x: 0, y: 0, visible: false });
        reRender();
      } else if (e.key === 'Enter') {
        const pts = polygonInProgressRef.current;
        if (tool === 'polygon' && pts.length >= 3) {
          pushUndo();
          const newShape: AnnotationShape = {
            id: genId(), type: 'polygon', label: selectedClass,
            color: getColor(selectedClass), points: [...pts],
            visible: true, locked: false,
            createdAt: Date.now(), updatedAt: Date.now(),
          };
          setShapes([...shapes, newShape]);
          setSelectedIds([newShape.id]);
          polygonInProgressRef.current = [];
          reRender();
        } else if (tool === 'polyline' && pts.length >= 2) {
          pushUndo();
          const newShape: AnnotationShape = {
            id: genId(), type: 'polyline', label: selectedClass,
            color: getColor(selectedClass), points: [...pts],
            visible: true, locked: false,
            createdAt: Date.now(), updatedAt: Date.now(),
          };
          setShapes([...shapes, newShape]);
          setSelectedIds([newShape.id]);
          polygonInProgressRef.current = [];
          reRender();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selected = shapes.filter((s) => selectedIds.includes(s.id));
        if (selected.length > 0) {
          (window as any).__canvasClipboard = JSON.parse(JSON.stringify(selected));
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const clipboard = (window as any).__canvasClipboard;
        if (clipboard && clipboard.length > 0) {
          e.preventDefault();
          pushUndo();
          const newIds: string[] = [];
          const pasted = clipboard.map((s: AnnotationShape) => {
            const id = genId();
            newIds.push(id);
            return {
              ...s,
              id,
              bbox: s.bbox ? { ...s.bbox, x: s.bbox.x + 20, y: s.bbox.y + 20 } : undefined,
              point: s.point ? { x: s.point.x + 20, y: s.point.y + 20 } : undefined,
              points: s.points ? s.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })) : undefined,
              createdAt: Date.now(), updatedAt: Date.now(),
            };
          });
          setShapes([...shapes, ...pasted]);
          setSelectedIds(newIds);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const selected = shapes.filter((s) => selectedIds.includes(s.id));
        if (selected.length > 0) {
          pushUndo();
          const newIds: string[] = [];
          const duped = selected.map((s) => {
            const id = genId();
            newIds.push(id);
            return {
              ...s,
              id,
              bbox: s.bbox ? { ...s.bbox, x: s.bbox.x + 20, y: s.bbox.y + 20 } : undefined,
              point: s.point ? { x: s.point.x + 20, y: s.point.y + 20 } : undefined,
              points: s.points ? s.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })) : undefined,
              createdAt: Date.now(), updatedAt: Date.now(),
            };
          });
          setShapes([...shapes, ...duped]);
          setSelectedIds(newIds);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tool, selectedIds, shapes, selectedClass, undo, redo, pushUndo, setShapes, setSelectedIds, reRender]);

  // ---- Zoom/pan ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.002;
        const newScale = Math.max(0.02, Math.min(50, transform.scale * (1 + delta)));
        const factor = newScale / transform.scale;
        setTransform({
          ...transform,
          scale: newScale,
          offsetX: mx - (mx - transform.offsetX) * factor,
          offsetY: my - (my - transform.offsetY) * factor,
        });
      } else {
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

  // ---- Drawing ----
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = darkMode ? '#0f172a' : '#f1f5f9';
    ctx.fillRect(0, 0, cw, ch);

    // Grid
    drawGrid(ctx, cw, ch, transform, darkMode);

    // Image
    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);
    if (imgRef.current && imgNatural) {
      ctx.drawImage(imgRef.current, 0, 0, imgNatural.width, imgNatural.height);
      ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1 / transform.scale;
      ctx.strokeRect(0, 0, imgNatural.width, imgNatural.height);
    }
    ctx.restore();

    // Shapes
    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    for (const shape of shapes) {
      if (!shape.visible) continue;
      drawShape(ctx, shape, selectedIds.includes(shape.id), transform.scale);
    }

    if (tempShapeRef.current) {
      drawShape(ctx, tempShapeRef.current, false, transform.scale, true);
    }

    if (polygonInProgressRef.current.length > 0) {
      drawPolygonInProgress(ctx, polygonInProgressRef.current, getColor(selectedClass), transform.scale);
    }

    if (brushPointsRef.current.length > 0) {
      ctx.beginPath();
      ctx.moveTo(brushPointsRef.current[0].x, brushPointsRef.current[0].y);
      for (let i = 1; i < brushPointsRef.current.length; i++) {
        ctx.lineTo(brushPointsRef.current[i].x, brushPointsRef.current[i].y);
      }
      ctx.strokeStyle = getColor(selectedClass);
      ctx.lineWidth = 2 / transform.scale;
      ctx.stroke();
    }

    if (lassoRef.current.length > 0) {
      ctx.beginPath();
      ctx.moveTo(lassoRef.current[0].x, lassoRef.current[0].y);
      for (let i = 1; i < lassoRef.current.length; i++) {
        ctx.lineTo(lassoRef.current[i].x, lassoRef.current[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = getColor(selectedClass) + '20';
      ctx.fill();
      ctx.strokeStyle = getColor(selectedClass);
      ctx.lineWidth = 1.5 / transform.scale;
      ctx.setLineDash([4 / transform.scale, 4 / transform.scale]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (multiSelectRectRef.current) {
      const r = multiSelectRectRef.current;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1 / transform.scale;
      ctx.setLineDash([4 / transform.scale, 4 / transform.scale]);
      ctx.strokeRect(r.x, r.y, r.width, r.height);
      ctx.fillStyle = '#3b82f615';
      ctx.fillRect(r.x, r.y, r.width, r.height);
      ctx.setLineDash([]);
    }

    ctx.restore();
    ctx.restore();
  }, [shapes, selectedIds, transform, darkMode, selectedClass, imgNatural]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

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
    setContextMenu({ x: 0, y: 0, visible: false });

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      panningRef.current = true;
      setCursor('grabbing');
      return;
    }

    if (tool === 'select') {
      // Check handles first
      if (selectedId) {
        const selected = shapes.find((s) => s.id === selectedId);
        if (selected?.bbox) {
          const handle = getHandleAt(imgPt, selected.bbox, HANDLE_VISUAL / transform.scale);
          if (handle) {
            pushUndo();
            resizingRef.current = handle.id;
            setCursor(handle.cursor);
            return;
          }
        }
        if (selected?.points) {
          const vi = getVertexAt(imgPt, selected.points, HANDLE_VISUAL / transform.scale);
          if (vi >= 0) {
            pushUndo();
            vertexDragRef.current = vi;
            setCursor('move');
            return;
          }
        }
      }

      // Hit test
      const hit = hitTest(imgPt, shapes, 8 / transform.scale);
      if (hit) {
        if (!e.shiftKey && !selectedIds.includes(hit.shapeId)) {
          setSelectedIds([hit.shapeId]);
        } else if (e.shiftKey) {
          setSelectedIds(selectedIds.includes(hit.shapeId) ? selectedIds.filter((id) => id !== hit.shapeId) : [...selectedIds, hit.shapeId]);
        }
        const s = shapes.find((sh) => sh.id === hit.shapeId);
        if (s) {
          let ox = 0, oy = 0;
          if (s.bbox) { ox = imgPt.x - s.bbox.x; oy = imgPt.y - s.bbox.y; }
          else if (s.point) { ox = imgPt.x - s.point.x; oy = imgPt.y - s.point.y; }
          else if (s.points) { ox = imgPt.x - s.points[0].x; oy = imgPt.y - s.points[0].y; }
          dragOffsetRef.current = { x: ox, y: oy };
          pushUndo();
          dragRef.current = true;
          setCursor('move');
        }
      } else {
        if (!e.shiftKey) setSelectedIds([]);
        multiSelectStartRef.current = imgPt;
        setCursor('crosshair');
      }
    } else if (tool === 'bounding-box') {
      drawingRef.current = true;
      const color = getColor(selectedClass);
      tempShapeRef.current = {
        id: 'temp', type: 'bbox', label: selectedClass, color,
        bbox: { x: imgPt.x, y: imgPt.y, width: 0, height: 0 },
        visible: true, locked: false,
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      setCursor('crosshair');
    } else if (tool === 'rotated-box') {
      drawingRef.current = true;
      const color = getColor(selectedClass);
      tempShapeRef.current = {
        id: 'temp', type: 'rotated-box', label: selectedClass, color,
        rotatedBox: { cx: imgPt.x, cy: imgPt.y, width: 0, height: 0, angle: 0 },
        visible: true, locked: false,
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      setCursor('crosshair');
    } else if (tool === 'polygon' || tool === 'smart-polygon' || tool === 'magnetic-polygon') {
      const pts = polygonInProgressRef.current;
      if (pts.length >= 3 && distance(imgPt, pts[0]) <= 8 / transform.scale) {
        pushUndo();
        const newShape: AnnotationShape = {
          id: genId(), type: 'polygon', label: selectedClass,
          color: getColor(selectedClass), points: [...pts],
          visible: true, locked: false,
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        setShapes([...shapes, newShape]);
        setSelectedIds([newShape.id]);
        polygonInProgressRef.current = [];
        reRender();
        return;
      }
      polygonInProgressRef.current.push({ x: imgPt.x, y: imgPt.y });
      reRender();
      setCursor('crosshair');
    } else if (tool === 'polyline') {
      polygonInProgressRef.current.push({ x: imgPt.x, y: imgPt.y });
      reRender();
      setCursor('crosshair');
    } else if (tool === 'point') {
      pushUndo();
      const newShape: AnnotationShape = {
        id: genId(), type: 'point', label: selectedClass,
        color: getColor(selectedClass), point: { x: imgPt.x, y: imgPt.y },
        visible: true, locked: false,
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      setShapes([...shapes, newShape]);
      setSelectedIds([newShape.id]);
    } else if (tool === 'brush') {
      drawingRef.current = true;
      brushPointsRef.current = [{ x: imgPt.x, y: imgPt.y }];
      setCursor('crosshair');
    } else if (tool === 'eraser') {
      const hit = hitTest(imgPt, shapes, 12 / transform.scale);
      if (hit) {
        pushUndo();
        setShapes(shapes.filter((s) => s.id !== hit.shapeId));
        setSelectedIds([]);
      }
    } else if (tool === 'ruler') {
      const pts = polygonInProgressRef.current;
      if (pts.length >= 1) {
        pushUndo();
        const newShape: AnnotationShape = {
          id: genId(), type: 'ruler', label: selectedClass,
          color: getColor(selectedClass), points: [...pts, { x: imgPt.x, y: imgPt.y }],
          visible: true, locked: false,
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        setShapes([...shapes, newShape]);
        setSelectedIds([newShape.id]);
        polygonInProgressRef.current = [];
        reRender();
      } else {
        polygonInProgressRef.current.push({ x: imgPt.x, y: imgPt.y });
        reRender();
        setCursor('crosshair');
      }
    }
  }, [tool, transform, selectedId, selectedIds, shapes, selectedClass, setSelectedIds, setShapes, pushUndo, reRender]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const screenPt = getCanvasPoint(e);
    const imgPt = screenToImage(screenPt.x, screenPt.y, transform);
    setMousePos(screenPt);
    setImgMousePos(imgPt);

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
    } else if (drawingRef.current && tempShapeRef.current?.rotatedBox) {
      const dx = imgPt.x - startPosRef.current.x;
      const dy = imgPt.y - startPosRef.current.y;
      tempShapeRef.current.rotatedBox = {
        ...tempShapeRef.current.rotatedBox,
        width: Math.abs(dx),
        height: Math.abs(dy),
      };
      draw();
    } else if (drawingRef.current && tool === 'brush') {
      brushPointsRef.current.push({ x: imgPt.x, y: imgPt.y });
      draw();
    } else if (dragRef.current && selectedIds.length > 0) {
      const newShapes = [...shapes];
      let changed = false;
      for (const id of selectedIds) {
        const idx = newShapes.findIndex((s) => s.id === id);
        if (idx < 0) continue;
        const s = { ...newShapes[idx] };
        const newX = imgPt.x - dragOffsetRef.current.x;
        const newY = imgPt.y - dragOffsetRef.current.y;
        if (s.bbox) {
          s.bbox = { ...s.bbox, x: newX, y: newY };
        } else if (s.point) {
          s.point = { x: newX, y: newY };
        } else if (s.points) {
          const dx = newX - s.points[0].x;
          const dy = newY - s.points[0].y;
          s.points = s.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
        } else if (s.rotatedBox) {
          s.rotatedBox = { ...s.rotatedBox, cx: newX, cy: newY };
        }
        newShapes[idx] = s;
        changed = true;
      }
      if (changed) setShapes(newShapes);
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
    } else if (multiSelectStartRef.current) {
      const start = multiSelectStartRef.current;
      multiSelectRectRef.current = {
        x: Math.min(start.x, imgPt.x),
        y: Math.min(start.y, imgPt.y),
        width: Math.abs(imgPt.x - start.x),
        height: Math.abs(imgPt.y - start.y),
      };
      draw();
    } else if (tool === 'select') {
      if (selectedId) {
        const selected = shapes.find((s) => s.id === selectedId);
        if (selected?.bbox) {
          const handle = getHandleAt(imgPt, selected.bbox, HANDLE_VISUAL / transform.scale);
          if (handle) { setCursor(handle.cursor); return; }
        }
      }
      const hit = hitTest(imgPt, shapes, 8 / transform.scale);
      setCursor(hit ? 'move' : 'default');
    } else {
      setCursor('crosshair');
      if (tool === 'polygon' || tool === 'polyline' || tool === 'smart-polygon' || tool === 'magnetic-polygon') {
        draw();
      }
    }
    lastMouseRef.current = screenPt;
  }, [tool, transform, selectedId, selectedIds, shapes, setShapes, draw]);

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
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        setShapes([...shapes, newShape]);
        setSelectedIds([newShape.id]);
      }
      tempShapeRef.current = null;
      drawingRef.current = false;
      setCursor('default');
      draw();
    } else if (drawingRef.current && tempShapeRef.current?.rotatedBox) {
      const rb = tempShapeRef.current.rotatedBox;
      if (rb.width > 3 && rb.height > 3) {
        pushUndo();
        const newShape: AnnotationShape = {
          ...tempShapeRef.current,
          id: genId(),
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        setShapes([...shapes, newShape]);
        setSelectedIds([newShape.id]);
      }
      tempShapeRef.current = null;
      drawingRef.current = false;
      setCursor('default');
      draw();
    } else if (drawingRef.current && tool === 'brush') {
      const pts = brushPointsRef.current;
      if (pts.length > 1) {
        pushUndo();
        const newShape: AnnotationShape = {
          id: genId(), type: 'polyline', label: selectedClass,
          color: getColor(selectedClass), points: pts,
          visible: true, locked: false,
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        setShapes([...shapes, newShape]);
        setSelectedIds([newShape.id]);
      }
      brushPointsRef.current = [];
      drawingRef.current = false;
      draw();
    }

    dragRef.current = false;
    resizingRef.current = null;
    vertexDragRef.current = -1;

    if (multiSelectStartRef.current && multiSelectRectRef.current) {
      const r = multiSelectRectRef.current;
      const selected = shapes.filter((s) => {
        if (!s.visible) return false;
        let bb = s.bbox;
        if (!bb && s.points) bb = pointsToBBox(s.points);
        if (!bb) return false;
        return !(bb.x + bb.width < r.x || bb.x > r.x + r.width || bb.y + bb.height < r.y || bb.y > r.y + r.height);
      }).map((s) => s.id);
      if (e.shiftKey) {
        setSelectedIds([...new Set([...selectedIds, ...selected])]);
      } else {
        setSelectedIds(selected);
      }
      multiSelectStartRef.current = null;
      multiSelectRectRef.current = null;
      draw();
    }
  }, [shapes, setShapes, selectedId, selectedIds, setSelectedIds, pushUndo, draw, tool, selectedClass]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
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

    if (tool === 'polygon' || tool === 'smart-polygon' || tool === 'magnetic-polygon') {
      const pts = polygonInProgressRef.current;
      if (pts.length >= 3) {
        pushUndo();
        const newShape: AnnotationShape = {
          id: genId(), type: 'polygon', label: selectedClass,
          color: getColor(selectedClass), points: [...pts],
          visible: true, locked: false,
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        setShapes([...shapes, newShape]);
        setSelectedIds([newShape.id]);
        polygonInProgressRef.current = [];
        reRender();
      }
    } else if (tool === 'polyline') {
      const pts = polygonInProgressRef.current;
      if (pts.length >= 2) {
        pushUndo();
        const newShape: AnnotationShape = {
          id: genId(), type: 'polyline', label: selectedClass,
          color: getColor(selectedClass), points: [...pts],
          visible: true, locked: false,
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        setShapes([...shapes, newShape]);
        setSelectedIds([newShape.id]);
        polygonInProgressRef.current = [];
        reRender();
      }
    }
  }, [tool, selectedId, shapes, selectedClass, setShapes, setSelectedIds, pushUndo, reRender, transform]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const screenPt = getCanvasPoint(e);
    const imgPt = screenToImage(screenPt.x, screenPt.y, transform);
    const hit = hitTest(imgPt, shapes, 8 / transform.scale);
    if (hit) {
      if (!selectedIds.includes(hit.shapeId)) {
        setSelectedIds([hit.shapeId]);
      }
    }
    setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
  }, [shapes, transform, selectedIds, setSelectedIds]);

  const handleContextAction = (action: string) => {
    setContextMenu({ x: 0, y: 0, visible: false });
    if (action === 'delete') {
      if (selectedIds.length > 0) {
        pushUndo();
        setShapes(shapes.filter((s) => !selectedIds.includes(s.id)));
        setSelectedIds([]);
      }
    } else if (action === 'duplicate') {
      const selected = shapes.filter((s) => selectedIds.includes(s.id));
      if (selected.length > 0) {
        pushUndo();
        const newIds: string[] = [];
        const duped = selected.map((s) => {
          const id = genId();
          newIds.push(id);
          return {
            ...s,
            id,
            bbox: s.bbox ? { ...s.bbox, x: s.bbox.x + 20, y: s.bbox.y + 20 } : undefined,
            point: s.point ? { x: s.point.x + 20, y: s.point.y + 20 } : undefined,
            points: s.points ? s.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })) : undefined,
            createdAt: Date.now(), updatedAt: Date.now(),
          };
        });
        setShapes([...shapes, ...duped]);
        setSelectedIds(newIds);
      }
    } else if (action === 'lock') {
      const selected = shapes.filter((s) => selectedIds.includes(s.id));
      const allLocked = selected.every((s) => s.locked);
      setShapes(shapes.map((s) => selectedIds.includes(s.id) ? { ...s, locked: !allLocked } : s));
    } else if (action === 'hide') {
      const selected = shapes.filter((s) => selectedIds.includes(s.id));
      const allVisible = selected.every((s) => s.visible);
      setShapes(shapes.map((s) => selectedIds.includes(s.id) ? { ...s, visible: !allVisible } : s));
    } else if (action === 'copy') {
      const selected = shapes.filter((s) => selectedIds.includes(s.id));
      (window as any).__canvasClipboard = JSON.parse(JSON.stringify(selected));
    } else if (action === 'paste') {
      const clipboard = (window as any).__canvasClipboard;
      if (clipboard && clipboard.length > 0) {
        pushUndo();
        const newIds: string[] = [];
        const pasted = clipboard.map((s: AnnotationShape) => {
          const id = genId();
          newIds.push(id);
          return {
            ...s,
            id,
            bbox: s.bbox ? { ...s.bbox, x: s.bbox.x + 20, y: s.bbox.y + 20 } : undefined,
            point: s.point ? { x: s.point.x + 20, y: s.point.y + 20 } : undefined,
            points: s.points ? s.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })) : undefined,
            createdAt: Date.now(), updatedAt: Date.now(),
          };
        });
        setShapes([...shapes, ...pasted]);
        setSelectedIds(newIds);
      }
    }
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setShapes([]);
    setSelectedIds([]);
    polygonInProgressRef.current = [];
    e.target.value = '';
  }, [setImageUrl, setShapes, setSelectedIds]);

  const clearCanvas = useCallback(() => {
    setShapes([]);
    setSelectedIds([]);
    polygonInProgressRef.current = [];
    brushPointsRef.current = [];
    if (imgRef.current) {
      imgRef.current = null;
      setImageUrl(null);
    }
    draw();
  }, [setShapes, setSelectedIds, setImageUrl, draw]);

  // ---- Drawing helpers ----
  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: ViewTransform, dm: boolean) {
    if (t.scale < 0.2) return;
    const gridSize = 20 * t.scale;
    if (gridSize < 5) return;
    ctx.strokeStyle = dm ? 'rgba(51,65,85,0.25)' : 'rgba(203,213,225,0.35)';
    ctx.lineWidth = 1;
    const startX = t.offsetX % gridSize;
    const startY = t.offsetY % gridSize;
    ctx.beginPath();
    for (let x = startX; x < w; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = startY; y < h; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }

  function drawShape(ctx: CanvasRenderingContext2D, shape: AnnotationShape, isSelected: boolean, scale: number, isTemp = false) {
    const alpha = isTemp ? 0.4 : shape.visible ? 1 : 0.3;
    ctx.globalAlpha = alpha;

    if (shape.type === 'bbox' && shape.bbox) {
      const { x, y, width, height } = shape.bbox;
      ctx.fillStyle = shape.color + '18';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(x, y, width, height);
      if (!isTemp) {
        const fontSize = 12 / scale;
        ctx.font = `${fontSize}px "Inter", sans-serif`;
        const labelW = ctx.measureText(shape.label).width + 10 / scale;
        const labelH = 18 / scale;
        ctx.fillStyle = shape.color;
        ctx.fillRect(x, y - labelH, Math.max(labelW, 44 / scale), labelH);
        ctx.fillStyle = '#fff';
        ctx.fillText(shape.label, x + 5 / scale, y - 5 / scale);
      }
      if (isSelected && !isTemp) {
        const s = HANDLE_VISUAL / scale;
        const hx = [x, x + width / 2, x + width];
        const hy = [y, y + height / 2, y + height];
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (i === 1 && j === 1) continue;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = 2 / scale;
            ctx.fillRect(hx[i] - s / 2, hy[j] - s / 2, s, s);
            ctx.strokeRect(hx[i] - s / 2, hy[j] - s / 2, s, s);
          }
        }
      }
    } else if ((shape.type === 'polygon' || shape.type === 'mask') && shape.points) {
      const pts = shape.points;
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = shape.color + '25';
      ctx.fill();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
      if (!isTemp) {
        const bb = pointsToBBox(pts);
        const fontSize = 12 / scale;
        ctx.font = `${fontSize}px "Inter", sans-serif`;
        ctx.fillStyle = shape.color;
        ctx.fillRect(bb.x, bb.y - 18 / scale, Math.max(ctx.measureText(shape.label).width + 10 / scale, 44 / scale), 18 / scale);
        ctx.fillStyle = '#fff';
        ctx.fillText(shape.label, bb.x + 5 / scale, bb.y - 5 / scale);
      }
      if (isSelected && !isTemp) {
        const r = VERTEX_VISUAL / scale;
        pts.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = 2 / scale;
          ctx.stroke();
        });
      }
    } else if (shape.type === 'polyline' && shape.points) {
      const pts = shape.points;
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
      if (isSelected && !isTemp) {
        const r = VERTEX_VISUAL / scale;
        pts.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = 2 / scale;
          ctx.stroke();
        });
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
    } else if (shape.type === 'ruler' && shape.points && shape.points.length >= 2) {
      const pts = shape.points;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
      const dist = distance(pts[0], pts[pts.length - 1]);
      const midX = (pts[0].x + pts[pts.length - 1].x) / 2;
      const midY = (pts[0].y + pts[pts.length - 1].y) / 2;
      const fontSize = 12 / scale;
      ctx.font = `${fontSize}px "Inter", sans-serif`;
      const text = `${dist.toFixed(1)}px`;
      const tw = ctx.measureText(text).width + 8 / scale;
      ctx.fillStyle = shape.color;
      ctx.fillRect(midX - tw / 2, midY - 10 / scale, tw, 18 / scale);
      ctx.fillStyle = '#fff';
      ctx.fillText(text, midX - tw / 2 + 4 / scale, midY + 3 / scale);
      if (isSelected) {
        const r = VERTEX_VISUAL / scale;
        [pts[0], pts[pts.length - 1]].forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = 2 / scale;
          ctx.stroke();
        });
      }
    } else if (shape.type === 'rotated-box' && shape.rotatedBox) {
      const rb = shape.rotatedBox;
      ctx.save();
      ctx.translate(rb.cx, rb.cy);
      ctx.rotate(rb.angle);
      ctx.fillStyle = shape.color + '18';
      ctx.fillRect(-rb.width / 2, -rb.height / 2, rb.width, rb.height);
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(-rb.width / 2, -rb.height / 2, rb.width, rb.height);
      ctx.restore();
      if (!isTemp) {
        const fontSize = 12 / scale;
        ctx.font = `${fontSize}px "Inter", sans-serif`;
        const labelW = ctx.measureText(shape.label).width + 10 / scale;
        ctx.fillStyle = shape.color;
        ctx.fillRect(rb.cx - labelW / 2, rb.cy - rb.height / 2 - 18 / scale, Math.max(labelW, 44 / scale), 18 / scale);
        ctx.fillStyle = '#fff';
        ctx.fillText(shape.label, rb.cx - labelW / 2 + 5 / scale, rb.cy - rb.height / 2 - 5 / scale);
      }
      if (isSelected && !isTemp) {
        const s = HANDLE_VISUAL / scale;
        const cos = Math.cos(rb.angle);
        const sin = Math.sin(rb.angle);
        const handles = [
          { dx: -rb.width / 2, dy: -rb.height / 2 },
          { dx: 0, dy: -rb.height / 2 },
          { dx: rb.width / 2, dy: -rb.height / 2 },
          { dx: -rb.width / 2, dy: 0 },
          { dx: rb.width / 2, dy: 0 },
          { dx: -rb.width / 2, dy: rb.height / 2 },
          { dx: 0, dy: rb.height / 2 },
          { dx: rb.width / 2, dy: rb.height / 2 },
        ];
        handles.forEach((h) => {
          const hx = rb.cx + h.dx * cos - h.dy * sin;
          const hy = rb.cy + h.dx * sin + h.dy * cos;
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = shape.color;
          ctx.lineWidth = 2 / scale;
          ctx.fillRect(hx - s / 2, hy - s / 2, s, s);
          ctx.strokeRect(hx - s / 2, hy - s / 2, s, s);
        });
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawPolygonInProgress(ctx: CanvasRenderingContext2D, pts: Vertex[], color: string, scale: number) {
    if (pts.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    const lastImg = screenToImage(mousePos.x, mousePos.y, transform);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.lineTo(lastImg.x, lastImg.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const r = VERTEX_VISUAL / scale;
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    });

    if (pts.length >= 3 && distance(lastImg, pts[0]) <= 8 / scale) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, (VERTEX_VISUAL + 4) / scale, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ cursor }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      />

      {/* Empty state */}
      {!imageUrl && shapes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div
            className={`text-center p-10 rounded-2xl border-2 border-dashed max-w-sm pointer-events-auto transition-colors ${darkMode ? 'border-slate-700 bg-slate-900/50 hover:border-slate-500' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setImageUrl(url);
                setShapes([]);
                setSelectedIds([]);
              }
            }}
          >
            <div className={`text-5xl mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>🖼️</div>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Upload an image</h3>
            <p className={`text-sm mb-5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Drag & drop or click to browse</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Browse Images
            </button>
          </div>
        </div>
      )}

      {/* Status bar overlay */}
      <div className={`absolute bottom-2 left-2 px-3 py-1.5 rounded-lg text-xs font-mono pointer-events-none ${darkMode ? 'bg-slate-900/90 text-slate-400' : 'bg-white/90 text-slate-500'} backdrop-blur shadow-sm border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        {Math.round(imgMousePos.x)}, {Math.round(imgMousePos.y)} · Zoom {Math.round(transform.scale * 100)}% · {shapes.length} annotations
      </div>

      {/* Progress hints */}
      {(tool === 'polygon' || tool === 'smart-polygon' || tool === 'magnetic-polygon' || tool === 'polyline') && polygonInProgressRef.current.length > 0 && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs shadow-lg ${darkMode ? 'bg-slate-900/95 text-slate-300 border border-slate-800' : 'bg-white/95 text-slate-700 border border-slate-200'} backdrop-blur`}>
          {polygonInProgressRef.current.length} pts · Click first point or Enter to finish · Esc to cancel
        </div>
      )}
      {tool === 'brush' && brushPointsRef.current.length > 0 && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs shadow-lg ${darkMode ? 'bg-slate-900/95 text-slate-300 border border-slate-800' : 'bg-white/95 text-slate-700 border border-slate-200'} backdrop-blur`}>
          Drawing brush · Release to finish
        </div>
      )}
      {tool === 'ruler' && polygonInProgressRef.current.length === 1 && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs shadow-lg ${darkMode ? 'bg-slate-900/95 text-slate-300 border border-slate-800' : 'bg-white/95 text-slate-700 border border-slate-200'} backdrop-blur`}>
          Click to set end point of measurement
        </div>
      )}

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className={`fixed z-50 rounded-lg shadow-xl border py-1 min-w-[160px] ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {[
            { label: 'Duplicate', action: 'duplicate', shortcut: 'Ctrl+D' },
            { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
            { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
            { label: 'Lock / Unlock', action: 'lock', shortcut: '' },
            { label: 'Hide / Show', action: 'hide', shortcut: '' },
            { label: 'Delete', action: 'delete', shortcut: 'Del' },
          ].map((item) => (
            <button
              key={item.action}
              onClick={() => handleContextAction(item.action)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              <span>{item.label}</span>
              {item.shortcut && <span className={`text-xs ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>{item.shortcut}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu.visible && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu({ x: 0, y: 0, visible: false })} />
      )}
    </div>
  );
}
