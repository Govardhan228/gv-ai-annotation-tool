import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Play, Pause, SkipBack, SkipForward, ChevronLeft,
  Volume2, VolumeX, Maximize, RotateCcw, ZoomIn, ZoomOut,
  MousePointer2, Square, Pentagon, Circle, Minus, Pencil, MapPin,
  Type, Tag, Layers, Save, Undo, Redo, Trash2, Eye, EyeOff,
  Lock, Unlock, Grid2x2, Settings2, Film, FastForward, Rewind,
  Image, Scissors, Copy
} from 'lucide-react';
import Canvas, { CanvasRef } from '../components/Canvas';
import StatusBar from '../components/StatusBar';
import { Annotation, Point, AnnotationClass, ClassAttribute, AnnotationTool, EditHandle, TOOLS_2D } from '../types';
import { snapToGrid, dist, getHitTolerance, hitRect, hitCircle, hitPolygon, validateAnnotation } from '../utils/annotations';

interface Props {
  dark: boolean;
  onBack: () => void;
  classes: AnnotationClass[];
  onCreateAnnotation?: (ann: Annotation) => void;
  onUpdateAnnotation?: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation?: (id: string) => void;
}

type VideoTool = 'select' | 'bounding-box' | 'polygon' | 'polyline' | 'point' | 'line' | 'circle' | 'freehand' | 'text' | 'cuboid';

const VIDEO_TOOLS: { id: VideoTool; name: string; icon: string; hotkey: string }[] = [
  { id: 'select', name: 'Select', icon: 'MousePointer2', hotkey: 'S' },
  { id: 'bounding-box', name: 'Bounding Box', icon: 'Square', hotkey: 'B' },
  { id: 'polygon', name: 'Polygon', icon: 'Pentagon', hotkey: 'P' },
  { id: 'polyline', name: 'Polyline', icon: 'Minus', hotkey: 'L' },
  { id: 'point', name: 'Point', icon: 'MapPin', hotkey: 'O' },
  { id: 'line', name: 'Line', icon: 'Minus', hotkey: 'I' },
  { id: 'circle', name: 'Circle', icon: 'Circle', hotkey: 'C' },
  { id: 'freehand', name: 'Freehand', icon: 'Pencil', hotkey: 'F' },
  { id: 'text', name: 'Text', icon: 'Type', hotkey: 'T' },
  { id: 'cuboid', name: 'Cuboid', icon: 'Square', hotkey: 'D' },
];

const ICON_MAP: Record<string, React.FC<any>> = {
  MousePointer2, Square, Pentagon, Circle, Minus, Pencil, Type, MapPin, Film,
};

const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4];

