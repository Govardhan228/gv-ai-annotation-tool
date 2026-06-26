import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  AnnotationShape, ToolType, Point, ViewTransform, DEFAULT_TRANSFORM,
  genId, screenToImage, imageToScreen, pointInBBox,
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
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
}

const HANDLE_SIZE = 8;
const VERTEX_RADIUS = 5;

export default function Canvas2D({
  classes, selectedClass, tool, darkMode, shapes, setShapes, selectedId, setSelectedId,
  imageUrl, setImageUrl,
}: Canvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState<ViewTransform>(DEFAULT_TRANSFORM);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [imgMousePos, setImgMousePos] = useState<Point>({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<string>('default');
  const [imgNatural, setImgNatural] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Interaction state
  const drawingRef = useRef(false);
  const dragRef = useRef(false);
  const panningRef = useRef(false);
  const resizingRef = useRef<HandleId | null>(null);
  const vertexDragRef = useRef<number>(-1);
  const startPosRef = useRef<Point>({ x: 0, y: 0 });
  const dragStartPosRef = useRef<Point>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const tempShapeRef = useRef<AnnotationShape | null>(null);
  const polygonInProgressRef = useRef<Vertex[]>([]);
  const lastMouseRef = useRef<Point>({ x: 0, y: 0 });
  const brushPointsRef = useRef<Point[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Undo/redo stacks
  const undoStack = useRef<AnnotationShape[][]>([]);
  const redoStack = useRef<AnnotationShape[][]>([]);
  const [, forceUpdate] = useState(0);
  const reRender = useCallback(() => forceUpdate((n) => n + 1), []);

  const CLASS_COLORS: Record<string, string> = {};
  classes.forEach((c) => (CLASS_COLORS[c.name] = c.color));
  const getColor = (label: string): string => CLASS_COLORS[label] || '#3b82f6';

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
      // Center image
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(1, rect.width / img.naturalWidth, rect.height / img.naturalHeight);
      setTransform({
        scale,
        offsetX: (rect.width - img.naturalWidth * scale) / 2,
        offsetY: (rect.height - img.naturalHeight * scale) / 2,
      });
    };
  }, [imageUrl]);

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

  // Expose undo/redo to parent
  useEffect(() => {
    (window as any).__canvasUndo = undo;
    (window as any).__canvasRedo = redo;
  }, [undo, redo]);

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
        if (selectedId) {
          e.preventDefault();
          pushUndo();
          setShapes(shapes.filter((s) => s.id !== selectedId));
          setSelectedId(null);
        }
      } else if (e.key === 'Escape') {
        polygonInProgressRef.current = [];
        brushPointsRef.current = [];
        setSelectedId(null);
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
          setSelectedId(newShape.id);
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
          setSelectedId(newShape.id);
          polygonInProgressRef.current = [];
          reRender();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tool, selectedId, shapes, selectedClass, undo, redo, pushUndo, setShapes, setSelectedId, reRender]);

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
        const newScale = Math.max(0.1, Math.min(20, transform.scale * (1 + delta)));
        const factor = newScale / transform.scale;
        setTransform({
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

    // Background
    const bg = darkMode ? '#0f172a' : '#f1f5f9';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    // Draw image
    if (imgRef.current && imgNatural) {
      ctx.drawImage(imgRef.current, 0, 0, imgNatural.width, imgNatural.height);
      // Image border
      ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1 / transform.scale;
      ctx.strokeRect(0, 0, imgNatural.width, imgNatural.height);
    }

    ctx.restore();

    // Grid
    drawGrid(ctx, rect.width, rect.height, transform, darkMode);

    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    // Draw all shapes
    for (const shape of shapes) {
      if (!shape.visible) continue;
      drawShape(ctx, shape, shape.id === selectedId, transform.scale);
    }

    // Draw temp shape
    if (tempShapeRef.current) {
      drawShape(ctx, tempShapeRef.current, false, transform.scale, true);
    }

    // Draw polygon in progress
    if (polygonInProgressRef.current.length > 0) {
      drawPolygonInProgress(ctx, polygonInProgressRef.current, getColor(selectedClass), transform.scale);
    }

    // Draw brush in progress
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

    ctx.restore();
    ctx.restore();
  }, [shapes, selectedId, transform, darkMode, selectedClass, imgNatural]);

  useEffect(() => { draw(); }, [draw]);

  // Resize observer for redraw
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
    dragStartPosRef.current = imgPt;
    lastMouseRef.current = screenPt;

    // Pan: middle mouse, Alt+drag, or space tool
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
          // Store offset from mouse to shape origin
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
        setSelectedId(null);
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
    } else if (tool === 'polygon') {
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
        setSelectedId(newShape.id);
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
      setSelectedId(newShape.id);
    } else if (tool === 'brush') {
      drawingRef.current = true;
      brushPointsRef.current = [{ x: imgPt.x, y: imgPt.y }];
      setCursor('crosshair');
    } else if (tool === 'eraser') {
      // Simple eraser: delete shapes under cursor
      const hit = hitTest(imgPt, shapes, 12 / transform.scale);
      if (hit) {
        pushUndo();
        setShapes(shapes.filter((s) => s.id !== hit.shapeId));
        setSelectedId(null);
      }
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
    } else if (drawingRef.current && tool === 'brush') {
      brushPointsRef.current.push({ x: imgPt.x, y: imgPt.y });
      draw();
    } else if (dragRef.current && selectedId) {
      const idx = shapes.findIndex((s) => s.id === selectedId);
      if (idx >= 0) {
        const s = { ...shapes[idx] };
        const newX = imgPt.x - dragOffsetRef.current.x;
        const newY = imgPt.y - dragOffsetRef.current.y;
        if (s.bbox) {
          s.bbox = { ...s.bbox, x: newX, y: newY };
        } else if (s.point) {
          s.point = { x: newX, y: newY };
        } else if (s.points) {
          // Move all points by same delta
          const dx = newX - s.points[0].x;
          const dy = newY - s.points[0].y;
          s.points = s.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
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
      draw();
    } else if (tool === 'brush') {
      setCursor('crosshair');
    } else if (tool === 'eraser') {
      setCursor('crosshair');
    } else if (tool === 'point') {
      setCursor('crosshair');
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
        setSelectedId(newShape.id);
      }
      brushPointsRef.current = [];
      drawingRef.current = false;
      draw();
    }

    dragRef.current = false;
    resizingRef.current = null;
    vertexDragRef.current = -1;
  }, [shapes, setShapes, selectedId, setSelectedId, pushUndo, draw, tool, selectedClass]);

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

    if (tool === 'polygon') {
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
        setSelectedId(newShape.id);
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
        setSelectedId(newShape.id);
        polygonInProgressRef.current = [];
        reRender();
      }
    }
  }, [tool, selectedId, shapes, selectedClass, setShapes, setSelectedId, pushUndo, reRender, transform]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    // Reset shapes
    setShapes([]);
    setSelectedId(null);
    polygonInProgressRef.current = [];
    e.target.value = '';
  }, [setImageUrl, setShapes, setSelectedId]);

  const clearCanvas = useCallback(() => {
    setShapes([]);
    setSelectedId(null);
    polygonInProgressRef.current = [];
    brushPointsRef.current = [];
    if (imgRef.current) {
      imgRef.current = null;
      setImageUrl(null);
    }
    draw();
  }, [setShapes, setSelectedId, setImageUrl, draw]);

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
    for (let x = startX; x < w; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = startY; y < h; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }

  function drawShape(ctx: CanvasRenderingContext2D, shape: AnnotationShape, isSelected: boolean, scale: number, isTemp = false) {
    const alpha = isTemp ? 0.4 : shape.visible ? 1 : 0.3;
    ctx.globalAlpha = alpha;

    if (shape.type === 'bbox' && shape.bbox) {
      const { x, y, width, height } = shape.bbox;
      ctx.fillStyle = shape.color + '20';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(x, y, width, height);
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
        const s = HANDLE_SIZE / scale;
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
    } else if ((shape.type === 'polygon' || shape.type === 'polyline') && shape.points) {
      const pts = shape.points;
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (shape.type === 'polygon') ctx.closePath();
      if (shape.type === 'polygon') {
        ctx.fillStyle = shape.color + '30';
        ctx.fill();
      }
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
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
        const r = VERTEX_RADIUS / scale;
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

    const r = VERTEX_RADIUS / scale;
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    });

    if (pts.length >= 3) {
      if (distance(lastImg, pts[0]) <= 8 / scale) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, (VERTEX_RADIUS + 4) / scale, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ cursor }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDoubleClick}
      />

      {/* Empty state with upload */}
      {!imageUrl && shapes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className={`text-center p-8 rounded-2xl border-2 border-dashed max-w-sm pointer-events-auto ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-slate-50'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setImageUrl(url);
                setShapes([]);
                setSelectedId(null);
              }
            }}
          >
            <p className={`text-4xl mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>🖼️</p>
            <h3 className={`text-base font-medium mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Upload an image</h3>
            <p className={`text-xs mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Drag & drop or click to browse</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Browse Images
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-mono pointer-events-none ${darkMode ? 'bg-slate-900/80 text-slate-400' : 'bg-white/80 text-slate-500'} backdrop-blur`}>
        {Math.round(imgMousePos.x)}, {Math.round(imgMousePos.y)} · Zoom {Math.round(transform.scale * 100)}% · {shapes.length} annos
      </div>

      {/* Polygon hint */}
      {(tool === 'polygon' || tool === 'polyline') && polygonInProgressRef.current.length > 0 && (
        <div className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs shadow-lg ${darkMode ? 'bg-slate-900/90 text-slate-300' : 'bg-white/90 text-slate-700'} backdrop-blur`}>
          {polygonInProgressRef.current.length} pts · Click first point or Enter to finish · Esc to cancel
        </div>
      )}

      {/* Brush hint */}
      {tool === 'brush' && brushPointsRef.current.length > 0 && (
        <div className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs shadow-lg ${darkMode ? 'bg-slate-900/90 text-slate-300' : 'bg-white/90 text-slate-700'} backdrop-blur`}>
          Drawing brush stroke · Release to finish
        </div>
      )}

      {/* Toolbar overlay */}
      <div className={`absolute top-2 right-2 flex gap-1 pointer-events-auto`}>
        <button onClick={() => fileInputRef.current?.click()} className={`p-1.5 rounded-md text-xs ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'} shadow-sm`} title="Upload Image">
          🖼️
        </button>
        <button onClick={clearCanvas} className={`p-1.5 rounded-md text-xs ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'} shadow-sm`} title="Clear">
          🗑️
        </button>
        <button onClick={undo} className={`p-1.5 rounded-md text-xs ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'} shadow-sm`} title="Undo (Ctrl+Z)">
          ↩️
        </button>
        <button onClick={redo} className={`p-1.5 rounded-md text-xs ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'} shadow-sm`} title="Redo (Ctrl+Y)">
          ↪️
        </button>
      </div>
    </div>
  );
}
