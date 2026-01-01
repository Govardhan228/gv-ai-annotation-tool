import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Home, FolderOpen, Zap, BarChart3, Settings, Users, Brain, Moon, Sun, Menu, X, Plus, Search, Filter, Grid2x2 as Grid, List, Download, Upload, Save, Undo, Redo, Copy, Trash2, Eye, EyeOff, Lock, Unlock, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Maximize, HelpCircle } from 'lucide-react';
import Canvas, { CanvasRef } from './components/Canvas';
import StatusBar from './components/StatusBar';
import FileManager from './components/FileManager';
import AdvancedClassManager from './components/AdvancedClassManager';
import AdvancedToolbar from './components/AdvancedToolbar';
import PropertiesPanel from './components/PropertiesPanel';
import ExportDialog from './components/ExportDialog';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import {
  ViewMode,
  AnnotationTool,
  Annotation,
  Point,
  Project,
  AnnotationClass,
  ClassAttribute,
  Tool,
  ExportFormat,
  AIModel,
  Measurement,
  EditHandle,
  KeyPointTemplate,
  KeyPoint
} from './types';

function App() {
  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Project state
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Medical Imaging Dataset',
      description: 'X-ray image annotations for pneumonia detection',
      imageCount: 1250,
      annotationCount: 3420,
      lastModified: new Date('2024-01-15'),
      status: 'active',
      thumbnail: 'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&w=400',
      collaborators: ['Dr. Smith', 'Dr. Johnson'],
      settings: {
        autoSave: true,
        showConfidence: true,
        enableAI: true,
        defaultStrokeWidth: 2,
        defaultFillOpacity: 0.3,
        gridSize: 20,
        snapToGrid: false,
        showMeasurements: true
      }
    },
    {
      id: '2',
      name: 'Autonomous Vehicle Dataset',
      description: 'Street scene object detection and segmentation',
      imageCount: 5000,
      annotationCount: 25000,
      lastModified: new Date('2024-01-20'),
      status: 'review',
      thumbnail: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=400',
      collaborators: ['Team Alpha', 'Team Beta'],
      settings: {
        autoSave: true,
        showConfidence: false,
        enableAI: true,
        defaultStrokeWidth: 3,
        defaultFillOpacity: 0.2,
        gridSize: 10,
        snapToGrid: true,
        showMeasurements: false
      }
    },
    {
      id: '3',
      name: 'Manufacturing QC',
      description: 'Product defect detection and classification',
      imageCount: 800,
      annotationCount: 1200,
      lastModified: new Date('2024-01-18'),
      status: 'completed',
      thumbnail: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=400',
      collaborators: ['QC Team'],
      settings: {
        autoSave: true,
        showConfidence: true,
        enableAI: false,
        defaultStrokeWidth: 1,
        defaultFillOpacity: 0.4,
        gridSize: 5,
        snapToGrid: true,
        showMeasurements: true
      }
    }
  ]);

  // Annotation tool state
  const [tool, setTool] = useState<AnnotationTool>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | undefined>();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [editHandles, setEditHandles] = useState<EditHandle[]>([]);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [keyPointTemplate, setKeyPointTemplate] = useState<KeyPointTemplate>({
    id: 'person',
    name: 'Person',
    points: [
      { id: 'nose', name: 'Nose' },
      { id: 'left_eye', name: 'Left Eye' },
      { id: 'right_eye', name: 'Right Eye' },
      { id: 'left_ear', name: 'Left Ear' },
      { id: 'right_ear', name: 'Right Ear' },
      { id: 'left_shoulder', name: 'Left Shoulder' },
      { id: 'right_shoulder', name: 'Right Shoulder' },
      { id: 'left_elbow', name: 'Left Elbow' },
      { id: 'right_elbow', name: 'Right Elbow' },
      { id: 'left_wrist', name: 'Left Wrist' },
      { id: 'right_wrist', name: 'Right Wrist' },
      { id: 'left_hip', name: 'Left Hip' },
      { id: 'right_hip', name: 'Right Hip' },
      { id: 'left_knee', name: 'Left Knee' },
      { id: 'right_knee', name: 'Right Knee' },
      { id: 'left_ankle', name: 'Left Ankle' },
      { id: 'right_ankle', name: 'Right Ankle' }
    ],
    skeleton: [
      ['nose', 'left_eye'], ['nose', 'right_eye'],
      ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
    ]
  });
  const [imageName, setImageName] = useState<string>('');
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Class management
  const [annotationClasses, setAnnotationClasses] = useState<AnnotationClass[]>([
    {
      id: '1',
      name: 'Person',
      color: '#ef4444',
      description: 'Human detection',
      hotkey: '1',
      attributes: [
        {
          id: '1',
          name: 'Age Group',
          type: 'select',
          required: false,
          options: ['Child', 'Adult', 'Senior']
        },
        {
          id: '2',
          name: 'Visible',
          type: 'boolean',
          required: true
        }
      ]
    },
    {
      id: '2',
      name: 'Vehicle',
      color: '#3b82f6',
      description: 'Vehicle detection',
      hotkey: '2',
      attributes: [
        {
          id: '3',
          name: 'Type',
          type: 'select',
          required: true,
          options: ['Car', 'Truck', 'Bus', 'Motorcycle', 'Bicycle']
        },
        {
          id: '4',
          name: 'License Plate Visible',
          type: 'boolean',
          required: false
        }
      ]
    },
    {
      id: '3',
      name: 'Object',
      color: '#22c55e',
      description: 'General object detection',
      hotkey: '3',
      attributes: []
    }
  ]);
  const [selectedClass, setSelectedClass] = useState('Person');

  // History for undo/redo
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Canvas reference
  const canvasRef = useRef<CanvasRef>(null);

  // AI Models state
  const [aiModels, setAiModels] = useState<AIModel[]>([
    {
      id: '1',
      name: 'YOLOv8 Object Detection',
      type: 'detection',
      description: 'Real-time object detection model',
      confidence: 0.85,
      enabled: true
    },
    {
      id: '2',
      name: 'Mask R-CNN Segmentation',
      type: 'segmentation',
      description: 'Instance segmentation model',
      confidence: 0.92,
      enabled: false
    },
    {
      id: '3',
      name: 'ResNet Classification',
      type: 'classification',
      description: 'Image classification model',
      confidence: 0.88,
      enabled: true
    }
  ]);

  // Measurements state
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [pixelsPerUnit, setPixelsPerUnit] = useState(1);
  const [measurementUnit, setMeasurementUnit] = useState('px');

  // Add to history
  const addToHistory = useCallback((newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo/Redo functions
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'r': setTool('rectangle'); break;
          case 'c': setTool('circle'); break;
          case 'e': setTool('ellipse'); break;
          case 'p': setTool('polygon'); break;
          case 'l': setTool('polyline'); break;
          case 'a': setTool('arrow'); break;
          case 'i': setTool('line'); break;
          case 'u': setTool('curve'); break;
          case 'f': setTool('freehand'); break;
          case 'o': setTool('point'); break;
          case 't': setTool('text'); break;
          case 's': setTool('select'); break;
          case 'z': setTool('zoom'); break;
          case 'h': setTool('pan'); break;
          case 'm': setTool('measurement'); break;
          case 'w': setTool('magic-wand'); break;
          case 'g': 
            if (e.shiftKey) {
              setTool('auto-segment');
            } else {
              setShowGrid(!showGrid);
            }
            break;
          case 'v': 
            // Toggle all visibility
            setAnnotations(prev => prev.map(ann => ({ ...ann, visible: !ann.visible })));
            break;
          case 'f1':
            e.preventDefault();
            setShowShortcuts(!showShortcuts);
            break;
          case 'escape':
            setSelectedAnnotation(null);
            setCurrentPoints([]);
            setIsDrawing(false);
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            e.preventDefault();
            if (selectedAnnotation) {
              // Copy selected annotation
              const ann = annotations.find(a => a.id === selectedAnnotation);
              if (ann) {
                navigator.clipboard.writeText(JSON.stringify(ann));
              }
            }
            break;
          case 'v':
            e.preventDefault();
            // Paste annotation (simplified)
            break;
          case 'd':
            e.preventDefault();
            if (selectedAnnotation) {
              duplicateAnnotation();
            }
            break;
          case 'a':
            e.preventDefault();
            // Select all annotations
            break;
          case 's':
            e.preventDefault();
            // Save annotations
            break;
          case 'e':
            e.preventDefault();
            setShowExportDialog(true);
            break;
          case 'l':
            e.preventDefault();
            if (selectedAnnotation) {
              toggleLock();
            }
            break;
          case 'h':
            e.preventDefault();
            if (selectedAnnotation) {
              toggleVisibility();
            }
            break;
        }
      }

      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotation) {
          deleteAnnotation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotation, annotations, showGrid, showShortcuts, undo, redo]);

  // Navigation items
  const navigationItems = [
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'annotation-tool', label: 'Annotation Tool', icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai-models', label: 'AI Models', icon: Brain },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Canvas drawing functions
  const drawFunction = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!ctx) return;
    
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image if loaded
    if (image) {
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    }
    
    // Draw grid if enabled
    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = darkMode ? '#374151' : '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      for (let x = 0; x < canvas.width; x += gridSize * scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize * scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Draw annotations
    annotations.forEach(annotation => {
      if (!annotation.visible) return;
      
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);
      
      const isSelected = annotation.id === selectedAnnotation;
      const color = annotation.color || '#3b82f6';
      const strokeWidth = annotation.strokeWidth || 2;
      const fillOpacity = annotation.fillOpacity || 0.2;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.fillStyle = color + Math.round(fillOpacity * 255).toString(16).padStart(2, '0');
      
      if (isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = strokeWidth + 1;
      }
      
      switch (annotation.type) {
        case 'rectangle':
        case 'bounding-box':
          if (annotation.points.length >= 2) {
            const [p1, p2] = annotation.points;
            const minX = Math.min(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y);
            const width = Math.abs(p2.x - p1.x);
            const height = Math.abs(p2.y - p1.y);
            ctx.fillRect(minX, minY, width, height);
            ctx.strokeRect(minX, minY, width, height);
          }
          break;
          
        case 'circle':
          if (annotation.points.length >= 2) {
            const [center, edge] = annotation.points;
            const radius = Math.sqrt(
              Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
            );
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
          break;
          
        case 'ellipse':
          if (annotation.points.length >= 2) {
            const [center, edge] = annotation.points;
            const radiusX = Math.abs(edge.x - center.x);
            const radiusY = Math.abs(edge.y - center.y);
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
          break;
          
        case 'polygon':
        case 'polyline':
          if (annotation.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            for (let i = 1; i < annotation.points.length; i++) {
              ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
            }
            if (annotation.type === 'polygon') {
              ctx.closePath();
              ctx.fill();
            }
            ctx.stroke();
          }
          break;
          
        case 'arrow':
          if (annotation.points.length >= 2) {
            const [start, end] = annotation.points;
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const arrowLength = 15;
            const arrowAngle = Math.PI / 6;
            
            // Draw line
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            
            // Draw arrowhead
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - arrowLength * Math.cos(angle - arrowAngle),
              end.y - arrowLength * Math.sin(angle - arrowAngle)
            );
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - arrowLength * Math.cos(angle + arrowAngle),
              end.y - arrowLength * Math.sin(angle + arrowAngle)
            );
            ctx.stroke();
          }
          break;
          
        case 'line':
          if (annotation.points.length >= 2) {
            const [start, end] = annotation.points;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
          break;
          
        case 'point':
          if (annotation.points.length >= 1) {
            const point = annotation.points[0];
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
          break;
          
        case 'text':
          if (annotation.points.length >= 1 && annotation.text) {
            const point = annotation.points[0];
            ctx.font = `${annotation.fontSize || 16}px Arial`;
            ctx.fillStyle = color;
            ctx.fillText(annotation.text, point.x, point.y);
          }
          break;
          
        case 'freehand':
          if (annotation.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            for (let i = 1; i < annotation.points.length; i++) {
              ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
            }
            ctx.stroke();
          }
          break;
      }
      
      // Draw selection handles for selected annotation
      if (isSelected) {
        if ((annotation.type === 'bounding-box' || annotation.type === 'rectangle') && annotation.points.length >= 2) {
          const [p1, p2] = annotation.points;
          const minX = Math.min(p1.x, p2.x);
          const maxX = Math.max(p1.x, p2.x);
          const minY = Math.min(p1.y, p2.y);
          const maxY = Math.max(p1.y, p2.y);
          const midX = (minX + maxX) / 2;
          const midY = (minY + maxY) / 2;
          const handles = [
            { x: minX, y: minY },
            { x: midX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: midY },
            { x: maxX, y: maxY },
            { x: midX, y: maxY },
            { x: minX, y: maxY },
            { x: minX, y: midY }
          ];

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;

          handles.forEach(handle => {
            ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
            ctx.strokeRect(handle.x - 4, handle.y - 4, 8, 8);
          });
        } else if (annotation.type === 'keypoints') {
          const keypoints = annotation.metadata?.keypoints as KeyPoint[] || [];
          
          // Draw skeleton connections
          if (keyPointTemplate.skeleton) {
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 2;
            keyPointTemplate.skeleton.forEach(([startId, endId]) => {
              const startKp = keypoints.find(kp => kp.id === startId);
              const endKp = keypoints.find(kp => kp.id === endId);
              if (startKp && endKp && startKp.visible && endKp.visible) {
                ctx.beginPath();
                ctx.moveTo(startKp.x, startKp.y);
                ctx.lineTo(endKp.x, endKp.y);
                ctx.stroke();
              }
            });
          }
          
          // Draw keypoints
          ctx.globalAlpha = 1;
          keypoints.forEach((kp, index) => {
            if (kp.visible) {
              ctx.beginPath();
              ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
              ctx.fillStyle = annotation.color || '#3b82f6';
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // Draw keypoint name
              ctx.fillStyle = annotation.color || '#3b82f6';
              ctx.font = '10px Arial';
              ctx.fillText(kp.name, kp.x + 6, kp.y - 6);
            }
          });
          
          if (annotation.label) {
            const centerX = keypoints.reduce((sum, kp) => sum + kp.x, 0) / keypoints.length;
            const centerY = keypoints.reduce((sum, kp) => sum + kp.y, 0) / keypoints.length;
            ctx.fillStyle = annotation.color || '#3b82f6';
            ctx.font = '12px Arial';
            ctx.fillText(annotation.label, centerX, centerY - 20);
          }
        } else if ((annotation.type === 'cuboid' || annotation.type === 'cuboid-3d') && annotation.points.length >= 2) {
          const [p1, p2] = annotation.points;
          const minX = Math.min(p1.x, p2.x);
          const maxX = Math.max(p1.x, p2.x);
          const minY = Math.min(p1.y, p2.y);
          const maxY = Math.max(p1.y, p2.y);
          const depth = Math.min(maxX - minX, maxY - minY) * 0.2;

          ctx.globalAlpha = annotation.fillOpacity || 0.1;
          ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
          ctx.globalAlpha = 1;
          ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

          ctx.globalAlpha = 0.5;
          ctx.strokeRect(minX + depth, minY - depth, maxX - minX, maxY - minY);

          for (let i = 0; i < 4; i++) {
            const corners = [
              { x: minX, y: minY },
              { x: maxX, y: minY },
              { x: maxX, y: maxY },
              { x: minX, y: maxY }
            ];
            const corner = corners[i];
            ctx.beginPath();
            ctx.moveTo(corner.x, corner.y);
            ctx.lineTo(corner.x + depth, corner.y - depth);
            ctx.stroke();
          }

          if (annotation.label) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = annotation.color || '#3b82f6';
            ctx.font = '12px Arial';
            ctx.fillText(annotation.label, minX, minY - 5);
          }
        }
      }
      
      ctx.restore();
    });
    
    // Draw current drawing
    if (isDrawing && currentPoints.length > 0) {
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);
      
      ctx.strokeStyle = annotationClasses.find(c => c.name === selectedClass)?.color || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      switch (tool) {
        case 'rectangle':
          if (currentPoints.length >= 2) {
            const [p1, p2] = currentPoints;
            const width = p2.x - p1.x;
            const height = p2.y - p1.y;
            ctx.strokeRect(p1.x, p1.y, width, height);
          }
          break;
          
        case 'circle':
          if (currentPoints.length >= 2) {
            const [center, edge] = currentPoints;
            const radius = Math.sqrt(
              Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
            );
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
          
        case 'polygon':
        case 'polyline':
          if (currentPoints.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
            for (let i = 1; i < currentPoints.length; i++) {
              ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
            }
            ctx.stroke();
          }
          break;
          
        case 'bounding-box':
          if (currentPoints.length >= 2) {
            const [p1, p2] = currentPoints;
            const minX = Math.min(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y);
            const width = Math.abs(p2.x - p1.x);
            const height = Math.abs(p2.y - p1.y);
            ctx.strokeRect(minX, minY, width, height);
          }
          break;
          
        case 'cuboid':
        case 'cuboid-3d':
          if (currentPoints.length >= 2) {
            const [p1, p2] = currentPoints;
            const minX = Math.min(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y);
            const width = Math.abs(p2.x - p1.x);
            const height = Math.abs(p2.y - p1.y);
            ctx.strokeRect(minX, minY, width, height);

            const depth = Math.min(width, height) * 0.3;
            ctx.globalAlpha = 0.5;
            ctx.strokeRect(minX + depth, minY - depth, width, height);
            ctx.globalAlpha = 1;
          }
          break;
      }
      
      ctx.restore();
    }
    
    // Draw edit handles for selected annotation
    if (selectedAnnotation && editHandles.length > 0) {
      ctx.globalAlpha = 1;
      editHandles.forEach(handle => {
        ctx.fillStyle = handle.type === 'keypoint' ? '#ff6b6b' : '#ffffff';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        
        const size = 6 / scale;
        ctx.beginPath();
        if (handle.type === 'keypoint') {
          ctx.arc(handle.x, handle.y, size, 0, 2 * Math.PI);
        } else {
          ctx.rect(handle.x - size/2, handle.y - size/2, size, size);
        }
        ctx.fill();
        ctx.stroke();
      });
    }
  }, [
    image, scale, offset, showGrid, gridSize, darkMode, annotations, selectedAnnotation,
    isDrawing, currentPoints, tool, selectedClass, annotationClasses, editHandles, keyPointTemplate
  ]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - offset.x;
    const y = (e.clientY - rect.top) / scale - offset.y;

    if (snapToGrid) {
      const snappedX = Math.round(x / gridSize) * gridSize;
      const snappedY = Math.round(y / gridSize) * gridSize;
    }

    const point = { x, y };

    if (selectedAnnotation && editHandles.length > 0) {
      const tolerance = 8;
      const draggedHandle = editHandles.find(h => {
        const dist = Math.sqrt(Math.pow(h.x - x, 2) + Math.pow(h.y - y, 2));
        return dist <= tolerance;
      });

      if (draggedHandle) {
        setDragHandle(draggedHandle.id);
        return;
      }
    }

    switch (tool) {
      case 'select':
        // Find clicked annotation
        const clickedAnnotation = annotations.find(ann => {
          if (!ann.visible) return false;
          
          switch (ann.type) {
            case 'rectangle':
            case 'bounding-box':
              if (ann.points.length >= 2) {
                const [p1, p2] = ann.points;
                const minX = Math.min(p1.x, p2.x);
                const maxX = Math.max(p1.x, p2.x);
                const minY = Math.min(p1.y, p2.y);
                const maxY = Math.max(p1.y, p2.y);
                return x >= minX && x <= maxX && y >= minY && y <= maxY;
              }
              break;
            case 'circle':
              if (ann.points.length >= 2) {
                const [center, edge] = ann.points;
                const radius = Math.sqrt(
                  Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
                );
                const distance = Math.sqrt(
                  Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
                );
                return distance <= radius;
              }
              break;
            // Add other shape hit detection as needed
          }
          return false;
        });
        
        if (clickedAnnotation) {
          setSelectedAnnotation(clickedAnnotation.id);
          setEditHandles(getEditHandles(clickedAnnotation));
        } else {
          setSelectedAnnotation(null);
          setEditHandles([]);
        }
        break;
        
      case 'rectangle':
      case 'circle':
      case 'ellipse':
      case 'arrow':
      case 'line':
      case 'bounding-box':
      case 'cuboid':
      case 'cuboid-3d':
        setIsDrawing(true);
        setCurrentPoints([point]);
        break;
        
      case 'polygon':
      case 'polyline':
        if (!isDrawing) {
          setIsDrawing(true);
          setCurrentPoints([point]);
        } else {
          setCurrentPoints(prev => [...prev, point]);
        }
        break;
        
      case 'point':
        createAnnotation([point]);
        break;
        
      case 'text':
        const text = prompt('Enter text:');
        if (text) {
          createAnnotation([point], text);
        }
        break;
        
      case 'freehand':
        setIsDrawing(true);
        setCurrentPoints([point]);
        break;
    }
  }, [tool, scale, offset, snapToGrid, gridSize, annotations, isDrawing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - offset.x;
    const y = (e.clientY - rect.top) / scale - offset.y;

    setMousePos({ x, y });

    if (dragHandle && selectedAnnotation) {
      const annotation = annotations.find(ann => ann.id === selectedAnnotation);
      if (annotation) {
        let newPoints = [...annotation.points];

        if (dragHandle === 'tl' && newPoints.length >= 2) {
          newPoints[0] = { x, y };
        } else if (dragHandle === 'tr' && newPoints.length >= 2) {
          newPoints[0] = { x: newPoints[0].x, y };
          newPoints[1] = { x, y: newPoints[1].y };
        } else if (dragHandle === 'bl' && newPoints.length >= 2) {
          newPoints[0] = { x, y: newPoints[0].y };
          newPoints[1] = { x: newPoints[1].x, y };
        } else if (dragHandle === 'br' && newPoints.length >= 2) {
          newPoints[1] = { x, y };
        } else if (dragHandle === 'tm' && newPoints.length >= 2) {
          newPoints[0] = { x: newPoints[0].x, y };
        } else if (dragHandle === 'bm' && newPoints.length >= 2) {
          newPoints[1] = { x: newPoints[1].x, y };
        } else if (dragHandle === 'ml' && newPoints.length >= 2) {
          newPoints[0] = { x, y: newPoints[0].y };
        } else if (dragHandle === 'mr' && newPoints.length >= 2) {
          newPoints[1] = { x, y: newPoints[1].y };
        } else if (dragHandle.startsWith('point-') && annotation.type === 'polygon') {
          const idx = parseInt(dragHandle.split('-')[1]);
          if (idx >= 0 && idx < newPoints.length) {
            newPoints[idx] = { x, y };
          }
        } else if (dragHandle === 'edge' && annotation.type === 'circle') {
          newPoints[1] = { x, y };
        }

        updateAnnotation(selectedAnnotation, { points: newPoints });
      }
      return;
    }

    if (isDrawing && currentPoints.length > 0) {
      const point = { x, y };

      switch (tool) {
        case 'rectangle':
        case 'circle':
        case 'ellipse':
        case 'arrow':
        case 'line':
        case 'bounding-box':
        case 'cuboid':
        case 'cuboid-3d':
          setCurrentPoints([currentPoints[0], point]);
          break;

        case 'freehand':
          setCurrentPoints(prev => [...prev, point]);
          break;
      }
    }
  }, [scale, offset, isDrawing, currentPoints, tool, dragHandle, selectedAnnotation, annotations, updateAnnotation]);

  const handleMouseUp = useCallback(() => {
    if (dragHandle) {
      setDragHandle(null);
      if (selectedAnnotation) {
        const annotation = annotations.find(ann => ann.id === selectedAnnotation);
        if (annotation) {
          setEditHandles(getEditHandles(annotation));
        }
      }
      return;
    }

    if (isDrawing && currentPoints.length >= 2) {
      switch (tool) {
        case 'rectangle':
        case 'circle':
        case 'ellipse':
        case 'arrow':
        case 'line':
        case 'freehand':
        case 'bounding-box':
        case 'cuboid':
        case 'cuboid-3d':
          createAnnotation(currentPoints);
          setIsDrawing(false);
          setCurrentPoints([]);
          break;
      }
    }
  }, [isDrawing, currentPoints, tool, dragHandle, selectedAnnotation, annotations]);

  const handleDoubleClick = useCallback(() => {
    if (isDrawing && (tool === 'polygon' || tool === 'polyline') && currentPoints.length >= 2) {
      createAnnotation(currentPoints);
      setIsDrawing(false);
      setCurrentPoints([]);
    }
  }, [isDrawing, tool, currentPoints]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
    }
  }, []);

  // Create annotation
  const createAnnotation = useCallback((points: Point[], text?: string) => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: tool as any,
      label: selectedClass,
      points,
      visible: true,
      locked: false,
      text,
      fontSize: 16,
      color: annotationClasses.find(c => c.name === selectedClass)?.color || '#3b82f6',
      strokeWidth: 2,
      fillOpacity: 0.2,
      confidence: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Current User',
      tags: [],
      attributes: {}
    };
    
    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
    setSelectedAnnotation(newAnnotation.id);
  }, [tool, selectedClass, annotations, annotationClasses, addToHistory]);

  const getEditHandles = (annotation: Annotation): EditHandle[] => {
    const handles: EditHandle[] = [];

    if (annotation.type === 'bounding-box' || annotation.type === 'rectangle') {
      if (annotation.points.length >= 2) {
        const [p1, p2] = annotation.points;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        handles.push(
          { id: 'tl', x: minX, y: minY, type: 'corner', cursor: 'nwse-resize' },
          { id: 'tm', x: midX, y: minY, type: 'edge', cursor: 'ns-resize' },
          { id: 'tr', x: maxX, y: minY, type: 'corner', cursor: 'nesw-resize' },
          { id: 'mr', x: maxX, y: midY, type: 'edge', cursor: 'ew-resize' },
          { id: 'br', x: maxX, y: maxY, type: 'corner', cursor: 'nwse-resize' },
          { id: 'bm', x: midX, y: maxY, type: 'edge', cursor: 'ns-resize' },
          { id: 'bl', x: minX, y: maxY, type: 'corner', cursor: 'nesw-resize' },
          { id: 'ml', x: minX, y: midY, type: 'edge', cursor: 'ew-resize' }
        );
      }
    } else if (annotation.type === 'circle') {
      if (annotation.points.length >= 2) {
        const [center, edge] = annotation.points;
        handles.push(
          { id: 'center', x: center.x, y: center.y, type: 'move', cursor: 'move' },
          { id: 'edge', x: edge.x, y: edge.y, type: 'radius', cursor: 'pointer' }
        );
      }
    } else if (annotation.type === 'polygon' || annotation.type === 'polyline') {
      annotation.points.forEach((point, idx) => {
        handles.push({
          id: `point-${idx}`,
          x: point.x,
          y: point.y,
          type: 'point',
          cursor: 'pointer'
        });
      });
    } else if (annotation.type === 'line' || annotation.type === 'arrow') {
      if (annotation.points.length >= 2) {
        const [p1, p2] = annotation.points;
        handles.push(
          { id: 'start', x: p1.x, y: p1.y, type: 'point', cursor: 'pointer' },
          { id: 'end', x: p2.x, y: p2.y, type: 'point', cursor: 'pointer' }
        );
      }
    }

    return handles;
  };

  // Annotation management functions
  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    const newAnnotations = annotations.map(ann =>
      ann.id === id ? { ...ann, ...updates, updatedAt: new Date() } : ann
    );
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
  }, [annotations, addToHistory]);

  const deleteAnnotation = useCallback(() => {
    if (!selectedAnnotation) return;
    const newAnnotations = annotations.filter(ann => ann.id !== selectedAnnotation);
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
    setSelectedAnnotation(null);
  }, [selectedAnnotation, annotations, addToHistory]);

  const duplicateAnnotation = useCallback(() => {
    if (!selectedAnnotation) return;
    const annotation = annotations.find(ann => ann.id === selectedAnnotation);
    if (!annotation) return;
    
    const duplicated: Annotation = {
      ...annotation,
      id: Date.now().toString(),
      points: annotation.points.map(p => ({ x: p.x + 10, y: p.y + 10 })),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newAnnotations = [...annotations, duplicated];
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
    setSelectedAnnotation(duplicated.id);
  }, [selectedAnnotation, annotations, addToHistory]);

  const toggleLock = useCallback(() => {
    if (!selectedAnnotation) return;
    updateAnnotation(selectedAnnotation, { 
      locked: !annotations.find(ann => ann.id === selectedAnnotation)?.locked 
    });
  }, [selectedAnnotation, annotations, updateAnnotation]);

  const toggleVisibility = useCallback(() => {
    if (!selectedAnnotation) return;
    updateAnnotation(selectedAnnotation, { 
      visible: !annotations.find(ann => ann.id === selectedAnnotation)?.visible 
    });
  }, [selectedAnnotation, annotations, updateAnnotation]);

  // File handling
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageName(file.name);
        setScale(1);
        setOffset({ x: 0, y: 0 });
      };
      img.src = URL.createObjectURL(file);
    }
  }, []);

  const handleExport = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.annotations && Array.isArray(data.annotations)) {
            setAnnotations(data.annotations);
            addToHistory(data.annotations);
          }
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  }, [addToHistory]);

  // Class management functions
  const handleAddClass = useCallback((classData: Omit<AnnotationClass, 'id'>) => {
    const newClass: AnnotationClass = {
      ...classData,
      id: Date.now().toString()
    };
    setAnnotationClasses(prev => [...prev, newClass]);
  }, []);

  const handleUpdateClass = useCallback((id: string, updates: Partial<AnnotationClass>) => {
    setAnnotationClasses(prev => prev.map(cls => 
      cls.id === id ? { ...cls, ...updates } : cls
    ));
  }, []);

  const handleRemoveClass = useCallback((id: string) => {
    setAnnotationClasses(prev => prev.filter(cls => cls.id !== id));
  }, []);

  // Get selected annotation object
  const selectedAnnotationObj = selectedAnnotation 
    ? annotations.find(ann => ann.id === selectedAnnotation) 
    : null;

  // Statistics
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalImages: projects.reduce((sum, p) => sum + p.imageCount, 0),
    totalAnnotations: projects.reduce((sum, p) => sum + p.annotationCount, 0),
    avgAnnotationsPerImage: projects.reduce((sum, p) => sum + p.annotationCount, 0) / 
                           Math.max(projects.reduce((sum, p) => sum + p.imageCount, 0), 1)
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Navigation */}
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">GV</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GV.AI
                </h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Professional Annotation Tool
                </p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex gap-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setViewMode(item.id as ViewMode)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === item.id
                      ? darkMode 
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-800'
                      : darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={18} className="inline mr-2" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-4">
            {viewMode === 'annotation-tool' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowShortcuts(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Keyboard Shortcuts (F1)"
                >
                  <HelpCircle size={18} />
                </button>
                
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-2 rounded-lg transition-colors ${
                    showGrid
                      ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                      : darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Toggle Grid (G)"
                >
                  <Grid size={18} />
                </button>
                
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setScale(prev => Math.max(0.1, prev * 0.9))}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="px-2 text-sm font-mono">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={() => setScale(prev => Math.min(5, prev * 1.1))}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Projects View */}
        {viewMode === 'projects' && (
          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Projects</h2>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Manage your annotation projects and datasets
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus size={18} />
                  New Project
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FolderOpen className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalProjects}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Projects
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Zap className="text-green-600" size={24} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.activeProjects}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Active Projects
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalImages.toLocaleString()}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Images
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Zap className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalAnnotations.toLocaleString()}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total Annotations
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group`}
                    onClick={() => setViewMode('annotation-tool')}
                  >
                    {project.thumbnail && (
                      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {project.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : project.status === 'review'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {project.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {project.imageCount.toLocaleString()}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Images
                        </p>
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {project.annotationCount.toLocaleString()}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Annotations
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {project.collaborators?.length || 0} collaborators
                        </span>
                      </div>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {project.lastModified.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Quick Tool Card */}
                <div
                  className={`${darkMode ? 'bg-gradient-to-br from-blue-900 to-purple-900 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'} border-2 border-dashed rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center text-center min-h-[300px]`}
                  onClick={() => setViewMode('annotation-tool')}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    darkMode ? 'bg-blue-600' : 'bg-blue-100'
                  } group-hover:scale-110 transition-transform duration-200`}>
                    <Zap className={darkMode ? 'text-white' : 'text-blue-600'} size={32} />
                  </div>
                  <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Quick Tool
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                    Start annotating immediately without creating a project
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Annotation Tool View */}
        {viewMode === 'annotation-tool' && (
          <>
            {/* Advanced Toolbar */}
            <AdvancedToolbar
              tool={tool}
              onToolChange={setTool}
              selectedAnnotation={selectedAnnotation}
              onDuplicate={duplicateAnnotation}
              onDelete={deleteAnnotation}
              onToggleLock={toggleLock}
              onToggleVisibility={toggleVisibility}
              onRotateLeft={() => {/* Implement rotation */}}
              onRotateRight={() => {/* Implement rotation */}}
              onFlipHorizontal={() => {/* Implement flip */}}
              onFlipVertical={() => {/* Implement flip */}}
              dark={darkMode}
            />

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col">
              {/* Canvas */}
              <div className="flex-1 p-4">
                <div className="w-full h-full flex items-center justify-center">
                  {image ? (
                    <Canvas
                      ref={canvasRef}
                      width={Math.min(image.width * scale, window.innerWidth - 400)}
                      height={Math.min(image.height * scale, window.innerHeight - 200)}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onDoubleClick={handleDoubleClick}
                      onWheel={handleWheel}
                      drawFunction={drawFunction}
                    />
                  ) : (
                    <div className={`text-center p-12 border-2 border-dashed rounded-xl ${
                      darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'
                    }`}>
                      <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Image Loaded</h3>
                      <p className="text-sm mb-4">Upload an image to start annotating</p>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                        <Upload size={18} />
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Bar */}
              <StatusBar
                tool={tool}
                scale={scale}
                mousePos={mousePos}
                polygonPoints={currentPoints.length}
                selectedAnnotation={selectedAnnotationObj}
                annotationCount={annotations.length}
                visibleCount={annotations.filter(ann => ann.visible).length}
                lockedCount={annotations.filter(ann => ann.locked).length}
              />
            </div>

            {/* Right Sidebar */}
            <div className="w-96 flex flex-col">
              {/* File Manager */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <FileManager
                  onImageUpload={handleImageUpload}
                  onExport={handleExport}
                  onImport={handleImport}
                  hasImage={!!image}
                  annotationCount={annotations.length}
                />
              </div>

              {/* Class Manager */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <AdvancedClassManager
                  annotationClasses={annotationClasses}
                  selectedClass={selectedClass}
                  onClassSelect={setSelectedClass}
                  onAddClass={handleAddClass}
                  onUpdateClass={handleUpdateClass}
                  onRemoveClass={handleRemoveClass}
                  dark={darkMode}
                />
              </div>

              {/* Properties Panel */}
              <div className="flex-1">
                <PropertiesPanel
                  selectedAnnotation={selectedAnnotationObj}
                  annotationClasses={annotationClasses}
                  onUpdateAnnotation={updateAnnotation}
                  dark={darkMode}
                />
              </div>
            </div>
          </>
        )}

        {/* Analytics View */}
        {viewMode === 'analytics' && (
          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Annotation Progress</h3>
                  <div className="space-y-3">
                    {projects.map(project => (
                      <div key={project.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{project.name}</span>
                          <span>{Math.round((project.annotationCount / project.imageCount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (project.annotationCount / project.imageCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Project Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Active</span>
                      <span className="font-semibold">{projects.filter(p => p.status === 'active').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Review</span>
                      <span className="font-semibold">{projects.filter(p => p.status === 'review').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed</span>
                      <span className="font-semibold">{projects.filter(p => p.status === 'completed').length}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Avg. Annotations/Image</span>
                      <span className="font-semibold">{stats.avgAnnotationsPerImage.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Collaborators</span>
                      <span className="font-semibold">
                        {new Set(projects.flatMap(p => p.collaborators || [])).size}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Models View */}
        {viewMode === 'ai-models' && (
          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">AI Models</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiModels.map(model => (
                  <div key={model.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{model.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${model.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {model.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm">Confidence</span>
                      <span className="font-semibold">{Math.round(model.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${model.confidence * 100}%` }}
                      />
                    </div>
                    <button className={`w-full py-2 px-4 rounded-lg transition-colors ${
                      model.enabled 
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}>
                      {model.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other views placeholder */}
        {(viewMode === 'collaboration' || viewMode === 'settings') && (
          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 capitalize">{viewMode}</h2>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-12 rounded-xl shadow-sm text-center`}>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {viewMode === 'collaboration' ? 'Collaboration features coming soon...' : 'Settings panel coming soon...'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          annotations={annotations}
          imageName={imageName}
          dark={darkMode}
        />
      )}

      {showShortcuts && (
        <KeyboardShortcuts
          onClose={() => setShowShortcuts(false)}
          dark={darkMode}
        />
      )}
    </div>
  );
}

export default App;