import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FolderOpen, Zap, BarChart3, Settings, Users, Brain, Moon, Sun,
  Menu, Plus, Search, Upload, Download, Save, Undo, Redo, Trash2,
  Eye, EyeOff, Lock, Unlock, RotateCw, RotateCcw, FlipHorizontal,
  FlipVertical, ZoomIn, ZoomOut, HelpCircle, Grid2x2 as Grid,
  ChevronLeft, ChevronRight, Box, LayoutGrid, Shield, Tag,
  Layers, MousePointer2, Square, Pentagon, Circle, CircleDot,
  MapPin, Minus, MoveRight, Pencil, Type, Ruler, Hand, Wand2,
  Sparkles, GitBranch, Crosshair, Route, ScatterChart
} from 'lucide-react';
import Canvas, { CanvasRef } from './components/Canvas';
import StatusBar from './components/StatusBar';
import FileManager from './components/FileManager';
import PropertiesPanel from './components/PropertiesPanel';
import ExportDialog from './components/ExportDialog';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import Dashboard from './dashboard/Dashboard';
import ProjectCreationModal from './dashboard/ProjectCreationModal';
import TaxonomyPanel from './taxonomy/TaxonomyPanel';
import QAReviewPanel from './qa/QAReviewPanel';
import Annotation3DWorkspace from './annotation3d/Annotation3DWorkspace';
import {
  ViewMode, AnnotationTool, Annotation, Point, Project,
  AnnotationClass, ClassAttribute, EditHandle, KeyPoint,
  KeyPointTemplate, Measurement, AIModel, TOOLS_2D
} from './types';
import { snapToGrid, dist, getHitTolerance, hitRect, hitCircle, hitPolygon, validateAnnotation } from './utils/annotations';

const ICON_MAP: Record<string, React.FC<any>> = {
  MousePointer2, Square, Pentagon, Circle, CircleDot, MapPin, Minus,
  MoveRight, Pencil, Type, Ruler, Hand, Wand2, Sparkles, GitBranch, Box, Crosshair,
};

