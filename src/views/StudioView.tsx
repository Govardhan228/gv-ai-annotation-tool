import React, { useState, useRef, useCallback } from 'react';
import Canvas2D from '../annotation/Canvas2D';
import { AnnotationShape, ToolType, genId } from '../annotation/engine';
import { useAppStore } from '../store/appStore';
import {
  MousePointer2, Square, RotateCw, Pentagon, Minus, MapPin, Pencil, Eraser,
  Save, Undo, Redo, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Grid2x2,
  Eye, EyeOff, Trash2, Lock, Unlock, Copy, Tag, Layers, Box, Film, Upload, Image,
  Move, Scissors, Ruler, Wand2, Sparkles, Magnet, Target, CircleDot, Type,
  ChevronDown, ChevronRight, Keyboard, Settings, Menu, X, ChevronUp,
  List, PanelLeft, PanelRight, LayoutGrid, Split, Scan, Play, Pause, SkipForward,
  SkipBack, Frame, AlignCenter, Hash, ArrowRightLeft, SlidersHorizontal,
  GripVertical, MoreHorizontal
} from 'lucide-react';

const CLASSES = [
  { name: 'Person', color: '#3b82f6' },
  { name: 'Truck', color: '#ef4444' },
  { name: 'Forklift', color: '#f97316' },
  { name: 'Pallet', color: '#eab308' },
  { name: 'Box', color: '#22c55e' },
  { name: 'Dolly', color: '#a855f7' },
  { name: 'Car', color: '#06b6d4' },
  { name: 'Cone', color: '#f59e0b' },
  { name: 'Pothole', color: '#6366f1' },
  { name: 'Road Sign', color: '#ec4899' },
];

interface ToolGroup {
  name: string;
  tools: { id: ToolType; icon: React.FC<any>; label: string }[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    name: 'Navigation',
    tools: [
      { id: 'select', icon: MousePointer2, label: 'Select' },
    ],
  },
  {
    name: '2D',
    tools: [
      { id: 'bounding-box', icon: Square, label: 'Bounding Box' },
      { id: 'rotated-box', icon: RotateCw, label: 'Rotated Box' },
      { id: 'polygon', icon: Pentagon, label: 'Polygon' },
      { id: 'smart-polygon', icon: Sparkles, label: 'Smart Polygon' },
      { id: 'magnetic-polygon', icon: Magnet, label: 'Magnetic' },
      { id: 'polyline', icon: Minus, label: 'Polyline' },
      { id: 'point', icon: MapPin, label: 'Point' },
      { id: 'brush', icon: Pencil, label: 'Brush' },
      { id: 'eraser', icon: Eraser, label: 'Eraser' },
      { id: 'ruler', icon: Ruler, label: 'Ruler' },
      { id: 'magic-wand', icon: Wand2, label: 'Magic Wand' },
    ],
  },
  {
    name: 'AI',
    tools: [
      { id: 'sem-seg', icon: Target, label: 'Sem Seg' },
      { id: 'instance-seg', icon: CircleDot, label: 'Instance Seg' },
    ],
  },
];

