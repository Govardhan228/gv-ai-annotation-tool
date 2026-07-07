import React, { useState, useRef, useCallback } from 'react';
import Canvas2D from '../annotation/Canvas2D';
import { AnnotationShape, ToolType, genId } from '../annotation/engine';
import { useAppStore } from '../store/appStore';
import {
  MousePointer2, Square, RotateCw, Pentagon, Minus, MapPin, Pencil, Eraser,
  Save, Undo, Redo, Maximize2, Minimize2,
  Eye, EyeOff, Trash2, Lock, Unlock, Copy, Tag, Layers, Box, Film, Upload, Image,
  Ruler, Wand2, Sparkles, Magnet, Target, CircleDot,
  ChevronDown, ChevronRight, Keyboard, X,
  PanelLeft, PanelRight, LayoutGrid, Play, Pause, SkipForward,
  SkipBack, Hash, Info, Zap, Car, PersonStanding, Bike, Truck, Bus, TrafficCone
} from 'lucide-react';

// AV-specific object classes (autonomous vehicle categories)
const CLASSES = [
  { name: 'Car', color: '#3b82f6', icon: Car },
  { name: 'Truck', color: '#f97316', icon: Truck },
  { name: 'Bus', color: '#8b5cf6', icon: Bus },
  { name: 'Motorcycle', color: '#06b6d4', icon: Bike },
  { name: 'Bicycle', color: '#22c55e', icon: Bike },
  { name: 'Pedestrian', color: '#ec4899', icon: PersonStanding },
  { name: 'Traffic Sign', color: '#f59e0b', icon: TrafficCone },
  { name: 'Traffic Light', color: '#ef4444', icon: Target },
  { name: 'Road Barrier', color: '#6366f1', icon: Square },
  { name: 'Construction', color: '#a855f7', icon: Box },
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
    name: '3D Bounding Box',
    tools: [
      { id: 'bounding-box', icon: Square, label: '3D Cuboid' },
      { id: 'rotated-box', icon: RotateCw, label: 'Oriented Box' },
      { id: 'polygon', icon: Pentagon, label: 'Polygon' },
      { id: 'smart-polygon', icon: Sparkles, label: 'AI Polygon' },
      { id: 'magnetic-polygon', icon: Magnet, label: 'Magnetic' },
      { id: 'polyline', icon: Minus, label: 'Lane Line' },
      { id: 'point', icon: MapPin, label: 'Keypoint' },
      { id: 'brush', icon: Pencil, label: 'Brush' },
      { id: 'eraser', icon: Eraser, label: 'Eraser' },
      { id: 'ruler', icon: Ruler, label: 'Ruler' },
      { id: 'magic-wand', icon: Wand2, label: 'Magic Wand' },
    ],
  },
  {
    name: 'AI Assist',
    tools: [
      { id: 'sem-seg', icon: Target, label: 'Semantic Seg' },
      { id: 'instance-seg', icon: CircleDot, label: 'Instance Seg' },
    ],
  },
];