function App() {
  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Projects
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Medical Imaging Dataset', description: 'X-ray annotations for pneumonia detection', projectType: '2d', annotationMode: '2d', priority: 'high', imageCount: 1250, annotationCount: 3420, frameCount: 0, lastModified: new Date('2024-01-15'), status: 'active', thumbnail: 'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: '2', name: 'Autonomous Vehicle Dataset', description: 'Street scene detection and segmentation', projectType: '2d+3d', annotationMode: 'hybrid', priority: 'critical', imageCount: 5000, annotationCount: 25000, frameCount: 1200, lastModified: new Date('2024-01-20'), status: 'review', thumbnail: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: '3', name: 'Manufacturing QC', description: 'Product defect detection', projectType: '2d', annotationMode: '2d', priority: 'medium', imageCount: 800, annotationCount: 1200, frameCount: 0, lastModified: new Date('2024-01-18'), status: 'completed', thumbnail: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: '4', name: 'LiDAR Point Cloud', description: '3D object detection for autonomous driving', projectType: '3d', annotationMode: '3d', priority: 'high', imageCount: 0, annotationCount: 8500, frameCount: 500, lastModified: new Date('2024-01-22'), status: 'active' },
  ]);

  // Annotation state
  const [tool, setTool] = useState<AnnotationTool>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Point | undefined>();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState('');
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGridState, setSnapToGridState] = useState(false);
  const [editHandles, setEditHandles] = useState<EditHandle[]>([]);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [pixelsPerUnit, setPixelsPerUnit] = useState(1);
  const [measurementUnit, setMeasurementUnit] = useState('px');

  // KeyPoint template
  const [keyPointTemplate] = useState<KeyPointTemplate>({
    id: 'person', name: 'Person',
    points: [
      { id: 'nose', name: 'Nose' }, { id: 'left_eye', name: 'Left Eye' },
      { id: 'right_eye', name: 'Right Eye' }, { id: 'left_shoulder', name: 'Left Shoulder' },
      { id: 'right_shoulder', name: 'Right Shoulder' }, { id: 'left_elbow', name: 'Left Elbow' },
      { id: 'right_elbow', name: 'Right Elbow' }, { id: 'left_wrist', name: 'Left Wrist' },
      { id: 'right_wrist', name: 'Right Wrist' }, { id: 'left_hip', name: 'Left Hip' },
      { id: 'right_hip', name: 'Right Hip' }, { id: 'left_knee', name: 'Left Knee' },
      { id: 'right_knee', name: 'Right Knee' }, { id: 'left_ankle', name: 'Left Ankle' },
      { id: 'right_ankle', name: 'Right Ankle' },
    ],
    skeleton: [
      ['nose', 'left_eye'], ['nose', 'right_eye'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
    ],
  });

  // Classes
  const [annotationClasses, setAnnotationClasses] = useState<AnnotationClass[]>([
    { id: '1', name: 'Person', color: '#ef4444', hotkey: '1', attributes: [
      { id: '1', name: 'Age Group', type: 'select', required: false, options: ['Child', 'Adult', 'Senior'] },
      { id: '2', name: 'Visible', type: 'boolean', required: true },
    ]},
    { id: '2', name: 'Vehicle', color: '#3b82f6', hotkey: '2', attributes: [
      { id: '3', name: 'Type', type: 'select', required: true, options: ['Car', 'Truck', 'Bus', 'Motorcycle', 'Bicycle'] },
      { id: '4', name: 'License Plate Visible', type: 'boolean', required: false },
    ]},
    { id: '3', name: 'Object', color: '#22c55e', hotkey: '3', attributes: [] },
    { id: '4', name: 'Traffic Sign', color: '#f97316', hotkey: '4', parentId: undefined, attributes: [] },
    { id: '5', name: 'Cyclist', color: '#06b6d4', hotkey: '5', parentId: '1', attributes: [
      { id: '5', name: 'Helmet', type: 'boolean', required: false },
    ]},
  ]);
  const [selectedClass, setSelectedClass] = useState('Person');

  // History
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Auto-save
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  // AI Models
  const [aiModels] = useState<AIModel[]>([
    { id: '1', name: 'YOLOv8 Detection', type: 'detection', description: 'Real-time object detection', confidence: 0.85, enabled: true },
    { id: '2', name: 'Mask R-CNN Segmentation', type: 'segmentation', description: 'Instance segmentation', confidence: 0.92, enabled: false },
    { id: '3', name: 'ResNet Classification', type: 'classification', description: 'Image classification', confidence: 0.88, enabled: true },
  ]);

  const canvasRef = useRef<CanvasRef>(null);

  // Navigation
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'annotation-2d', label: '2D Annotate', icon: MousePointer2 },
    { id: 'annotation-3d', label: '3D Annotate', icon: Box },
    { id: 'taxonomy', label: 'Taxonomy', icon: Tag },
    { id: 'tasks', label: 'Tasks', icon: Zap },
    { id: 'qa', label: 'QA Review', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai-models', label: 'AI Models', icon: Brain },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // History
  const addToHistory = useCallback((anns: Annotation[]) => {
    setHistory(prev => {
      const h = prev.slice(0, historyIndex + 1);
      h.push([...anns]);
      setHistoryIndex(h.length - 1);
      return h;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations([...history[historyIndex - 1]]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations([...history[historyIndex + 1]]);
    }
  }, [history, historyIndex]);

  // Auto-save
  const saveAnnotationsLocally = useCallback((anns: Annotation[]) => {
    const data = { timestamp: new Date().toISOString(), annotations: anns, imageName };
    localStorage.setItem('annotationAutoSave', JSON.stringify(data));
    setLastSaveTime(new Date());
    setDirty(false);
  }, [imageName]);

  // Auto-save timer
  useEffect(() => {
    if (!dirty || !annotations.length) return;
    const timer = setTimeout(() => saveAnnotationsLocally(annotations), 30000);
    return () => clearTimeout(timer);
  }, [dirty, annotations, saveAnnotationsLocally]);

  // Load auto-save on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('annotationAutoSave');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.annotations?.length) {
          setAnnotations(data.annotations);
          addToHistory(data.annotations);
        }
      }
    } catch {}
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's': setTool('select'); break;
          case 'b': setTool('bounding-box'); break;
          case 'p': setTool('polygon'); break;
          case 'l': setTool('polyline'); break;
          case 'c': setTool('circle'); break;
          case 'e': setTool('ellipse'); break;
          case 'o': setTool('point'); break;
          case 'i': setTool('line'); break;
          case 'a': setTool('arrow'); break;
          case 'f': setTool('freehand'); break;
          case 'u': setTool('curve'); break;
          case 't': setTool('text'); break;
          case 'm': setTool('measurement'); break;
          case 'z': setTool('zoom'); break;
          case 'h': setTool('pan'); break;
          case 'w': setTool('magic-wand'); break;
          case 'g': setShowGrid(v => !v); break;
          case 'escape':
            setSelectedAnnotation(null);
            setCurrentPoints([]);
            setIsDrawing(false);
            break;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); break;
          case 'y': e.preventDefault(); redo(); break;
          case 's': e.preventDefault(); saveAnnotationsLocally(annotations); break;
          case 'd': e.preventDefault(); selectedAnnotation && duplicateAnnotation(); break;
          case 'e': e.preventDefault(); setShowExportDialog(true); break;
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotation) {
        deleteAnnotation();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedAnnotation, annotations, undo, redo, saveAnnotationsLocally]);

  // Annotation management
  const createAnnotation = useCallback((points: Point[], text?: string) => {
    const cls = annotationClasses.find(c => c.name === selectedClass);
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
      frameIndex: 0,
      zPosition: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      attributes: {},
    };
    const validation = validateAnnotation(ann);
    if (!validation.valid) { console.warn('Invalid annotation:', validation.errors); return; }
    const next = [...annotations, ann];
    setAnnotations(next);
    addToHistory(next);
    setSelectedAnnotation(ann.id);
    setDirty(true);
  }, [tool, selectedClass, annotations, annotationClasses, addToHistory]);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    const next = annotations.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a);
    setAnnotations(next);
    addToHistory(next);
    setDirty(true);
  }, [annotations, addToHistory]);

  const deleteAnnotation = useCallback(() => {
    if (!selectedAnnotation) return;
    const next = annotations.filter(a => a.id !== selectedAnnotation);
    setAnnotations(next);
    addToHistory(next);
    setSelectedAnnotation(null);
    setEditHandles([]);
    setDirty(true);
  }, [selectedAnnotation, annotations, addToHistory]);

  const duplicateAnnotation = useCallback(() => {
    if (!selectedAnnotation) return;
    const ann = annotations.find(a => a.id === selectedAnnotation);
    if (!ann) return;
    const dup: Annotation = {
      ...ann,
      id: Date.now().toString(),
      points: ann.points.map(p => ({ x: p.x + 10, y: p.y + 10 })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const next = [...annotations, dup];
    setAnnotations(next);
    addToHistory(next);
    setSelectedAnnotation(dup.id);
    setDirty(true);
  }, [selectedAnnotation, annotations, addToHistory]);

  const rotateAnnotation = useCallback((deg: number) => {
    if (!selectedAnnotation) return;
    const ann = annotations.find(a => a.id === selectedAnnotation);
    if (!ann) return;
    updateAnnotation(selectedAnnotation, { rotation: ((ann.rotation || 0) + deg) % 360 });
  }, [selectedAnnotation, annotations, updateAnnotation]);

  const flipH = useCallback(() => {
    if (!selectedAnnotation) return;
    const ann = annotations.find(a => a.id === selectedAnnotation);
    if (!ann || ann.points.length < 2) return;
    const minX = Math.min(...ann.points.map(p => p.x));
    const maxX = Math.max(...ann.points.map(p => p.x));
    const cx = (minX + maxX) / 2;
    updateAnnotation(selectedAnnotation, { points: ann.points.map(p => ({ x: cx - (p.x - cx), y: p.y })) });
  }, [selectedAnnotation, annotations, updateAnnotation]);

  const flipV = useCallback(() => {
    if (!selectedAnnotation) return;
    const ann = annotations.find(a => a.id === selectedAnnotation);
    if (!ann || ann.points.length < 2) return;
    const minY = Math.min(...ann.points.map(p => p.y));
    const maxY = Math.max(...ann.points.map(p => p.y));
    const cy = (minY + maxY) / 2;
    updateAnnotation(selectedAnnotation, { points: ann.points.map(p => ({ x: p.x, y: cy - (p.y - cy) })) });
  }, [selectedAnnotation, annotations, updateAnnotation]);

  const getEditHandles = (ann: Annotation): EditHandle[] => {
    const handles: EditHandle[] = [];
    if (ann.type === 'bounding-box' || ann.type === 'rectangle') {
      if (ann.points.length >= 2) {
        const [p1, p2] = ann.points;
        const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
        const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
        handles.push(
          { id: 'tl', x: minX, y: minY, type: 'corner', cursor: 'nwse-resize' },
          { id: 'tm', x: midX, y: minY, type: 'edge', cursor: 'ns-resize' },
          { id: 'tr', x: maxX, y: minY, type: 'corner', cursor: 'nesw-resize' },
          { id: 'mr', x: maxX, y: midY, type: 'edge', cursor: 'ew-resize' },
          { id: 'br', x: maxX, y: maxY, type: 'corner', cursor: 'nwse-resize' },
          { id: 'bm', x: midX, y: maxY, type: 'edge', cursor: 'ns-resize' },
          { id: 'bl', x: minX, y: maxY, type: 'corner', cursor: 'nesw-resize' },
          { id: 'ml', x: minX, y: midY, type: 'edge', cursor: 'ew-resize' },
        );
      }
    } else if (ann.type === 'circle' && ann.points.length >= 2) {
      handles.push(
        { id: 'center', x: ann.points[0].x, y: ann.points[0].y, type: 'center', cursor: 'move' },
        { id: 'edge', x: ann.points[1].x, y: ann.points[1].y, type: 'edge', cursor: 'pointer' },
      );
    } else if (ann.type === 'polygon' || ann.type === 'polyline' || ann.type === 'segmentation') {
      ann.points.forEach((p, i) => handles.push({ id: `point-${i}`, x: p.x, y: p.y, type: 'keypoint', cursor: 'pointer' }));
    } else if (ann.type === 'line' || ann.type === 'arrow' || ann.type === 'measurement') {
      if (ann.points.length >= 2) {
        handles.push(
          { id: 'start', x: ann.points[0].x, y: ann.points[0].y, type: 'point', cursor: 'pointer' },
          { id: 'end', x: ann.points[1].x, y: ann.points[1].y, type: 'point', cursor: 'pointer' },
        );
      }
    }
    return handles;
  };

  // Canvas drawing
  const drawFunction = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!ctx) return;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    }

    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = darkMode ? '#374151' : '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      for (let x = 0; x < canvas.width; x += gridSize * scale) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize * scale) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      ctx.restore();
    }

    // Draw annotations
    annotations.forEach(ann => {
      if (!ann.visible) return;
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);

      const isSel = ann.id === selectedAnnotation;
      const color = ann.color || '#3b82f6';
      const sw = ann.strokeWidth || 2;
      const fo = ann.fillOpacity || 0.2;

      ctx.strokeStyle = color;
      ctx.lineWidth = sw;
      ctx.fillStyle = color + Math.round(fo * 255).toString(16).padStart(2, '0');

      if (isSel) { ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.lineWidth = sw + 1; }

      switch (ann.type) {
        case 'rectangle': case 'bounding-box':
          if (ann.points.length >= 2) {
            const [p1, p2] = ann.points;
            ctx.fillRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
            ctx.strokeRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
          }
          break;
        case 'circle':
          if (ann.points.length >= 2) {
            const r = dist(ann.points[0], ann.points[1]);
            ctx.beginPath(); ctx.arc(ann.points[0].x, ann.points[0].y, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          }
          break;
        case 'ellipse':
          if (ann.points.length >= 2) {
            const rx = Math.abs(ann.points[1].x - ann.points[0].x);
            const ry = Math.abs(ann.points[1].y - ann.points[0].y);
            ctx.beginPath(); ctx.ellipse(ann.points[0].x, ann.points[0].y, rx, ry, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          }
          break;
        case 'polygon': case 'segmentation':
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
        case 'arrow':
          if (ann.points.length >= 2) {
            const [s, e] = ann.points;
            const angle = Math.atan2(e.y - s.y, e.x - s.x);
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x - 15 * Math.cos(angle - Math.PI / 6), e.y - 15 * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x - 15 * Math.cos(angle + Math.PI / 6), e.y - 15 * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
          break;
        case 'line':
          if (ann.points.length >= 2) {
            ctx.beginPath(); ctx.moveTo(ann.points[0].x, ann.points[0].y); ctx.lineTo(ann.points[1].x, ann.points[1].y); ctx.stroke();
          }
          break;
        case 'curve':
          if (ann.points.length >= 3) {
            ctx.beginPath(); ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length - 2; i++) {
              const xc = (ann.points[i].x + ann.points[i + 1].x) / 2;
              const yc = (ann.points[i].y + ann.points[i + 1].y) / 2;
              ctx.quadraticCurveTo(ann.points[i].x, ann.points[i].y, xc, yc);
            }
            const last2 = ann.points[ann.points.length - 2], last1 = ann.points[ann.points.length - 1];
            ctx.quadraticCurveTo(last2.x, last2.y, last1.x, last1.y);
            ctx.stroke();
          }
          break;
        case 'measurement':
          if (ann.points.length >= 2) {
            const [p1, p2] = ann.points;
            const d = dist(p1, p2);
            const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(p1.x, p1.y, 3, 0, 2 * Math.PI); ctx.fill();
            ctx.beginPath(); ctx.arc(p2.x, p2.y, 3, 0, 2 * Math.PI); ctx.fill();
            const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
            ctx.fillStyle = color;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(d / pixelsPerUnit)}${measurementUnit}`, mx - Math.sin(a) * 15, my + Math.cos(a) * 15);
          }
          break;
        case 'point':
          if (ann.points.length >= 1) {
            ctx.beginPath(); ctx.arc(ann.points[0].x, ann.points[0].y, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          }
          break;
        case 'text':
          if (ann.points.length >= 1 && ann.text) {
            ctx.font = `${ann.fontSize || 16}px Arial`;
            const metrics = ctx.measureText(ann.text);
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(ann.points[0].x - 2, ann.points[0].y - (ann.fontSize || 16), metrics.width + 4, (ann.fontSize || 16) + 4);
            ctx.fillStyle = color;
            ctx.fillText(ann.text, ann.points[0].x, ann.points[0].y);
          }
          break;
        case 'freehand':
          if (ann.points.length >= 2) {
            ctx.beginPath(); ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
            ctx.stroke();
          }
          break;
        case 'cuboid': case 'cuboid-3d':
          if (ann.points.length >= 2) {
            const [p1, p2] = ann.points;
            const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
            const depth = Math.min(maxX - minX, maxY - minY) * 0.2;
            ctx.globalAlpha = fo; ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
            ctx.globalAlpha = 1; ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            ctx.globalAlpha = 0.5; ctx.strokeRect(minX + depth, minY - depth, maxX - minX, maxY - minY);
            for (const corner of [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }]) {
              ctx.globalAlpha = 0.5;
              ctx.beginPath(); ctx.moveTo(corner.x, corner.y); ctx.lineTo(corner.x + depth, corner.y - depth); ctx.stroke();
            }
            if (ann.label) { ctx.globalAlpha = 1; ctx.fillStyle = color; ctx.font = '12px Arial'; ctx.fillText(ann.label, minX, minY - 5); }
          }
          break;
      }

      // Selection handles
      if (isSel) {
        if ((ann.type === 'bounding-box' || ann.type === 'rectangle') && ann.points.length >= 2) {
          const [p1, p2] = ann.points;
          const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
          const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
          const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
          ctx.fillStyle = '#fff'; ctx.strokeStyle = color; ctx.lineWidth = 1;
          [{ x: minX, y: minY }, { x: midX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: midY },
           { x: maxX, y: maxY }, { x: midX, y: maxY }, { x: minX, y: maxY }, { x: minX, y: midY }]
            .forEach(h => { ctx.fillRect(h.x - 4, h.y - 4, 8, 8); ctx.strokeRect(h.x - 4, h.y - 4, 8, 8); });
        } else if (ann.type === 'keypoints') {
          const kps = ann.metadata?.keypoints as KeyPoint[] || [];
          if (keyPointTemplate.skeleton) {
            ctx.globalAlpha = 0.7; ctx.lineWidth = 2;
            keyPointTemplate.skeleton.forEach(([sid, eid]) => {
              const sk = kps.find(k => k.id === sid), ek = kps.find(k => k.id === eid);
              if (sk && ek && sk.visible && ek.visible) { ctx.beginPath(); ctx.moveTo(sk.x, sk.y); ctx.lineTo(ek.x, ek.y); ctx.stroke(); }
            });
          }
          kps.forEach(kp => {
            if (kp.visible) {
              ctx.globalAlpha = 1;
              ctx.beginPath(); ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
              ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
              ctx.fillStyle = color; ctx.font = '10px Arial'; ctx.fillText(kp.name, kp.x + 6, kp.y - 6);
            }
          });
        }
      }

      // Label
      if (ann.label && ann.type !== 'text' && ann.type !== 'measurement') {
        const bb = getBBox(ann);
        if (bb) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = color;
          ctx.font = 'bold 11px Arial';
          const labelW = ctx.measureText(ann.label).width;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(bb.x, bb.y - 18, labelW + 8, 18);
          ctx.fillStyle = '#fff';
          ctx.fillText(ann.label, bb.x + 4, bb.y - 5);
        }
      }

      ctx.restore();
    });

    // Current drawing
    if (isDrawing && currentPoints.length > 0) {
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);
      ctx.strokeStyle = annotationClasses.find(c => c.name === selectedClass)?.color || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      switch (tool) {
        case 'rectangle': case 'bounding-box': case 'cuboid': case 'cuboid-3d':
          if (currentPoints.length >= 2) ctx.strokeRect(currentPoints[0].x, currentPoints[0].y, currentPoints[1].x - currentPoints[0].x, currentPoints[1].y - currentPoints[0].y);
          break;
        case 'circle':
          if (currentPoints.length >= 2) { const r = dist(currentPoints[0], currentPoints[1]); ctx.beginPath(); ctx.arc(currentPoints[0].x, currentPoints[0].y, r, 0, 2 * Math.PI); ctx.stroke(); }
          break;
        case 'ellipse':
          if (currentPoints.length >= 2) { const rx = Math.abs(currentPoints[1].x - currentPoints[0].x), ry = Math.abs(currentPoints[1].y - currentPoints[0].y); ctx.beginPath(); ctx.ellipse(currentPoints[0].x, currentPoints[0].y, rx, ry, 0, 0, 2 * Math.PI); ctx.stroke(); }
          break;
        case 'polygon': case 'polyline': case 'segmentation': case 'curve':
          if (currentPoints.length >= 2) { ctx.beginPath(); ctx.moveTo(currentPoints[0].x, currentPoints[0].y); for (let i = 1; i < currentPoints.length; i++) ctx.lineTo(currentPoints[i].x, currentPoints[i].y); ctx.stroke(); }
          break;
        case 'measurement': case 'arrow': case 'line':
          if (currentPoints.length >= 2) { ctx.beginPath(); ctx.moveTo(currentPoints[0].x, currentPoints[0].y); ctx.lineTo(currentPoints[1].x, currentPoints[1].y); ctx.stroke(); }
          break;
      }
      ctx.restore();
    }

    // Edit handles
    if (selectedAnnotation && editHandles.length > 0) {
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);
      editHandles.forEach(h => {
        ctx.fillStyle = h.type === 'keypoint' ? '#ff6b6b' : '#ffffff';
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
        const s = 6 / scale;
        if (h.type === 'keypoint') { ctx.beginPath(); ctx.arc(h.x, h.y, s, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(h.x - s / 2, h.y - s / 2, s, s); ctx.strokeRect(h.x - s / 2, h.y - s / 2, s, s); }
      });
      ctx.restore();
    }
  }, [image, scale, offset, showGrid, gridSize, darkMode, annotations, selectedAnnotation, isDrawing, currentPoints, tool, selectedClass, annotationClasses, editHandles, keyPointTemplate, pixelsPerUnit, measurementUnit]);

  const getBBox = (ann: Annotation) => {
    if (!ann.points.length) return null;
    const xs = ann.points.map(p => p.x), ys = ann.points.map(p => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys) };
  };

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - rect.left) / scale - offset.x;
    let y = (e.clientY - rect.top) / scale - offset.y;
    if (snapToGridState) { const s = snapToGrid({ x, y }, gridSize); x = s.x; y = s.y; }
    const point = { x, y };

    // Handle drag
    if (selectedAnnotation && editHandles.length > 0) {
      const tol = 8;
      const handle = editHandles.find(h => dist({ x, y }, { x: h.x, y: h.y }) <= tol);
      if (handle) { setDragHandle(handle.id); return; }
    }

    switch (tool) {
      case 'select': {
        const tolerance = getHitTolerance(scale);
        const clicked = annotations.find(ann => {
          if (!ann.visible) return false;
          switch (ann.type) {
            case 'rectangle': case 'bounding-box': return hitRect({ x, y }, ann.points, tolerance);
            case 'circle': return ann.points.length >= 2 && hitCircle({ x, y }, ann.points[0], ann.points[1], tolerance);
            case 'polygon': case 'polyline': case 'segmentation': return hitPolygon({ x, y }, ann.points, tolerance);
            case 'ellipse':
              if (ann.points.length >= 2) {
                const rx = Math.abs(ann.points[1].x - ann.points[0].x), ry = Math.abs(ann.points[1].y - ann.points[0].y);
                if (rx === 0 || ry === 0) return false;
                const dx = x - ann.points[0].x, dy = y - ann.points[0].y;
                return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1 + tolerance / rx;
              }
              return false;
            case 'point': return ann.points.length >= 1 && dist({ x, y }, ann.points[0]) <= tolerance * 2;
            case 'line': case 'arrow': case 'measurement':
              return ann.points.length >= 2 && (dist({ x, y }, ann.points[0]) <= tolerance * 3 || dist({ x, y }, ann.points[1]) <= tolerance * 3);
            case 'text':
              if (ann.points.length >= 1 && ann.text) {
                const tw = ann.text.length * (ann.fontSize || 16) * 0.6;
                return x >= ann.points[0].x - 5 && x <= ann.points[0].x + tw + 5;
              }
              return false;
            case 'freehand': return hitPolygon({ x, y }, ann.points, tolerance);
            case 'cuboid': case 'cuboid-3d':
              return ann.points.length >= 2 && hitRect({ x, y }, ann.points, tolerance);
            default: return false;
          }
        });
        if (clicked) { setSelectedAnnotation(clicked.id); setEditHandles(getEditHandles(clicked)); }
        else { setSelectedAnnotation(null); setEditHandles([]); }
        break;
      }
      case 'rectangle': case 'circle': case 'ellipse': case 'arrow': case 'line': case 'measurement': case 'bounding-box': case 'cuboid': case 'cuboid-3d':
        setIsDrawing(true); setCurrentPoints([point]); break;
      case 'polygon': case 'polyline': case 'segmentation': case 'curve':
        if (!isDrawing) { setIsDrawing(true); setCurrentPoints([point]); }
        else setCurrentPoints(prev => [...prev, point]);
        break;
      case 'point': createAnnotation([point]); break;
      case 'text': { const t = prompt('Enter text:'); if (t) createAnnotation([point], t); break; }
      case 'freehand': setIsDrawing(true); setCurrentPoints([point]); break;
    }
  }, [tool, scale, offset, snapToGridState, gridSize, annotations, isDrawing, editHandles, selectedAnnotation, createAnnotation]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - rect.left) / scale - offset.x;
    let y = (e.clientY - rect.top) / scale - offset.y;
    if (snapToGridState) { const s = snapToGrid({ x, y }, gridSize); x = s.x; y = s.y; }
    setMousePos({ x, y });

    if (dragHandle && selectedAnnotation) {
      const ann = annotations.find(a => a.id === selectedAnnotation);
      if (!ann) return;
      let pts = [...ann.points];
      if (['tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml'].includes(dragHandle) && pts.length >= 2) {
        const [p1, p2] = pts;
        const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
        let nx1 = minX, ny1 = minY, nx2 = maxX, ny2 = maxY;
        switch (dragHandle) {
          case 'tl': nx1 = x; ny1 = y; break;
          case 'tm': ny1 = y; break;
          case 'tr': nx2 = x; ny1 = y; break;
          case 'mr': nx2 = x; break;
          case 'br': nx2 = x; ny2 = y; break;
          case 'bm': ny2 = y; break;
          case 'bl': nx1 = x; ny2 = y; break;
          case 'ml': nx1 = x; break;
        }
        pts = [{ x: nx1, y: ny1 }, { x: nx2, y: ny2 }];
      } else if (dragHandle === 'edge' && ann.type === 'circle') {
        pts[1] = { x, y };
      } else if (dragHandle.startsWith('point-')) {
        const idx = parseInt(dragHandle.split('-')[1]);
        if (idx >= 0 && idx < pts.length) pts[idx] = { x, y };
      } else if (dragHandle === 'start') { pts[0] = { x, y }; }
      else if (dragHandle === 'end') { pts[1] = { x, y }; }
      updateAnnotation(selectedAnnotation, { points: pts });
      return;
    }

    if (isDrawing && currentPoints.length > 0) {
      switch (tool) {
        case 'rectangle': case 'circle': case 'ellipse': case 'arrow': case 'line': case 'measurement': case 'bounding-box': case 'cuboid': case 'cuboid-3d':
          setCurrentPoints([currentPoints[0], { x, y }]); break;
        case 'freehand': setCurrentPoints(prev => [...prev, { x, y }]); break;
      }
    }
  }, [scale, offset, snapToGridState, gridSize, dragHandle, selectedAnnotation, annotations, isDrawing, currentPoints, tool, updateAnnotation]);

  const handleMouseUp = useCallback(() => {
    if (dragHandle) { setDragHandle(null); return; }
    if (isDrawing && currentPoints.length >= 2) {
      switch (tool) {
        case 'rectangle': case 'circle': case 'ellipse': case 'arrow': case 'line': case 'measurement': case 'freehand': case 'bounding-box': case 'cuboid': case 'cuboid-3d':
          createAnnotation(currentPoints); setIsDrawing(false); setCurrentPoints([]); break;
      }
    }
  }, [dragHandle, isDrawing, currentPoints, tool, createAnnotation]);

  const handleDoubleClick = useCallback(() => {
    if (isDrawing && ['polygon', 'polyline', 'segmentation', 'curve'].includes(tool) && currentPoints.length >= 2) {
      createAnnotation(currentPoints); setIsDrawing(false); setCurrentPoints([]);
    }
  }, [isDrawing, tool, currentPoints, createAnnotation]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) { e.preventDefault(); setScale(prev => Math.max(0.1, Math.min(5, prev * (e.deltaY > 0 ? 0.9 : 1.1)))); }
  }, []);

  // File handling
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => { setImage(img); setImageName(file.name); setScale(1); setOffset({ x: 0, y: 0 }); };
      img.src = URL.createObjectURL(file);
    }
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.annotations) { setAnnotations(data.annotations); addToHistory(data.annotations); }
        } catch { alert('Invalid file format'); }
      };
      reader.readAsText(file);
    }
  }, [addToHistory]);

  // Class management
  const handleAddClass = useCallback((cls: Omit<AnnotationClass, 'id'>) => {
    setAnnotationClasses(prev => [...prev, { ...cls, id: Date.now().toString() }]);
  }, []);

  const handleUpdateClass = useCallback((id: string, updates: Partial<AnnotationClass>) => {
    setAnnotationClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const handleRemoveClass = useCallback((id: string) => {
    setAnnotationClasses(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleAddAttribute = useCallback((classId: string, attr: Omit<ClassAttribute, 'id'>) => {
    setAnnotationClasses(prev => prev.map(c => c.id === classId ? { ...c, attributes: [...(c.attributes || []), { ...attr, id: Date.now().toString() }] } : c));
  }, []);

  const handleRemoveAttribute = useCallback((classId: string, attrId: string) => {
    setAnnotationClasses(prev => prev.map(c => c.id === classId ? { ...c, attributes: (c.attributes || []).filter(a => a.id !== attrId) } : c));
  }, []);

  const selectedAnnObj = selectedAnnotation ? annotations.find(a => a.id === selectedAnnotation) : null;

  // Project creation handler
  const handleCreateProject = useCallback((data: Partial<Project>) => {
    const p: Project = { id: Date.now().toString(), ...data } as Project;
    setProjects(prev => [p, ...prev]);
  }, []);

  // Dark mode classes
  const dm = darkMode;
  const sidebarBg = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const topNavBg = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';

  return (
    <div className={`h-screen flex flex-col ${dm ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navigation */}
      <nav className={`flex items-center justify-between px-4 py-2 border-b ${topNavBg}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GV</span>
            </div>
            <span className={`font-bold text-lg ${dm ? 'text-white' : 'text-gray-900'}`}>GV.AI</span>
          </div>
          <div className={`w-px h-6 ${dm ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${dm ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Search size={14} className={dm ? 'text-gray-500' : 'text-gray-400'} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={`bg-transparent border-none outline-none text-sm w-48 ${dm ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'annotation-2d' && (
            <>
              <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg ${showGrid ? 'bg-blue-600 text-white' : dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`} title="Grid"><Grid size={16} /></button>
              <button onClick={() => setSnapToGridState(!snapToGridState)} className={`p-1.5 rounded-lg ${snapToGridState ? 'bg-blue-600 text-white' : dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`} title="Snap"><Layers size={16} /></button>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${dm ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button onClick={() => setScale(s => Math.max(0.1, s * 0.9))} className="p-0.5 rounded hover:bg-gray-600"><ZoomOut size={14} /></button>
                <span className="text-xs font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(5, s * 1.1))} className="p-0.5 rounded hover:bg-gray-600"><ZoomIn size={14} /></button>
              </div>
              <button onClick={undo} className={`p-1.5 rounded-lg ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`} title="Undo"><Undo size={16} /></button>
              <button onClick={redo} className={`p-1.5 rounded-lg ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`} title="Redo"><Redo size={16} /></button>
              <button onClick={() => saveAnnotationsLocally(annotations)} className={`p-1.5 rounded-lg ${dirty ? 'text-amber-400' : dm ? 'text-gray-400' : 'text-gray-600'} ${dm ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title="Save">
                <Save size={16} />
              </button>
              {lastSaveTime && <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Saved {lastSaveTime.toLocaleTimeString()}</span>}
            </>
          )}
          <button onClick={() => setShowShortcuts(true)} className={`p-1.5 rounded-lg ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><HelpCircle size={16} /></button>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-1.5 rounded-lg ${dm ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`flex flex-col border-r ${sidebarBg} transition-all duration-200 ${sidebarCollapsed ? 'w-14' : 'w-52'}`}>
          <nav className="flex-1 py-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id as ViewMode)}
                className={`flex items-center gap-3 w-full px-3 py-2 text-sm transition-colors ${
                  viewMode === item.id
                    ? dm ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-400' : 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : dm ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={item.label}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 border-t ${dm ? 'border-gray-800 hover:bg-gray-800 text-gray-500' : 'border-gray-200 hover:bg-gray-100 text-gray-400'}`}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Dashboard */}
          {viewMode === 'dashboard' && <Dashboard dark={dm} projects={projects} onNavigate={setViewMode} />}

          {/* Projects */}
          {viewMode === 'projects' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className={`text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Projects</h1>
                <button onClick={() => setShowProjectModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={18} /> New Project
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setViewMode(p.projectType === '3d' ? 'annotation-3d' : 'annotation-2d')}
                    className={`rounded-xl p-5 border cursor-pointer transition-all hover:shadow-lg ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  >
                    {p.thumbnail && (
                      <div className="w-full h-32 rounded-lg mb-3 overflow-hidden">
                        <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'review' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                      }`}>{p.status}</span>
                    </div>
                    <p className={`text-sm mb-3 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{p.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{p.projectType.toUpperCase()}</span>
                      <span className={dm ? 'text-gray-400' : 'text-gray-600'}>{p.imageCount} images</span>
                      <span className={dm ? 'text-gray-400' : 'text-gray-600'}>{p.annotationCount} annotations</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2D Annotation */}
          {viewMode === 'annotation-2d' && (
            <div className="flex h-full">
              {/* 2D Toolbar */}
              <div className={`w-12 flex flex-col border-r ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                {TOOLS_2D.map(t => {
                  const IconComp = ICON_MAP[t.icon] || MousePointer2;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTool(t.id as AnnotationTool)}
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

              {/* Canvas */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 p-3">
                  <div className="w-full h-full flex items-center justify-center">
                    {image ? (
                      <Canvas ref={canvasRef} width={Math.min(image.width * scale, window.innerWidth - 500)} height={Math.min(image.height * scale, window.innerHeight - 200)}
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                        onDoubleClick={handleDoubleClick} onWheel={handleWheel} drawFunction={drawFunction} />
                    ) : (
                      <div className={`text-center p-12 border-2 border-dashed rounded-xl ${dm ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                        <Upload size={48} className="mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-2">No Image Loaded</h3>
                        <p className="text-sm mb-4">Upload an image to start annotating</p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                          <Upload size={18} /> Upload Image
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <StatusBar tool={tool} scale={scale} mousePos={mousePos} polygonPoints={currentPoints.length}
                  selectedAnnotation={selectedAnnObj} annotationCount={annotations.length}
                  visibleCount={annotations.filter(a => a.visible).length} lockedCount={annotations.filter(a => a.locked).length} />
              </div>

              {/* Right sidebar */}
              <div className={`w-80 flex flex-col border-l overflow-y-auto ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                  <FileManager onImageUpload={handleImageUpload} onExport={() => setShowExportDialog(true)} onImport={handleImport} hasImage={!!image} annotationCount={annotations.length} />
                </div>
                {/* Class selector */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                  <h4 className={`text-xs font-semibold mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>CLASS</h4>
                  <div className="space-y-1">
                    {annotationClasses.filter(c => !c.parentId).map(cls => (
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
                <div className="flex-1 p-3">
                  <PropertiesPanel selectedAnnotation={selectedAnnObj} annotationClasses={annotationClasses} onUpdateAnnotation={updateAnnotation} dark={dm} />
                </div>
              </div>
            </div>
          )}

          {/* 3D Annotation */}
          {viewMode === 'annotation-3d' && (
            <Annotation3DWorkspace dark={dm} onBack={() => setViewMode('projects')}
              annotations={annotations.filter(a => ['3d-cuboid','cuboid-3d','point-cloud-segmentation','3d-tracking','bev-annotation','lane-annotation','sensor-fusion','point-classification'].includes(a.type))}
              classes={annotationClasses}
              onCreateAnnotation={(ann) => { setAnnotations(prev => [...prev, ann]); setDirty(true); }}
              onUpdateAnnotation={updateAnnotation}
              onDeleteAnnotation={(id) => { setAnnotations(prev => prev.filter(a => a.id !== id)); setDirty(true); }}
            />
          )}

          {/* Taxonomy */}
          {viewMode === 'taxonomy' && (
            <TaxonomyPanel dark={dm} classes={annotationClasses} onAddClass={handleAddClass} onUpdateClass={handleUpdateClass}
              onRemoveClass={handleRemoveClass} onAddAttribute={handleAddAttribute} onRemoveAttribute={handleRemoveAttribute}
              onReorderClasses={(reordered) => setAnnotationClasses(reordered)} />
          )}

          {/* QA Review */}
          {viewMode === 'qa' && (
            <QAReviewPanel dark={dm} annotations={annotations}
              onApprove={(id) => updateAnnotation(id, { attributes: { reviewStatus: 'approved' } })}
              onReject={(id, reason, category) => updateAnnotation(id, { attributes: { reviewStatus: 'rejected', rejectReason: reason, rejectCategory: category } })}
              onRequestRevision={(id, comment) => updateAnnotation(id, { attributes: { reviewStatus: 'needs_revision', revisionComment: comment } })}
            />
          )}

          {/* Tasks */}
          {viewMode === 'tasks' && (
            <div className="p-6">
              <h1 className={`text-2xl font-bold mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>Tasks</h1>
              <div className={`rounded-xl p-8 text-center ${dm ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <Zap size={48} className={`mx-auto mb-4 opacity-30 ${dm ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={dm ? 'text-gray-400' : 'text-gray-600'}>Task management coming with team collaboration</p>
              </div>
            </div>
          )}

          {/* Analytics */}
          {viewMode === 'analytics' && (
            <div className="p-6">
              <h1 className={`text-2xl font-bold mb-6 ${dm ? 'text-white' : 'text-gray-900'}`}>Analytics</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map(p => (
                  <div key={p.id} className={`rounded-xl p-5 ${dm ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <h3 className={`font-semibold mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={dm ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
                      <span className={dm ? 'text-gray-300' : 'text-gray-700'}>{Math.min(100, Math.round((p.annotationCount / Math.max(p.imageCount, 1)) * 100))}%</span>
                    </div>
                    <div className={`h-2 rounded-full ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, (p.annotationCount / Math.max(p.imageCount, 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Models */}
          {viewMode === 'ai-models' && (
            <div className="p-6">
              <h1 className={`text-2xl font-bold mb-6 ${dm ? 'text-white' : 'text-gray-900'}`}>AI Models</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {aiModels.map(m => (
                  <div key={m.id} className={`rounded-xl p-5 ${dm ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{m.name}</h3>
                      <div className={`w-2.5 h-2.5 rounded-full ${m.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    </div>
                    <p className={`text-sm mb-3 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{m.description}</p>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span>Confidence</span><span className="font-semibold">{Math.round(m.confidence * 100)}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full mb-3 ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${m.confidence * 100}%` }} />
                    </div>
                    <button className={`w-full py-2 rounded-lg text-sm font-medium ${m.enabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                      {m.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team / Settings placeholder */}
          {(viewMode === 'team' || viewMode === 'settings') && (
            <div className="p-6">
              <h1 className={`text-2xl font-bold mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>{viewMode === 'team' ? 'Team Management' : 'Settings'}</h1>
              <div className={`rounded-xl p-8 text-center ${dm ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <p className={dm ? 'text-gray-400' : 'text-gray-600'}>Coming soon</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showProjectModal && <ProjectCreationModal dark={dm} onClose={() => setShowProjectModal(false)} onCreate={handleCreateProject} />}
      {showExportDialog && <ExportDialog isOpen={showExportDialog} onClose={() => setShowExportDialog(false)} annotations={annotations} imageName={imageName} dark={dm} />}
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} dark={dm} />}
    </div>
  );
}

export default App;