export default function VideoAnnotationWorkspace({ dark, onBack, classes, onCreateAnnotation, onUpdateAnnotation, onDeleteAnnotation }: Props) {
  const dm = dark;

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<CanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoScale, setVideoScale] = useState(1);
  const [videoOffset, setVideoOffset] = useState<Point>({ x: 0, y: 0 });

  // Annotation state
  const [tool, setTool] = useState<VideoTool>('select');
  const [selectedClass, setSelectedClass] = useState(classes[0]?.name || '');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [editHandles, setEditHandles] = useState<EditHandle[]>([]);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Point | undefined>();
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize] = useState(20);
  const [snapToGridState, setSnapToGridState] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [fps, setFps] = useState(30);
  const [frameAnnotations, setFrameAnnotations] = useState<Record<number, Annotation[]>>({});

  // History
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [dirty, setDirty] = useState(false);

  // Keyframe tracking
  const [keyframes, setKeyframes] = useState<Set<number>>(new Set());
  const [interpolationMode, setInterpolationMode] = useState<'none' | 'linear'>('none');

  // Upload video
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoName(file.name);
    setAnnotations([]);
    setFrameAnnotations({});
    setKeyframes(new Set());
    setCurrentTime(0);
    setCurrentFrame(0);
  }, []);

  // Video playback controls
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); }
    else { videoRef.current.play(); }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const stepFrame = useCallback((direction: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + (direction / fps)));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setCurrentFrame(Math.round(newTime * fps));
  }, [currentTime, duration, fps]);

  const changeSpeed = useCallback((rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  // Frame-based annotation save/load
  const saveFrameAnnotations = useCallback(() => {
    setFrameAnnotations(prev => ({ ...prev, [currentFrame]: [...annotations] }));
    setKeyframes(prev => new Set(prev).add(currentFrame));
    setDirty(false);
  }, [currentFrame, annotations]);

  const loadFrameAnnotations = useCallback((frame: number) => {
    const frameAnns = frameAnnotations[frame] || [];
    setAnnotations(frameAnns);
  }, [frameAnnotations]);

  // Time update handler
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    const frame = Math.round(t * fps);
    if (frame !== currentFrame) {
      // Save current frame annotations before switching
      setFrameAnnotations(prev => ({ ...prev, [currentFrame]: [...annotations] }));
      setCurrentFrame(frame);
      // Load new frame annotations
      const frameAnns = frameAnnotations[frame] || [];
      setAnnotations(frameAnns);
    }
  }, [currentFrame, fps, annotations, frameAnnotations]);

  // Video loaded handler
  const handleVideoLoaded = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setTotalFrames(Math.round(videoRef.current.duration * 30));
    setFps(30);
  }, []);

  // Format time
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Annotation CRUD (same pattern as 2D workspace)
  const createAnnotation = useCallback((points: Point[], text?: string) => {
    const cls = classes.find(c => c.name === selectedClass);
    const ann: Annotation = {
      id: Date.now().toString(),
      type: tool as Annotation['type'],
      label: selectedClass,
      points,
      visible: true,
      locked: false,
      text,
      fontSize: 16,
      color: cls?.color || '#3b82f6',
      strokeWidth: 2,
      fillOpacity: 0.2,
      confidence: 1,
      rotation: 0,
      occlusion: 'none',
      truncation: false,
      frameIndex: currentFrame,
      zPosition: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      attributes: {},
    };
    const next = [...annotations, ann];
    setAnnotations(next);
    setSelectedAnnotation(ann.id);
    setDirty(true);
    onCreateAnnotation?.(ann);
  }, [tool, selectedClass, annotations, classes, currentFrame, onCreateAnnotation]);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    const next = annotations.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a);
    setAnnotations(next);
    setDirty(true);
    onUpdateAnnotation?.(id, updates);
  }, [annotations, onUpdateAnnotation]);

  const deleteAnnotation = useCallback((id: string) => {
    const next = annotations.filter(a => a.id !== id);
    setAnnotations(next);
    setSelectedAnnotation(null);
    setEditHandles([]);
    setDirty(true);
    onDeleteAnnotation?.(id);
  }, [annotations, onDeleteAnnotation]);

  const getEditHandles = (ann: Annotation): EditHandle[] => {
    const handles: EditHandle[] = [];
    if (ann.type === 'bounding-box' && ann.points.length >= 2) {
      const [p1, p2] = ann.points;
      const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
      handles.push(
        { id: 'tl', x: minX, y: minY, type: 'corner', cursor: 'nwse-resize' },
        { id: 'tr', x: maxX, y: minY, type: 'corner', cursor: 'nesw-resize' },
        { id: 'br', x: maxX, y: maxY, type: 'corner', cursor: 'nwse-resize' },
        { id: 'bl', x: minX, y: maxY, type: 'corner', cursor: 'nesw-resize' },
      );
    } else if (ann.type === 'polygon' || ann.type === 'polyline') {
      ann.points.forEach((p, i) => handles.push({ id: `point-${i}`, x: p.x, y: p.y, type: 'keypoint', cursor: 'pointer' }));
    }
    return handles;
  };

  // Canvas drawing
  const drawFunction = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!ctx) return;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.strokeStyle = dm ? '#374151' : '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      for (let x = 0; x < canvas.width; x += gridSize * videoScale) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize * videoScale) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    annotations.forEach(ann => {
      if (!ann.visible) return;
      ctx.save();
      ctx.scale(videoScale, videoScale);
      ctx.translate(videoOffset.x, videoOffset.y);

      const isSel = ann.id === selectedAnnotation;
      const color = ann.color || '#3b82f6';
      const sw = ann.strokeWidth || 2;
      const fo = ann.fillOpacity || 0.2;

      ctx.strokeStyle = color;
      ctx.lineWidth = sw;
      ctx.fillStyle = color + Math.round(fo * 255).toString(16).padStart(2, '0');
      if (isSel) { ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.lineWidth = sw + 1; }

      switch (ann.type) {
        case 'bounding-box':
          if (ann.points.length >= 2) {
            const [p1, p2] = ann.points;
            ctx.fillRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
            ctx.strokeRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
          }
          break;
        case 'polygon':
          if (ann.points.length >= 2) {
            ctx.beginPath(); ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
            ctx.closePath(); ctx.fill(); ctx.stroke();
          }
          break;
        case 'polyline':
          if (ann.points.length >= 2) {
            ctx.beginPath(); ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
            ctx.stroke();
          }
          break;
        case 'circle':
          if (ann.points.length >= 2) {
            const r = dist(ann.points[0], ann.points[1]);
            ctx.beginPath(); ctx.arc(ann.points[0].x, ann.points[0].y, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          }
          break;
        case 'point':
          if (ann.points.length >= 1) {
            ctx.beginPath(); ctx.arc(ann.points[0].x, ann.points[0].y, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          }
          break;
        case 'line':
          if (ann.points.length >= 2) {
            ctx.beginPath(); ctx.moveTo(ann.points[0].x, ann.points[0].y); ctx.lineTo(ann.points[1].x, ann.points[1].y); ctx.stroke();
          }
          break;
        case 'cuboid':
          if (ann.points.length >= 2) {
            const [p1, p2] = ann.points;
            const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
            const depth = Math.min(maxX - minX, maxY - minY) * 0.2;
            ctx.globalAlpha = fo; ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
            ctx.globalAlpha = 1; ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            ctx.globalAlpha = 0.5; ctx.strokeRect(minX + depth, minY - depth, maxX - minX, maxY - minY);
          }
          break;
      }

      // Label
      if (ann.label) {
        const bb = ann.points.length > 0 ? { x: Math.min(...ann.points.map(p => p.x)), y: Math.min(...ann.points.map(p => p.y)) } : null;
        if (bb) {
          ctx.globalAlpha = 1;
          ctx.font = 'bold 11px Arial';
          const labelW = ctx.measureText(ann.label).width;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(bb.x, bb.y - 18, labelW + 8, 18);
          ctx.fillStyle = '#fff';
          ctx.fillText(ann.label, bb.x + 4, bb.y - 5);
        }
      }

      // Selection handles
      if (isSel) {
        const handles = getEditHandles(ann);
        handles.forEach(h => {
          ctx.fillStyle = h.type === 'keypoint' ? '#ff6b6b' : '#ffffff';
          ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
          const s = 6 / videoScale;
          if (h.type === 'keypoint') { ctx.beginPath(); ctx.arc(h.x, h.y, s, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
          else { ctx.fillRect(h.x - s / 2, h.y - s / 2, s, s); ctx.strokeRect(h.x - s / 2, h.y - s / 2, s, s); }
        });
      }

      ctx.restore();
    });

    // Current drawing
    if (isDrawing && currentPoints.length > 0) {
      ctx.save();
      ctx.scale(videoScale, videoScale);
      ctx.translate(videoOffset.x, videoOffset.y);
      ctx.strokeStyle = classes.find(c => c.name === selectedClass)?.color || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      switch (tool) {
        case 'bounding-box': case 'cuboid':
          if (currentPoints.length >= 2) ctx.strokeRect(currentPoints[0].x, currentPoints[0].y, currentPoints[1].x - currentPoints[0].x, currentPoints[1].y - currentPoints[0].y);
          break;
        case 'circle':
          if (currentPoints.length >= 2) { const r = dist(currentPoints[0], currentPoints[1]); ctx.beginPath(); ctx.arc(currentPoints[0].x, currentPoints[0].y, r, 0, 2 * Math.PI); ctx.stroke(); }
          break;
        case 'polygon': case 'polyline': case 'freehand':
          if (currentPoints.length >= 2) { ctx.beginPath(); ctx.moveTo(currentPoints[0].x, currentPoints[0].y); for (let i = 1; i < currentPoints.length; i++) ctx.lineTo(currentPoints[i].x, currentPoints[i].y); ctx.stroke(); }
          break;
        case 'line':
          if (currentPoints.length >= 2) { ctx.beginPath(); ctx.moveTo(currentPoints[0].x, currentPoints[0].y); ctx.lineTo(currentPoints[1].x, currentPoints[1].y); ctx.stroke(); }
          break;
      }
      ctx.restore();
    }
  }, [annotations, selectedAnnotation, isDrawing, currentPoints, tool, selectedClass, classes, videoScale, videoOffset, showGrid, gridSize, dm]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - rect.left) / videoScale - videoOffset.x;
    let y = (e.clientY - rect.top) / videoScale - videoOffset.y;
    if (snapToGridState) { const s = snapToGrid({ x, y }, gridSize); x = s.x; y = s.y; }
    const point = { x, y };

    if (selectedAnnotation && editHandles.length > 0) {
      const tol = 8;
      const handle = editHandles.find(h => dist({ x, y }, { x: h.x, y: h.y }) <= tol);
      if (handle) { setDragHandle(handle.id); return; }
    }

    switch (tool) {
      case 'select': {
        const tolerance = getHitTolerance(videoScale);
        const clicked = annotations.find(ann => {
          if (!ann.visible) return false;
          if (ann.type === 'bounding-box') return hitRect({ x, y }, ann.points, tolerance);
          if (ann.type === 'polygon' || ann.type === 'polyline') return hitPolygon({ x, y }, ann.points, tolerance);
          if (ann.type === 'circle' && ann.points.length >= 2) return hitCircle({ x, y }, ann.points[0], ann.points[1], tolerance);
          if (ann.type === 'point') return ann.points.length >= 1 && dist({ x, y }, ann.points[0]) <= tolerance * 2;
          return false;
        });
        if (clicked) { setSelectedAnnotation(clicked.id); setEditHandles(getEditHandles(clicked)); }
        else { setSelectedAnnotation(null); setEditHandles([]); }
        break;
      }
      case 'bounding-box': case 'circle': case 'line': case 'cuboid':
        setIsDrawing(true); setCurrentPoints([point]); break;
      case 'polygon': case 'polyline':
        if (!isDrawing) { setIsDrawing(true); setCurrentPoints([point]); }
        else setCurrentPoints(prev => [...prev, point]);
        break;
      case 'point': createAnnotation([point]); break;
      case 'text': { const t = prompt('Enter text:'); if (t) createAnnotation([point], t); break; }
      case 'freehand': setIsDrawing(true); setCurrentPoints([point]); break;
    }
  }, [tool, videoScale, videoOffset, snapToGridState, gridSize, annotations, isDrawing, editHandles, selectedAnnotation, createAnnotation]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - rect.left) / videoScale - videoOffset.x;
    let y = (e.clientY - rect.top) / videoScale - videoOffset.y;
    if (snapToGridState) { const s = snapToGrid({ x, y }, gridSize); x = s.x; y = s.y; }
    setMousePos({ x, y });

    if (dragHandle && selectedAnnotation) {
      const ann = annotations.find(a => a.id === selectedAnnotation);
      if (!ann) return;
      let pts = [...ann.points];
      if (['tl', 'tr', 'br', 'bl'].includes(dragHandle) && pts.length >= 2) {
        const [p1, p2] = pts;
        const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
        let nx1 = minX, ny1 = minY, nx2 = maxX, ny2 = maxY;
        switch (dragHandle) {
          case 'tl': nx1 = x; ny1 = y; break;
          case 'tr': nx2 = x; ny1 = y; break;
          case 'br': nx2 = x; ny2 = y; break;
          case 'bl': nx1 = x; ny2 = y; break;
        }
        pts = [{ x: nx1, y: ny1 }, { x: nx2, y: ny2 }];
      } else if (dragHandle.startsWith('point-')) {
        const idx = parseInt(dragHandle.split('-')[1]);
        if (idx >= 0 && idx < pts.length) pts[idx] = { x, y };
      }
      updateAnnotation(selectedAnnotation, { points: pts });
      return;
    }

    if (isDrawing && currentPoints.length > 0) {
      switch (tool) {
        case 'bounding-box': case 'circle': case 'line': case 'cuboid':
          setCurrentPoints([currentPoints[0], { x, y }]); break;
        case 'freehand': setCurrentPoints(prev => [...prev, { x, y }]); break;
      }
    }
  }, [videoScale, videoOffset, snapToGridState, gridSize, dragHandle, selectedAnnotation, annotations, isDrawing, currentPoints, tool, updateAnnotation]);

  const handleMouseUp = useCallback(() => {
    if (dragHandle) { setDragHandle(null); return; }
    if (isDrawing && currentPoints.length >= 2) {
      switch (tool) {
        case 'bounding-box': case 'circle': case 'line': case 'freehand': case 'cuboid':
          createAnnotation(currentPoints); setIsDrawing(false); setCurrentPoints([]); break;
      }
    }
  }, [dragHandle, isDrawing, currentPoints, tool, createAnnotation]);

  const handleDoubleClick = useCallback(() => {
    if (isDrawing && ['polygon', 'polyline'].includes(tool) && currentPoints.length >= 2) {
      createAnnotation(currentPoints); setIsDrawing(false); setCurrentPoints([]);
    }
  }, [isDrawing, tool, currentPoints, createAnnotation]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) { e.preventDefault(); setVideoScale(prev => Math.max(0.1, Math.min(5, prev * (e.deltaY > 0 ? 0.9 : 1.1)))); }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case 's': setTool('select'); break;
        case 'b': setTool('bounding-box'); break;
        case 'p': setTool('polygon'); break;
        case 'l': setTool('polyline'); break;
        case 'c': setTool('circle'); break;
        case 'o': setTool('point'); break;
        case 'i': setTool('line'); break;
        case 'f': setTool('freehand'); break;
        case 't': setTool('text'); break;
        case 'd': setTool('cuboid'); break;
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'arrowleft': stepFrame(-1); break;
        case 'arrowright': stepFrame(1); break;
        case 'g': setShowGrid(v => !v); break;
        case 'escape': setSelectedAnnotation(null); setCurrentPoints([]); setIsDrawing(false); break;
        case 'delete': case 'backspace': if (selectedAnnotation) deleteAnnotation(selectedAnnotation); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, stepFrame, selectedAnnotation, deleteAnnotation]);

  // Timeline scrubber
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(ratio * duration);
  }, [duration, seekTo]);

  // Get keyframe markers for timeline
  const keyframeMarkers = Array.from(keyframes).sort((a, b) => a - b);

  const selectedAnnObj = selectedAnnotation ? annotations.find(a => a.id === selectedAnnotation) : null;

  return (
    <div className={`h-full flex flex-col ${dm ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`p-1.5 rounded-lg ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <ChevronLeft size={20} />
          </button>
          <Film size={20} className={dm ? 'text-blue-400' : 'text-blue-600'} />
          <h1 className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>
            Video Annotation
          </h1>
          {videoName && <span className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{videoName}</span>}
        </div>
        <div className="flex items-center gap-2">
          {videoSrc && (
            <>
              <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg ${showGrid ? 'bg-blue-600 text-white' : dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`} title="Grid">
                <Grid2x2 size={16} />
              </button>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${dm ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button onClick={() => setVideoScale(s => Math.max(0.1, s * 0.9))} className="p-0.5 rounded hover:bg-gray-600"><ZoomOut size={14} /></button>
                <span className="text-xs font-mono w-10 text-center">{Math.round(videoScale * 100)}%</span>
                <button onClick={() => setVideoScale(s => Math.min(5, s * 1.1))} className="p-0.5 rounded hover:bg-gray-600"><ZoomIn size={14} /></button>
              </div>
              <button onClick={saveFrameAnnotations} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${dirty ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
                <Save size={14} /> Save Frame
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className={`w-12 flex flex-col border-r ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          {VIDEO_TOOLS.map(t => {
            const IconComp = ICON_MAP[t.icon] || MousePointer2;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`w-12 h-10 flex items-center justify-center transition-colors ${
                  tool === t.id ? (dm ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700') : (dm ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100')
                }`}
                title={`${t.name} (${t.hotkey})`}
              >
                <IconComp size={16} />
              </button>
            );
          })}
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          {/* Video + Canvas */}
          <div className="flex-1 flex items-center justify-center p-3 relative">
            {!videoSrc ? (
              <div className={`text-center p-12 border-2 border-dashed rounded-xl max-w-lg ${dm ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                <Film size={48} className="mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Video Loaded</h3>
                <p className="text-sm mb-4">Upload a video file to start annotating frame by frame</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                  <Upload size={18} /> Upload Video
                  <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
                <p className={`text-xs mt-3 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>Supports MP4, WebM, MOV, AVI</p>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Hidden video element for playback */}
                <video
                  ref={videoRef}
                  src={videoSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleVideoLoaded}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                {/* Visible video frame + annotation canvas overlay */}
                <div className="relative" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                  <video
                    src={videoSrc}
                    currentTime={currentTime}
                    muted={muted}
                    className="max-w-full max-h-[calc(100vh-240px)] rounded-lg"
                    style={{ display: 'block' }}
                  />
                  {/* Annotation canvas overlay */}
                  <div className="absolute inset-0">
                    <Canvas
                      ref={canvasRef}
                      width={800}
                      height={600}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onDoubleClick={handleDoubleClick}
                      onWheel={handleWheel}
                      drawFunction={drawFunction}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          {videoSrc && (
            <div className={`px-4 py-2 border-t ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              {/* Timeline */}
              <div className="mb-2">
                <div
                  className={`relative h-6 rounded cursor-pointer ${dm ? 'bg-gray-800' : 'bg-gray-200'}`}
                  onClick={handleTimelineClick}
                >
                  {/* Progress bar */}
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-600/30 rounded"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  {/* Playhead */}
                  <div
                    className="absolute top-0 w-0.5 h-full bg-blue-500"
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  {/* Keyframe markers */}
                  {keyframeMarkers.map(frame => (
                    <div
                      key={frame}
                      className="absolute top-1 w-1.5 h-4 bg-amber-500 rounded-sm"
                      style={{ left: `${duration > 0 ? ((frame / fps) / duration) * 100 : 0}%` }}
                      title={`Keyframe: frame ${frame}`}
                    />
                  ))}
                  {/* Frame indicator */}
                  <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                    <span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{formatTime(currentTime)}</span>
                    <span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button onClick={() => stepFrame(-10)} className={`p-1.5 rounded ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`} title="Back 10 frames">
                    <Rewind size={16} />
                  </button>
                  <button onClick={() => stepFrame(-1)} className={`p-1.5 rounded ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`} title="Previous frame (Left arrow)">
                    <SkipBack size={16} />
                  </button>
                  <button onClick={togglePlay} className={`p-2 rounded-full ${isPlaying ? 'bg-blue-600 text-white' : dm ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button onClick={() => stepFrame(1)} className={`p-1.5 rounded ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`} title="Next frame (Right arrow)">
                    <SkipForward size={16} />
                  </button>
                  <button onClick={() => stepFrame(10)} className={`p-1.5 rounded ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`} title="Forward 10 frames">
                    <FastForward size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Frame counter */}
                  <span className={`text-xs font-mono px-2 py-1 rounded ${dm ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    F:{currentFrame} / {totalFrames}
                  </span>

                  {/* Speed control */}
                  <select
                    value={playbackRate}
                    onChange={e => changeSpeed(parseFloat(e.target.value))}
                    className={`text-xs px-2 py-1 rounded border ${dm ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}
                  >
                    {PLAYBACK_SPEEDS.map(s => (
                      <option key={s} value={s}>{s}x</option>
                    ))}
                  </select>

                  {/* Volume */}
                  <button onClick={toggleMute} className={`p-1.5 rounded ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  {/* Keyframe indicator */}
                  <button
                    onClick={saveFrameAnnotations}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      keyframes.has(currentFrame)
                        ? 'bg-amber-600/20 text-amber-500'
                        : dm ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Image size={12} />
                    {keyframes.has(currentFrame) ? 'Keyframed' : 'Mark Keyframe'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className={`w-72 flex flex-col border-l overflow-y-auto ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          {/* Upload */}
          {!videoSrc && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <label className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm cursor-pointer ${dm ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                <Upload size={16} /> Upload Video
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Class selector */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <h4 className={`text-xs font-semibold mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>CLASS</h4>
            <div className="space-y-1">
              {classes.filter(c => !c.parentId).map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.name)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors ${
                    selectedClass === cls.name ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700') : (dm ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50')
                  }`}
                >
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cls.color }} />
                  {cls.name}
                  {cls.hotkey && <span className={`ml-auto text-xs font-mono ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{cls.hotkey}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Annotations List */}
          {videoSrc && (
            <div className="flex-1 p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-xs font-semibold ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                  FRAME {currentFrame} ANNOTATIONS
                </h4>
                <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{annotations.length}</span>
              </div>
              <div className="space-y-1">
                {annotations.map(ann => (
                  <div
                    key={ann.id}
                    onClick={() => { setSelectedAnnotation(ann.id); setEditHandles(getEditHandles(ann)); }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                      selectedAnnotation === ann.id ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700') : (dm ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50')
                    }`}
                  >
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: ann.color }} />
                    <span className="flex-1 truncate">{ann.label}</span>
                    <span className={`text-[10px] ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{ann.type}</span>
                    <div className="flex gap-0.5">
                      <button
                        onClick={e => { e.stopPropagation(); updateAnnotation(ann.id, { visible: !ann.visible }); }}
                        className={`p-0.5 rounded ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                      >
                        {ann.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                        className={`p-0.5 rounded ${dm ? 'hover:bg-red-600/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Keyframes List */}
              {keyframeMarkers.length > 0 && (
                <div className="mt-4">
                  <h4 className={`text-xs font-semibold mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                    KEYFRAMES ({keyframeMarkers.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {keyframeMarkers.map(frame => (
                      <button
                        key={frame}
                        onClick={() => seekTo(frame / fps)}
                        className={`px-2 py-0.5 rounded text-xs font-mono ${
                          frame === currentFrame
                            ? 'bg-amber-600 text-white'
                            : dm ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {frame}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shortcuts hint */}
          {videoSrc && (
            <div className={`p-3 border-t ${dm ? 'border-gray-800' : 'border-gray-200'}`}>
              <h4 className={`text-xs font-semibold mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>SHORTCUTS</h4>
              <div className={`text-[10px] space-y-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                <div className="flex justify-between"><span>Play/Pause</span><span className="font-mono">Space</span></div>
                <div className="flex justify-between"><span>Prev/Next Frame</span><span className="font-mono">Left/Right</span></div>
                <div className="flex justify-between"><span>Select</span><span className="font-mono">S</span></div>
                <div className="flex justify-between"><span>BBox</span><span className="font-mono">B</span></div>
                <div className="flex justify-between"><span>Polygon</span><span className="font-mono">P</span></div>
                <div className="flex justify-between"><span>Save Frame</span><span className="font-mono">Ctrl+S</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
