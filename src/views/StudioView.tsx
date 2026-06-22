import React, { useState } from 'react';
import { Box, Eye, Film, Layers, Upload, ChevronLeft, Play, Pause, ZoomIn, ZoomOut, Grid2x2, Save, Undo, Redo, MousePointer2, Square, Pentagon, Circle, Minus, Pencil, MapPin, Type, Tag, Eye as EyeIcon, EyeOff, Trash2, Lock, Unlock } from 'lucide-react';
import { useAppStore } from '../store/appStore';

type StudioMode = '2d' | '3d' | 'video' | 'multi-camera';

interface PlaceholderProps { mode: StudioMode; dm: boolean; }
function EmptyState({ mode, dm }: PlaceholderProps) {
  const config: Record<StudioMode, { icon: React.FC<any>; title: string; desc: string; accept: string }> = {
    '2d': { icon: Eye, title: 'Upload Image', desc: 'Upload an image to start 2D annotation', accept: 'image/*' },
    '3d': { icon: Box, title: 'Load Point Cloud', desc: 'Upload PCD, PLY, or BIN files for 3D annotation', accept: '.pcd,.ply,.bin' },
    'video': { icon: Film, title: 'Upload Video', desc: 'Upload a video for frame-by-frame annotation', accept: 'video/*' },
    'multi-camera': { icon: Layers, title: 'Load Multi-Camera Dataset', desc: 'Upload synchronized camera feeds (4 views)', accept: 'video/*' },
  };
  const c = config[mode];
  return (
    <div className={`flex flex-col items-center justify-center h-full p-8`}>
      <div className={`text-center p-8 rounded-xl border-2 border-dashed max-w-md ${dm ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-slate-50'}`}>
        <c.icon size={40} className={`mx-auto mb-3 ${dm ? 'text-slate-600' : 'text-slate-300'}`} />
        <h3 className={`text-base font-medium mb-1 ${dm ? 'text-white' : 'text-slate-900'}`}>{c.title}</h3>
        <p className={`text-xs mb-4 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{c.desc}</p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 text-sm font-medium">
          <Upload size={15} /> Browse Files
          <input type="file" accept={c.accept} className="hidden" />
        </label>
      </div>
    </div>
  );
}

function MultiCameraView({ dm }: { dm: boolean }) {
  const CAMS = ['Front Camera', 'Rear Camera', 'Left Camera', 'Right Camera'];
  return (
    <div className="grid grid-cols-2 gap-1 h-full">
      {CAMS.map((cam, i) => (
        <div key={cam} className={`relative rounded-lg overflow-hidden border ${dm ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
          <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${dm ? 'bg-slate-900/80 text-slate-300' : 'bg-white/80 text-slate-700'} backdrop-blur z-10`}>{cam}</div>
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${dm ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} z-10`}>● Synced</div>
          <div className="flex items-center justify-center h-full">
            <Film size={32} className={dm ? 'text-slate-700' : 'text-slate-300'} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CanvasPlaceholder({ dm, tool }: { dm: boolean; tool: string }) {
  return (
    <div className={`flex-1 flex items-center justify-center rounded-lg ${dm ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <div className="text-center">
        <MousePointer2 size={32} className={`mx-auto mb-2 ${dm ? 'text-slate-700' : 'text-slate-300'}`} />
        <p className={`text-sm ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Annotation Canvas</p>
        <p className={`text-xs ${dm ? 'text-slate-600' : 'text-slate-400'}`}>Tool: {tool}</p>
      </div>
    </div>
  );
}

export default function StudioView() {
  const dm = useAppStore((s) => s.darkMode);
  const [mode, setMode] = useState<StudioMode>('2d');
  const [tool, setTool] = useState('select');
  const [selectedClass, setSelectedClass] = useState('Person');
  const [showGrid, setShowGrid] = useState(false);

  const card = `rounded-xl border ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`;

  const TOOLS_2D = [
    { id: 'select', icon: MousePointer2, label: 'Select', key: 'S' },
    { id: 'bounding-box', icon: Square, label: 'Bounding Box', key: 'B' },
    { id: 'polygon', icon: Pentagon, label: 'Polygon', key: 'P' },
    { id: 'polyline', icon: Minus, label: 'Polyline', key: 'L' },
    { id: 'circle', icon: Circle, label: 'Circle', key: 'C' },
    { id: 'point', icon: MapPin, label: 'Point', key: 'O' },
    { id: 'freehand', icon: Pencil, label: 'Freehand', key: 'F' },
    { id: 'text', icon: Type, label: 'Text', key: 'T' },
  ];

  const CLASSES = [
    { name: 'Person', color: '#3b82f6', children: ['Walking', 'Loading', 'Unloading', 'Inspecting', 'Guiding Truck'] },
    { name: 'Truck', color: '#ef4444', children: [] },
    { name: 'Forklift', color: '#f97316', children: [] },
    { name: 'Pallet', color: '#eab308', children: [] },
    { name: 'Box', color: '#22c55e', children: [] },
  ];

  const mockAnnotations = [
    { id: '1', type: 'bounding-box', label: 'Person', visible: true, locked: false },
    { id: '2', type: 'bounding-box', label: 'Truck', visible: true, locked: false },
    { id: '3', type: 'polygon', label: 'Box', visible: true, locked: false },
  ];

  return (
    <div className={`flex h-full ${dm ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Left toolbar */}
      <div className={`w-12 flex flex-col border-r shrink-0 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {mode === '2d' && TOOLS_2D.map((t) => (
          <button key={t.id} onClick={() => setTool(t.id)} title={`${t.label} (${t.key})`}
            className={`w-12 h-11 flex items-center justify-center transition-colors ${tool === t.id ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600') : (dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100')}`}>
            <t.icon size={16} />
          </button>
        ))}
        {mode === '3d' && (
          <button className={`w-12 h-11 flex items-center justify-center ${dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Box size={16} /></button>
        )}
        {mode === 'video' && TOOLS_2D.slice(0, 4).map((t) => (
          <button key={t.id} onClick={() => setTool(t.id)}
            className={`w-12 h-11 flex items-center justify-center transition-colors ${tool === t.id ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600') : (dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100')}`}>
            <t.icon size={16} />
          </button>
        ))}
        {mode === 'multi-camera' && (
          <button className={`w-12 h-11 flex items-center justify-center ${dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Square size={16} /></button>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2">
            {/* Mode selector */}
            <div className="flex gap-0.5">
              {([
                { id: '2d', label: '2D', icon: Eye },
                { id: '3d', label: '3D', icon: Box },
                { id: 'video', label: 'Video', icon: Film },
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
            <button className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}><Undo size={14} /></button>
            <button className={`p-1.5 rounded-md ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}><Redo size={14} /></button>
            <div className={`w-px h-5 mx-1 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-md ${showGrid ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600') : (dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600')}`}><Grid2x2 size={14} /></button>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button className={`p-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}><ZoomOut size={13} /></button>
              <span className={`text-[10px] font-mono w-8 text-center ${dm ? 'text-slate-400' : 'text-slate-500'}`}>100%</span>
              <button className={`p-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}><ZoomIn size={13} /></button>
            </div>
            <div className={`w-px h-5 mx-1 ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium"><Save size={13} /> Save</button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative p-2 overflow-hidden">
          {mode === 'multi-camera' ? <MultiCameraView dm={dm} /> : <CanvasPlaceholder dm={dm} tool={tool} />}
        </div>

        {/* Video timeline (only video/multi-cam) */}
        {(mode === 'video' || mode === 'multi-camera') && (
          <div className={`flex items-center gap-3 px-3 py-2 border-t ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button className={`p-2 rounded-full ${dm ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}><Play size={14} /></button>
            <span className={`text-xs font-mono ${dm ? 'text-slate-400' : 'text-slate-500'}`}>00:42.15 / 05:30.00</span>
            <div className={`flex-1 h-1.5 rounded-full ${dm ? 'bg-slate-800' : 'bg-slate-200'} relative`}>
              <div className="absolute left-0 top-0 h-full w-1/4 bg-blue-500 rounded-full" />
              <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
              <div className="absolute left-1/6 top-0 h-full w-0.5 bg-amber-500" title="Keyframe" />
              <div className="absolute left-2/5 top-0 h-full w-0.5 bg-amber-500" title="Keyframe" />
              <div className="absolute left-3/5 top-0 h-full w-0.5 bg-amber-500" title="Keyframe" />
            </div>
            <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Frame 1264 / 9900</span>
            <span className={`px-2 py-0.5 rounded text-xs ${dm ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>3 tracks</span>
          </div>
        )}

        {/* Status bar */}
        <div className={`flex items-center justify-between px-3 py-1 border-t text-xs ${dm ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
          <div className="flex items-center gap-3">
            <span className="capitalize">{tool}</span>
            <span>3 annotations</span>
            <span>Zoom: 100%</span>
            <span>X: 0, Y: 0</span>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'multi-camera' && <span className="text-emerald-500">All cameras synced</span>}
            <span>Press F1 for shortcuts</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className={`w-60 flex flex-col border-l shrink-0 overflow-y-auto ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {/* Classes */}
        <div className={`p-3 border-b ${dm ? 'border-slate-800' : 'border-slate-200'}`}>
          <h4 className={`text-xs font-semibold mb-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>CLASSES</h4>
          <div className="space-y-1">
            {CLASSES.map((cls) => (
              <div key={cls.name}>
                <button onClick={() => setSelectedClass(cls.name)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors ${selectedClass === cls.name ? (dm ? 'bg-blue-600/15 text-blue-400' : 'bg-blue-50 text-blue-700') : (dm ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50')}`}>
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cls.color }} />
                  <span className="flex-1 text-left">{cls.name}</span>
                  {cls.children.length > 0 && <ChevronLeft size={12} className={dm ? 'text-slate-500' : 'text-slate-400'} />}
                </button>
                {cls.children.length > 0 && selectedClass === cls.name && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {cls.children.map((child) => (
                      <button key={child} className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs ${dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cls.color }} />
                        {child}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Annotations list */}
        <div className="flex-1 p-3">
          <h4 className={`text-xs font-semibold mb-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>ANNOTATIONS ({mockAnnotations.length})</h4>
          <div className="space-y-1">
            {mockAnnotations.map((ann) => (
              <div key={ann.id} className={`group flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer ${dm ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}`}>
                <div className="w-2 h-2 rounded-sm bg-blue-500" />
                <span className={`flex-1 truncate ${dm ? 'text-slate-300' : 'text-slate-700'}`}>{ann.label}</span>
                <span className={`text-[10px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{ann.type}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className={`p-0.5 ${dm ? 'hover:text-slate-300' : 'hover:text-slate-700'}`}><EyeIcon size={11} /></button>
                  <button className={`p-0.5 ${dm ? 'hover:text-rose-400' : 'hover:text-rose-600'}`}><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties */}
        <div className={`p-3 border-t ${dm ? 'border-slate-800' : 'border-slate-200'}`}>
          <h4 className={`text-xs font-semibold mb-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>PROPERTIES</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className={dm ? 'text-slate-400' : 'text-slate-500'}>Type</span><span className={dm ? 'text-slate-300' : 'text-slate-700'}>bounding-box</span></div>
            <div className="flex justify-between"><span className={dm ? 'text-slate-400' : 'text-slate-500'}>Class</span><span className={dm ? 'text-slate-300' : 'text-slate-700'}>Person</span></div>
            <div className="flex justify-between"><span className={dm ? 'text-slate-400' : 'text-slate-500'}>Track ID</span><span className={dm ? 'text-slate-300' : 'text-slate-700'}>TRK-0142</span></div>
            <div className="flex justify-between"><span className={dm ? 'text-slate-400' : 'text-slate-500'}>Confidence</span><span className="text-emerald-500">98%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