export default function StudioView() {
  const dm = useAppStore((s) => s.darkMode);
  const [mode, setMode] = useState<'2d' | 'video' | '3d' | 'multi-camera'>('2d');
  const [tool, setTool] = useState<ToolType>('bounding-box');
  const [selectedClass, setSelectedClass] = useState('Person');
  const [shapes, setShapes] = useState<AnnotationShape[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [actualSizeTrigger, setActualSizeTrigger] = useState(0);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [totalFrames, setTotalFrames] = useState(9900);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedShape = selectedIds.length === 1 ? shapes.find((s) => s.id === selectedIds[0]) : undefined;

  const toggleVisibility = (id: string) => {
    setShapes(shapes.map((s) => s.id === id ? { ...s, visible: !s.visible } : s));
  };
  const toggleLock = (id: string) => {
    setShapes(shapes.map((s) => s.id === id ? { ...s, locked: !s.locked } : s));
  };
  const bulkUpdateLabel = (newLabel: string) => {
    const color = CLASSES.find((c) => c.name === newLabel)?.color || '#3b82f6';
    setShapes(shapes.map((s) => selectedIds.includes(s.id) ? { ...s, label: newLabel, color } : s));
  };
  const bulkDelete = () => {
    setShapes(shapes.filter((s) => !selectedIds.includes(s.id)));
    setSelectedIds([]);
  };
  const bulkToggleVisibility = () => {
    const selected = shapes.filter((s) => selectedIds.includes(s.id));
    const allVisible = selected.every((s) => s.visible);
    setShapes(shapes.map((s) => selectedIds.includes(s.id) ? { ...s, visible: !allVisible } : s));
  };
  const bulkToggleLock = () => {
    const selected = shapes.filter((s) => selectedIds.includes(s.id));
    const allLocked = selected.every((s) => s.locked);
    setShapes(shapes.map((s) => selectedIds.includes(s.id) ? { ...s, locked: !allLocked } : s));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setShapes([]);
    setSelectedIds([]);
    e.target.value = '';
  };

  const triggerUndo = () => { const fn = (window as any).__canvasUndo; if (fn) fn(); };
  const triggerRedo = () => { const fn = (window as any).__canvasRedo; if (fn) fn(); };

  const toggleGroup = (name: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const activeGroup = TOOL_GROUPS.find((g) => g.tools.some((t) => t.id === tool));

  return (
    <div className={`flex h-full overflow-hidden ${dm ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Left toolbar */}
      {showLeftPanel && (
        <div className={`w-[52px] flex flex-col items-center border-r shrink-0 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {TOOL_GROUPS.map((group) => (
            <div key={group.name} className="w-full">
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center justify-center py-1 text-[9px] uppercase tracking-wider ${dm ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {collapsedGroups[group.name] ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
              </button>
              {!collapsedGroups[group.name] && group.tools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  title={`${t.label} (${t.id === 'select' ? 'S' : t.id === 'bounding-box' ? 'B' : t.id === 'polygon' ? 'P' : t.id === 'polyline' ? 'L' : t.id === 'point' ? 'O' : t.id === 'brush' ? 'F' : ''})`}
                  className={`w-[52px] h-[44px] flex items-center justify-center transition-all relative ${
                    tool === t.id
                      ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                      : (dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100')
                  }`}
                >
                  <t.icon size={15} strokeWidth={1.5} />
                  {tool === t.id && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r ${dm ? 'bg-blue-400' : 'bg-blue-600'}`} />
                  )}
                </button>
              ))}
              <div className={`w-8 h-px mx-auto my-1 ${dm ? 'bg-slate-800' : 'bg-slate-200'}`} />
            </div>
          ))}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image"
            className={`w-[52px] h-[44px] flex items-center justify-center ${dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Upload size={15} />
          </button>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <PanelLeft size={14} />
            </button>
            <div className="flex gap-0.5">
              {([
                { id: '2d' as const, label: '2D', icon: Image },
                { id: 'video' as const, label: 'Video', icon: Film },
                { id: '3d' as const, label: '3D', icon: Box },
                { id: 'multi-camera' as const, label: 'Multi-Cam', icon: Layers },
              ]).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    mode === m.id ? 'bg-blue-600 text-white' : (dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')
                  }`}
                >
                  <m.icon size={12} /> {m.label}
                </button>
              ))}
            </div>
            <div className={`w-px h-5 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <span className={`text-xs truncate max-w-[120px] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Urban Driving Dataset Q3</span>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Nav controls */}
            <button onClick={() => setFitTrigger((n) => n + 1)} title="Fit to Screen" className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <Maximize2 size={14} />
            </button>
            <button onClick={() => setActualSizeTrigger((n) => n + 1)} title="Actual Size" className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <Minimize2 size={14} />
            </button>
            <button onClick={triggerUndo} title="Undo (Ctrl+Z)" className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <Undo size={14} />
            </button>
            <button onClick={triggerRedo} title="Redo (Ctrl+Y)" className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <Redo size={14} />
            </button>
            <div className={`w-px h-5 mx-1 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <button onClick={() => setShowMinimap(!showMinimap)} title="Minimap" className={`p-1.5 rounded-md ${showMinimap ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600') : (dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts" className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <Keyboard size={14} />
            </button>
            <div className={`w-px h-5 mx-1 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium transition-colors">
              <Save size={12} /> Save
            </button>
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <PanelRight size={14} />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          <div className={`absolute inset-0 ${dm ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <Canvas2D
              classes={CLASSES}
              selectedClass={selectedClass}
              tool={tool}
              darkMode={dm}
              shapes={shapes}
              setShapes={setShapes}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              fitTrigger={fitTrigger}
              actualSizeTrigger={actualSizeTrigger}
            />
          </div>

          {/* Minimap */}
          {showMinimap && (
            <div className={`absolute bottom-10 left-2 w-40 h-32 rounded-lg border shadow-lg overflow-hidden ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`h-full flex items-center justify-center text-[10px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
                Minimap
              </div>
            </div>
          )}
        </div>

        {/* Video timeline */}
        {(mode === 'video' || mode === 'multi-camera') && (
          <div className={`flex items-center gap-3 px-3 py-2 border-t ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-full ${dm ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'}`}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <SkipBack size={14} />
            </button>
            <button className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <SkipForward size={14} />
            </button>
            <span className={`text-xs font-mono w-16 text-center ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
              {Math.floor(currentFrame / 30).toString().padStart(2, '0')}:{(currentFrame % 30).toString().padStart(2, '0')}
            </span>
            <div className={`flex-1 h-1.5 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-200'} relative cursor-pointer`}>
              <div className="absolute left-0 top-0 h-full rounded-full bg-blue-500" style={{ width: `${(currentFrame / totalFrames) * 100}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border border-slate-300" style={{ left: `${(currentFrame / totalFrames) * 100}%` }} />
            </div>
            <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Frame {currentFrame} / {totalFrames}</span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              <Hash size={10} /> 30 FPS
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className={`flex items-center justify-between px-3 py-1 border-t text-xs ${dm ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
          <div className="flex items-center gap-3">
            <span className="capitalize font-medium">{tool.replace(/-/g, ' ')}</span>
            <span>{shapes.length} annotations</span>
            {selectedIds.length > 0 && (
              <span className="text-blue-500 font-medium">{selectedIds.length} selected</span>
            )}
            {imageUrl && <span className={dm ? 'text-slate-600' : 'text-slate-400'}>Image loaded</span>}
          </div>
          <div className="flex items-center gap-3">
            <span>Shift+click multi-select · Ctrl+D duplicate · Ctrl+V paste · Delete remove</span>
            <span className={dm ? 'text-slate-600' : 'text-slate-400'}>
              Auto-saved {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      {showRightPanel && (
        <div className={`w-64 flex flex-col border-l shrink-0 overflow-hidden ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {/* Class selector */}
          <div className={`p-3 border-b ${dm ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Tag size={13} className={dm ? 'text-slate-400' : 'text-slate-500'} />
                <h4 className={`text-xs font-semibold uppercase tracking-wider ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Classes</h4>
              </div>
              <span className={`text-[10px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{CLASSES.length}</span>
            </div>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {CLASSES.map((cls) => (
                <button
                  key={cls.name}
                  onClick={() => setSelectedClass(cls.name)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors ${
                    selectedClass === cls.name
                      ? (dm ? 'bg-blue-600/15 text-blue-400' : 'bg-blue-50 text-blue-700')
                      : (dm ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50')
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: cls.color }} />
                  <span className="flex-1 text-left truncate">{cls.name}</span>
                  {selectedClass === cls.name && <span className="text-[10px] opacity-50">●</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk edit toolbar */}
          {selectedIds.length > 1 && (
            <div className={`p-2 border-b ${dm ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Bulk Edit ({selectedIds.length})</span>
                <button onClick={() => setSelectedIds([])} className={`p-0.5 ${dm ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                  <X size={10} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                <select
                  onChange={(e) => e.target.value && bulkUpdateLabel(e.target.value)}
                  className={`text-[10px] px-1.5 py-1 rounded border ${dm ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'}`}
                  value=""
                >
                  <option value="">Change class...</option>
                  {CLASSES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button onClick={bulkToggleVisibility} className={`px-1.5 py-1 rounded text-[10px] ${dm ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                  <Eye size={10} />
                </button>
                <button onClick={bulkToggleLock} className={`px-1.5 py-1 rounded text-[10px] ${dm ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                  <Lock size={10} />
                </button>
                <button onClick={bulkDelete} className={`px-1.5 py-1 rounded text-[10px] ${dm ? 'bg-slate-800 hover:bg-rose-900/30 text-rose-400' : 'bg-slate-100 hover:bg-rose-50 text-rose-600'}`}>
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          )}

          {/* Annotations list */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-xs font-semibold uppercase tracking-wider ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Annotations ({shapes.length})</h4>
              {selectedIds.length === 1 && (
                <button
                  onClick={() => {
                    const selected = shapes.filter((s) => selectedIds.includes(s.id));
                    if (selected.length === 1) {
                      const s = selected[0];
                      const dup: AnnotationShape = {
                        ...s,
                        id: genId(),
                        bbox: s.bbox ? { ...s.bbox, x: s.bbox.x + 20, y: s.bbox.y + 20 } : undefined,
                        point: s.point ? { x: s.point.x + 20, y: s.point.y + 20 } : undefined,
                        points: s.points ? s.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })) : undefined,
                        createdAt: Date.now(), updatedAt: Date.now(),
                      };
                      setShapes([...shapes, dup]);
                      setSelectedIds([dup.id]);
                    }
                  }}
                  className={`p-1 rounded ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                  title="Duplicate"
                >
                  <Copy size={12} />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {shapes.length === 0 ? (
                <p className={`text-xs text-center py-6 ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
                  {imageUrl ? 'Select a tool and draw on the image.' : 'Upload an image to start annotating.'}
                </p>
              ) : (
                shapes.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedIds([s.id])}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                      selectedIds.includes(s.id)
                        ? (dm ? 'bg-blue-600/15 border border-blue-500/30' : 'bg-blue-50 border border-blue-200')
                        : (dm ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100')
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                    <span className={`flex-1 truncate ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{s.label}</span>
                    <span className={`text-[9px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
                      {s.type === 'bbox' ? 'BOX' : s.type === 'polygon' ? 'POLY' : s.type === 'point' ? 'PT' : s.type === 'polyline' ? 'LINE' : s.type === 'ruler' ? 'RULER' : s.type === 'rotated-box' ? 'ROT' : 'SHAPE'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(s.id); }}
                      className={`p-0.5 ${dm ? 'hover:text-slate-300' : 'hover:text-slate-700'}`}
                      title="Toggle visibility"
                    >
                      {s.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLock(s.id); }}
                      className={`p-0.5 ${dm ? 'hover:text-slate-300' : 'hover:text-slate-700'}`}
                      title="Toggle lock"
                    >
                      {s.locked ? <Lock size={11} /> : <Unlock size={11} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShapes(shapes.filter((sh) => sh.id !== s.id));
                        setSelectedIds(selectedIds.filter((id) => id !== s.id));
                      }}
                      className={`p-0.5 ${dm ? 'hover:text-rose-400' : 'hover:text-rose-600'}`}
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Properties panel */}
          {selectedShape && (
            <div className={`p-3 border-t ${dm ? 'border-slate-800' : 'border-slate-200'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Properties</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Type</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${dm ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{selectedShape.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Label</span>
                  <span className={dm ? 'text-slate-200' : 'text-slate-700'}>{selectedShape.label}</span>
                </div>
                {selectedShape.bbox && (
                  <>
                    <div className="flex justify-between">
                      <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Position</span>
                      <span className={`font-mono ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{Math.round(selectedShape.bbox.x)}, {Math.round(selectedShape.bbox.y)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Size</span>
                      <span className={`font-mono ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{Math.round(selectedShape.bbox.width)} × {Math.round(selectedShape.bbox.height)}</span>
                    </div>
                  </>
                )}
                {selectedShape.points && (
                  <div className="flex justify-between">
                    <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Vertices</span>
                    <span className={dm ? 'text-slate-200' : 'text-slate-700'}>{selectedShape.points.length}</span>
                  </div>
                )}
                {selectedShape.point && (
                  <div className="flex justify-between">
                    <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Position</span>
                    <span className={`font-mono ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{Math.round(selectedShape.point.x)}, {Math.round(selectedShape.point.y)}</span>
                  </div>
                )}
                {selectedShape.rotatedBox && (
                  <>
                    <div className="flex justify-between">
                      <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Center</span>
                      <span className={`font-mono ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{Math.round(selectedShape.rotatedBox.cx)}, {Math.round(selectedShape.rotatedBox.cy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Size</span>
                      <span className={`font-mono ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{Math.round(selectedShape.rotatedBox.width)} × {Math.round(selectedShape.rotatedBox.height)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Angle</span>
                      <span className={`font-mono ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{Math.round((selectedShape.rotatedBox.angle * 180) / Math.PI)}°</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-96 rounded-xl shadow-2xl border p-5 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className={`p-1 rounded ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { key: 'Ctrl + Z', desc: 'Undo' },
                { key: 'Ctrl + Y', desc: 'Redo' },
                { key: 'Ctrl + D', desc: 'Duplicate selected' },
                { key: 'Ctrl + C', desc: 'Copy selected' },
                { key: 'Ctrl + V', desc: 'Paste' },
                { key: 'Delete', desc: 'Delete selected' },
                { key: 'Enter', desc: 'Finish polygon / polyline' },
                { key: 'Escape', desc: 'Cancel / Deselect' },
                { key: 'Shift + Click', desc: 'Multi-select' },
                { key: 'Alt + Drag', desc: 'Pan canvas' },
                { key: 'Ctrl + Scroll', desc: 'Zoom in/out' },
                { key: 'Right-click', desc: 'Context menu' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className={dm ? 'text-slate-400' : 'text-slate-500'}>{item.desc}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono ${dm ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{item.key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