export default function StudioView() {
  const dm = useAppStore((s) => s.darkMode);
  const [mode, setMode] = useState<'2d' | 'video' | '3d' | 'multi-camera'>('2d');
  const [tool, setTool] = useState<ToolType>('bounding-box');
  const [selectedClass, setSelectedClass] = useState('Car');
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [totalFrames] = useState(9900);
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

  return (
    <div className={`flex h-full overflow-hidden ${dm ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Left toolbar */}
      {showLeftPanel && (
        <div className={`w-[56px] flex flex-col items-center border-r shrink-0 ${dm ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          {TOOL_GROUPS.map((group) => (
            <div key={group.name} className="w-full">
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center justify-center py-1.5 text-[9px] uppercase tracking-widest font-semibold ${dm ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {collapsedGroups[group.name] ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
              </button>
              {!collapsedGroups[group.name] && group.tools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  title={`${t.label} (${t.id === 'select' ? 'S' : t.id === 'bounding-box' ? 'B' : t.id === 'polygon' ? 'P' : t.id === 'polyline' ? 'L' : t.id === 'point' ? 'O' : t.id === 'brush' ? 'F' : ''})`}
                  className={`w-[56px] h-[46px] flex items-center justify-center transition-all relative group ${
                    tool === t.id
                      ? (dm ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-blue-400' : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600')
                      : (dm ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')
                  }`}
                >
                  <t.icon size={16} strokeWidth={1.75} className="transition-transform group-hover:scale-110" />
                  {tool === t.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-gradient-to-b from-blue-500 to-cyan-500" />
                  )}
                </button>
              ))}
              <div className={`w-8 h-px mx-auto my-1.5 ${dm ? 'bg-slate-800' : 'bg-slate-200'}`} />
            </div>
          ))}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Image / LiDAR Frame"
            className={`w-[56px] h-[46px] flex items-center justify-center rounded transition-all group ${dm ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
          >
            <Upload size={16} className="transition-transform group-hover:scale-110" />
          </button>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${dm ? 'bg-slate-900/50 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-sm`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
            >
              <PanelLeft size={15} />
            </button>
            <div className={`flex p-0.5 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
              {([
                { id: '2d' as const, label: 'Camera', icon: Image },
                { id: 'video' as const, label: 'Video', icon: Film },
                { id: '3d' as const, label: 'LiDAR', icon: Box },
                { id: 'multi-camera' as const, label: 'Multi-Sensor', icon: Layers },
              ]).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    mode === m.id
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm'
                      : (dm ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                  }`}
                >
                  <m.icon size={12} /> {m.label}
                </button>
              ))}
            </div>
            <div className={`w-px h-5 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <span className={`text-xs font-medium truncate max-w-[140px] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Urban Driving Sequence Q3</span>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setFitTrigger((n) => n + 1)} title="Fit to Screen" className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
              <Maximize2 size={14} />
            </button>
            <button onClick={() => setActualSizeTrigger((n) => n + 1)} title="Actual Size" className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
              <Minimize2 size={14} />
            </button>
            <div className={`w-px h-4 mx-0.5 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <button onClick={triggerUndo} title="Undo (Ctrl+Z)" className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
              <Undo size={14} />
            </button>
            <button onClick={triggerRedo} title="Redo (Ctrl+Y)" className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
              <Redo size={14} />
            </button>
            <div className={`w-px h-4 mx-0.5 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <button onClick={() => setShowMinimap(!showMinimap)} title="Minimap" className={`p-1.5 rounded-lg transition-colors ${showMinimap ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600') : (dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400')}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts" className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
              <Keyboard size={14} />
            </button>
            <div className={`w-px h-4 mx-0.5 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm hover:shadow-md btn-press">
              <Save size={13} /> Save
            </button>
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
            >
              <PanelRight size={15} />
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
            <div className={`absolute bottom-12 left-3 w-44 h-36 rounded-xl border shadow-2xl overflow-hidden animate-fade-in-scale ${dm ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'} backdrop-blur`}>
              <div className={`absolute top-0 left-0 right-0 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${dm ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>LiDAR Overview</div>
              <div className={`h-full flex items-center justify-center text-[10px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
                Point Cloud View
              </div>
            </div>
          )}
        </div>

        {/* Video/LiDAR sequence timeline */}
        {(mode === 'video' || mode === '3d' || mode === 'multi-camera') && (
          <div className={`flex items-center gap-3 px-4 py-2.5 border-t ${dm ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-sm`}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2.5 rounded-lg transition-colors ${dm ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
              <SkipBack size={14} />
            </button>
            <button className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
              <SkipForward size={14} />
            </button>
            <span className={`text-xs font-mono w-20 text-center font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>
              {Math.floor(currentFrame / 30).toString().padStart(2, '0')}:{(currentFrame % 30).toString().padStart(2, '0')}
            </span>
            <div className={`flex-1 h-2 rounded-full overflow-hidden ${dm ? 'bg-slate-800' : 'bg-slate-200'} relative cursor-pointer`}>
              <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all" style={{ width: `${(currentFrame / totalFrames) * 100}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-all" style={{ left: `calc(${(currentFrame / totalFrames) * 100}% - 7px)` }} />
            </div>
            <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Frame {currentFrame} / {totalFrames.toLocaleString()}</span>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              <Hash size={11} /> 10 Hz LiDAR
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className={`flex items-center justify-between px-4 py-2 border-t text-xs ${dm ? 'bg-slate-900/80 border-slate-800 text-slate-500' : 'bg-white/80 border-slate-200 text-slate-400'} backdrop-blur-sm`}>
          <div className="flex items-center gap-4">
            <span className={`font-semibold capitalize ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{tool.replace(/-/g, ' ')}</span>
            <span className={`px-2 py-0.5 rounded-md ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{shapes.length} objects</span>
            {selectedIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-semibold">{selectedIds.length} selected</span>
            )}
            {imageUrl && <span className={`flex items-center gap-1 ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sensor data loaded</span>}
          </div>
          <div className="flex items-center gap-4">
            <span className={`hidden md:block ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
              Shift+click multi-select · Ctrl+D duplicate · Delete remove
            </span>
            <span className={`flex items-center gap-1.5 ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
              <Zap size={12} className="text-amber-500" />
              Auto-saved {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      {showRightPanel && (
        <div className={`w-72 flex flex-col border-l shrink-0 overflow-hidden ${dm ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur-sm`}>
          {/* Class selector - AV object classes */}
          <div className={`p-3 border-b ${dm ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Car size={13} className={dm ? 'text-slate-500' : 'text-slate-400'} />
                <h4 className={`text-xs font-semibold uppercase tracking-wider ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Object Classes</h4>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${dm ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>{CLASSES.length}</span>
            </div>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {CLASSES.map((cls) => (
                <button
                  key={cls.name}
                  onClick={() => setSelectedClass(cls.name)}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs transition-all ${
                    selectedClass === cls.name
                      ? (dm ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-blue-400 border border-blue-500/20' : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200')
                      : (dm ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800')
                  }`}
                >
                  <div className="w-3 h-3 rounded-md shrink-0 shadow-sm" style={{ backgroundColor: cls.color }} />
                  <span className="flex-1 text-left font-medium truncate">{cls.name}</span>
                  {selectedClass === cls.name && <CheckIcon size={12} className="text-blue-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk edit toolbar */}
          {selectedIds.length > 1 && (
            <div className={`p-3 border-b ${dm ? 'border-slate-800 bg-blue-600/5' : 'border-slate-200 bg-blue-50/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${dm ? 'text-blue-400' : 'text-blue-600'}`}>Bulk Edit ({selectedIds.length})</span>
                <button onClick={() => setSelectedIds([])} className={`p-1 rounded ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                  <X size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <select
                  onChange={(e) => e.target.value && bulkUpdateLabel(e.target.value)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium ${dm ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'}`}
                  value=""
                >
                  <option value="">Change class...</option>
                  {CLASSES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button onClick={bulkToggleVisibility} className={`p-1.5 rounded-lg transition-colors ${dm ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                  <Eye size={12} />
                </button>
                <button onClick={bulkToggleLock} className={`p-1.5 rounded-lg transition-colors ${dm ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                  <Lock size={12} />
                </button>
                <button onClick={bulkDelete} className={`p-1.5 rounded-lg transition-colors ${dm ? 'bg-slate-800 hover:bg-rose-900/30 text-rose-400' : 'bg-slate-100 hover:bg-rose-50 text-rose-500'}`}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Annotations list */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className={`text-xs font-semibold uppercase tracking-wider ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Annotations ({shapes.length})</h4>
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
                  className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
                  title="Duplicate"
                >
                  <Copy size={12} />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {shapes.length === 0 ? (
                <div className={`text-center py-8 ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <Car size={20} className={dm ? 'text-slate-600' : 'text-slate-300'} />
                  </div>
                  <p className="text-xs font-medium">{imageUrl ? 'Draw 3D bounding boxes' : 'Upload sensor data to start'}</p>
                </div>
              ) : (
                shapes.map((s, i) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedIds([s.id])}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                      selectedIds.includes(s.id)
                        ? (dm ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/10 border border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200')
                        : (dm ? 'bg-slate-800/30 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100')
                    } animate-fade-in stagger-${(i % 6) + 1}`}
                  >
                    <div className="w-3 h-3 rounded-md shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
                    <span className={`flex-1 truncate text-xs font-medium ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{s.label}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${dm ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'}`}>
                      {s.type === 'bbox' ? 'CUBOID' : s.type === 'polygon' ? 'POLY' : s.type === 'point' ? 'KEYPT' : s.type === 'polyline' ? 'LANE' : s.type === 'ruler' ? 'RULER' : s.type === 'rotated-box' ? 'ORIENT' : 'SHAPE'}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); toggleVisibility(s.id); }} className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${dm ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}>
                      {s.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleLock(s.id); }} className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${dm ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}>
                      {s.locked ? <Lock size={11} /> : <Unlock size={11} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShapes(shapes.filter((sh) => sh.id !== s.id)); setSelectedIds(selectedIds.filter((id) => id !== s.id)); }} className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${dm ? 'hover:bg-rose-900/30 text-rose-400' : 'hover:bg-rose-50 text-rose-500'}`}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Properties panel */}
          {selectedShape && (
            <div className={`p-3 border-t ${dm ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Object Properties</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Type</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${dm ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{selectedShape.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Label</span>
                  <span className={`text-xs font-semibold ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{selectedShape.label}</span>
                </div>
                {selectedShape.bbox && (
                  <>
                    <div className="flex justify-between">
                      <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Position (x, y)</span>
                      <span className={`text-xs font-mono font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round(selectedShape.bbox.x)}, {Math.round(selectedShape.bbox.y)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Size (w × h)</span>
                      <span className={`text-xs font-mono font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round(selectedShape.bbox.width)} × {Math.round(selectedShape.bbox.height)}</span>
                    </div>
                  </>
                )}
                {selectedShape.points && (
                  <div className="flex justify-between">
                    <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Vertices</span>
                    <span className={`text-xs font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{selectedShape.points.length}</span>
                  </div>
                )}
                {selectedShape.point && (
                  <div className="flex justify-between">
                    <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Position</span>
                    <span className={`text-xs font-mono font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round(selectedShape.point.x)}, {Math.round(selectedShape.point.y)}</span>
                  </div>
                )}
                {selectedShape.rotatedBox && (
                  <>
                    <div className="flex justify-between">
                      <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Center</span>
                      <span className={`text-xs font-mono font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round(selectedShape.rotatedBox.cx)}, {Math.round(selectedShape.rotatedBox.cy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Size</span>
                      <span className={`text-xs font-mono font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round(selectedShape.rotatedBox.width)} × {Math.round(selectedShape.rotatedBox.height)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Heading</span>
                      <span className={`text-xs font-mono font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round((selectedShape.rotatedBox.angle * 180) / Math.PI)}°</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className={`w-[420px] rounded-2xl shadow-2xl border overflow-hidden ${dm ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'} backdrop-blur animate-fade-in-scale`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${dm ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`text-base font-semibold ${dm ? 'text-white' : 'text-slate-900'}`}>Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X size={16} />
              </button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-1.5">
                {[
                  { key: 'Ctrl + Z', desc: 'Undo' },
                  { key: 'Ctrl + Y', desc: 'Redo' },
                  { key: 'Ctrl + D', desc: 'Duplicate selected' },
                  { key: 'Ctrl + C', desc: 'Copy selected' },
                  { key: 'Ctrl + V', desc: 'Paste' },
                  { key: 'Delete', desc: 'Delete selected' },
                  { key: 'Enter', desc: 'Finish polygon' },
                  { key: 'Escape', desc: 'Cancel / Deselect' },
                  { key: 'Shift + Click', desc: 'Multi-select' },
                  { key: 'Alt + Drag', desc: 'Pan canvas' },
                  { key: 'Ctrl + Scroll', desc: 'Zoom in/out' },
                  { key: 'Right-click', desc: 'Context menu' },
                ].map((item, i) => (
                  <div key={item.key} className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${dm ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} animate-slide-in stagger-${(i % 6) + 1}`}>
                    <span className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold ${dm ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{item.key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
