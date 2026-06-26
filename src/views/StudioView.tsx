import React, { useState, useRef } from 'react';
import Canvas2D from '../annotation/Canvas2D';
import { AnnotationShape, ToolType, genId } from '../annotation/engine';
import { useAppStore } from '../store/appStore';
import {
  MousePointer2, Square, Pentagon, Minus, MapPin, Pencil, Eraser,
  Save, Undo, Redo, ZoomIn, ZoomOut, Grid2x2, Eye, EyeOff,
  Trash2, Lock, Unlock, Copy, Tag, Layers, Box, Film, Upload, Image as ImageIcon
} from 'lucide-react';

const CLASSES = [
  { name: 'Person', color: '#3b82f6' },
  { name: 'Truck', color: '#ef4444' },
  { name: 'Forklift', color: '#f97316' },
  { name: 'Pallet', color: '#eab308' },
  { name: 'Box', color: '#22c55e' },
  { name: 'Dolly', color: '#a855f7' },
];

const TOOLS: { id: ToolType; icon: React.FC<any>; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'bounding-box', icon: Square, label: 'Bounding Box' },
  { id: 'polygon', icon: Pentagon, label: 'Polygon' },
  { id: 'polyline', icon: Minus, label: 'Polyline' },
  { id: 'point', icon: MapPin, label: 'Point' },
  { id: 'brush', icon: Pencil, label: 'Brush' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export default function StudioView() {
  const dm = useAppStore((s) => s.darkMode);
  const [mode, setMode] = useState<'2d' | 'video' | '3d' | 'multi-camera'>('2d');
  const [tool, setTool] = useState<ToolType>('bounding-box');
  const [selectedClass, setSelectedClass] = useState('Person');
  const [shapes, setShapes] = useState<AnnotationShape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedShape = shapes.find((s) => s.id === selectedId);

  const toggleVisibility = (id: string) => {
    setShapes(shapes.map((s) => s.id === id ? { ...s, visible: !s.visible } : s));
  };
  const toggleLock = (id: string) => {
    setShapes(shapes.map((s) => s.id === id ? { ...s, locked: !s.locked } : s));
  };
  const duplicateSelected = () => {
    if (!selectedShape) return;
    const dup: AnnotationShape = {
      ...selectedShape,
      id: genId(),
      bbox: selectedShape.bbox ? { ...selectedShape.bbox, x: selectedShape.bbox.x + 20, y: selectedShape.bbox.y + 20 } : undefined,
      point: selectedShape.point ? { x: selectedShape.point.x + 20, y: selectedShape.point.y + 20 } : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setShapes([...shapes, dup]);
    setSelectedId(dup.id);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setShapes([]);
    setSelectedId(null);
    e.target.value = '';
  };

  const triggerUndo = () => {
    const fn = (window as any).__canvasUndo;
    if (fn) fn();
  };
  const triggerRedo = () => {
    const fn = (window as any).__canvasRedo;
    if (fn) fn();
  };

  return (
    <div className={`flex h-full ${dm ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Left toolbar */}
      <div className={`w-12 flex flex-col items-center border-r shrink-0 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {TOOLS.map((t) => (
          <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
            className={`w-12 h-11 flex items-center justify-center transition-colors ${tool === t.id ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600') : (dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100')}`}>
            <t.icon size={16} />
          </button>
        ))}
        <div className={`w-8 h-px my-1 ${dm ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} title="Upload Image" className={`w-12 h-11 flex items-center justify-center ${dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
          <Upload size={16} />
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {([
                { id: '2d', label: '2D', icon: ImageIcon },
                { id: 'video', label: 'Video', icon: Film },
                { id: '3d', label: '3D', icon: Box },
                { id: 'multi-camera', label: 'Multi-Cam', icon: Layers },
              ] as const).map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === m.id ? 'bg-blue-600 text-white' : (dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}`}>
                  <m.icon size={13} /> {m.label}
                </button>
              ))}
            </div>
            <div className={`w-px h-5 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <span className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Urban Driving Dataset Q3</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={triggerUndo} className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`} title="Undo (Ctrl+Z)"><Undo size={14} /></button>
            <button onClick={triggerRedo} className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`} title="Redo (Ctrl+Y)"><Redo size={14} /></button>
            <div className={`w-px h-5 mx-1 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium"><Save size={13} /> Save</button>
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
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
            />
          </div>
        </div>

        {/* Video timeline */}
        {(mode === 'video' || mode === 'multi-camera') && (
          <div className={`flex items-center gap-3 px-3 py-2 border-t ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button className={`p-2 rounded-full ${dm ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'}`}>▶</button>
            <span className={`text-xs font-mono ${dm ? 'text-slate-400' : 'text-slate-500'}`}>00:00.00 / 05:30.00</span>
            <div className={`flex-1 h-1.5 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-200'} relative`}>
              <div className="absolute left-0 top-0 h-full w-1/4 bg-blue-500 rounded-full" />
              <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
            </div>
            <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Frame 1 / 9900</span>
          </div>
        )}

        {/* Status bar */}
        <div className={`flex items-center justify-between px-3 py-1 border-t text-xs ${dm ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
          <div className="flex items-center gap-3">
            <span className="capitalize">{tool}</span>
            <span>{shapes.length} annotations</span>
            {selectedId && <span className="text-blue-500">1 selected</span>}
            {imageUrl && <span className={dm ? 'text-slate-600' : 'text-slate-400'}>Image loaded</span>}
          </div>
          <span>Click {tool} tool → Draw · Ctrl+Z undo · Delete to remove · Ctrl+Scroll zoom</span>
        </div>
      </div>

      {/* Right panel */}
      <div className={`w-56 flex flex-col border-l shrink-0 overflow-y-auto ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {/* Class selector */}
        <div className={`p-3 border-b ${dm ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-1 mb-2">
            <Tag size={13} className={dm ? 'text-slate-400' : 'text-slate-500'} />
            <h4 className={`text-xs font-semibold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>CLASS</h4>
          </div>
          <div className="space-y-1">
            {CLASSES.map((cls) => (
              <button key={cls.name} onClick={() => setSelectedClass(cls.name)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors ${selectedClass === cls.name ? (dm ? 'bg-blue-600/15 text-blue-400' : 'bg-blue-50 text-blue-700') : (dm ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50')}`}>
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cls.color }} />
                <span className="flex-1 text-left">{cls.name}</span>
                {selectedClass === cls.name && <span className="text-[10px] opacity-50">●</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Annotations list */}
        <div className={`flex-1 p-3 overflow-y-auto`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-xs font-semibold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>ANNOTATIONS ({shapes.length})</h4>
            {selectedId && <button onClick={duplicateSelected} className={`p-1 rounded ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Duplicate"><Copy size={12} /></button>}
          </div>
          <div className="space-y-1">
            {shapes.length === 0 ? (
              <p className={`text-xs text-center py-4 ${dm ? 'text-slate-600' : 'text-slate-400'}`}>
                {imageUrl ? 'Select a tool and draw on the image.' : 'Upload an image to start annotating.'}
              </p>
            ) : (
              shapes.map((s) => (
                <div key={s.id} onClick={() => setSelectedId(s.id)}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${selectedId === s.id ? (dm ? 'bg-blue-600/15 border border-blue-500/30' : 'bg-blue-50 border border-blue-200') : (dm ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100')}`}>
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                  <span className={`flex-1 truncate ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{s.label}</span>
                  <span className={`text-[9px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{s.type === 'bbox' ? 'BOX' : s.type === 'polygon' ? 'POLY' : s.type === 'point' ? 'PT' : 'LINE'}</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleVisibility(s.id); }} className={`p-0.5 ${dm ? 'hover:text-slate-300' : 'hover:text-slate-700'}`} title="Toggle visibility">
                    {s.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleLock(s.id); }} className={`p-0.5 ${dm ? 'hover:text-slate-300' : 'hover:text-slate-700'}`} title="Toggle lock">
                    {s.locked ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setShapes(shapes.filter((sh) => sh.id !== s.id)); setSelectedId(null); }} className={`p-0.5 ${dm ? 'hover:text-rose-400' : 'hover:text-rose-600'}`} title="Delete">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Properties */}
        {selectedShape && (
          <div className={`p-3 border-t ${dm ? 'border-slate-800' : 'border-slate-200'}`}>
            <h4 className={`text-xs font-semibold mb-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>PROPERTIES</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className={dm ? 'text-slate-400' : 'text-slate-500'}>Type</span>
                <span className={dm ? 'text-slate-200' : 'text-slate-700'}>{selectedShape.type}</span>
              </div>
              <div className="flex justify-between">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
