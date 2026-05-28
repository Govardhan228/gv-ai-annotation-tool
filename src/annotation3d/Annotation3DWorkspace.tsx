import React, { useState } from 'react';
import {
  Box, Move, RotateCw, Maximize2, Crosshair, Radar, ScatterChart,
  LayoutGrid, Route, Eye, Camera, Layers, Grid3x3, ZoomIn, ZoomOut,
  RotateCcw, RefreshCw, Download, Settings, ChevronDown
} from 'lucide-react';
import { AnnotationTool3D, TOOLS_3D } from '../types';

interface Props {
  dark: boolean;
  onBack: () => void;
}

const CAMERA_VIEWS = [
  { id: 'front', label: 'Front', icon: Eye },
  { id: 'rear', label: 'Rear', icon: Eye },
  { id: 'top', label: 'Top (BEV)', icon: LayoutGrid },
  { id: 'perspective', label: 'Perspective', icon: Camera },
];

export default function Annotation3DWorkspace({ dark, onBack }: Props) {
  const [tool, setTool] = useState<AnnotationTool3D>('3d-cuboid');
  const [activeView, setActiveView] = useState('perspective');
  const [showBEV, setShowBEV] = useState(true);

  const bg = dark ? 'bg-gray-900' : 'bg-gray-50';
  const panelBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const textSecondary = dark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`flex h-full ${bg}`}>
      {/* 3D Toolbar */}
      <div className={`w-14 flex flex-col border-r ${panelBg}`}>
        {TOOLS_3D.map(t => (
          <button
            key={t.id}
            onClick={() => setTool(t.id as AnnotationTool3D)}
            className={`w-14 h-12 flex items-center justify-center transition-colors ${
              tool === t.id ? (dark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700') : (dark ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100')
            }`}
            title={`${t.name} (${t.hotkey})`}
          >
            <Box size={18} />
          </button>
        ))}
      </div>

      {/* Main viewer */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${panelBg}`}>
          <div className="flex items-center gap-2">
            <button onClick={onBack} className={`p-1.5 rounded ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
              <RotateCcw size={16} />
            </button>
            <span className={`text-sm font-medium ${textPrimary}`}>3D Point Cloud Viewer</span>
          </div>
          <div className="flex items-center gap-2">
            <button className={`p-1.5 rounded ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><ZoomIn size={16} /></button>
            <button className={`p-1.5 rounded ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><ZoomOut size={16} /></button>
            <button className={`p-1.5 rounded ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><RefreshCw size={16} /></button>
            <div className={`w-px h-5 ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <button className={`p-1.5 rounded ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><Download size={16} /></button>
            <button className={`p-1.5 rounded ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><Settings size={16} /></button>
          </div>
        </div>

        {/* Viewer area */}
        <div className="flex-1 relative">
          {/* Main 3D viewport placeholder */}
          <div className={`absolute inset-0 flex items-center justify-center ${dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="text-center">
              <Box size={64} className={`mx-auto mb-4 ${dark ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-xl font-semibold ${textSecondary}`}>3D Point Cloud Viewer</h3>
              <p className={`text-sm mt-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                Load .pcd, .bin, .ply, or .las files to start 3D annotation
              </p>
              <label className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm">
                <Download size={16} />
                Load Point Cloud
                <input type="file" className="hidden" accept=".pcd,.bin,.ply,.las" />
              </label>
            </div>

            {/* Camera view tabs */}
            <div className={`absolute top-3 left-3 flex gap-1 rounded-lg p-1 ${dark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur`}>
              {CAMERA_VIEWS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    activeView === v.id ? 'bg-blue-600 text-white' : (dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* BEV overlay toggle */}
            <button
              onClick={() => setShowBEV(!showBEV)}
              className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                showBEV ? 'bg-blue-600 text-white' : (dark ? 'bg-gray-800/80 text-gray-400' : 'bg-white/80 text-gray-600')
              } backdrop-blur`}
            >
              <LayoutGrid size={14} /> BEV
            </button>

            {/* BEV mini-map */}
            {showBEV && (
              <div className={`absolute bottom-3 left-3 w-48 h-48 rounded-lg border-2 ${
                dark ? 'bg-gray-800/90 border-gray-600' : 'bg-white/90 border-gray-300'
              } backdrop-blur`}>
                <div className="p-2">
                  <p className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Bird Eye View</p>
                </div>
                <div className={`w-full h-[calc(100%-28px)] flex items-center justify-center ${dark ? 'text-gray-600' : 'text-gray-300'}`}>
                  <LayoutGrid size={40} />
                </div>
              </div>
            )}

            {/* Grid overlay indicator */}
            <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded ${dark ? 'bg-gray-800/80 text-gray-500' : 'bg-white/80 text-gray-400'} backdrop-blur text-xs`}>
              <Grid3x3 size={12} /> Grid: On
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className={`flex items-center justify-between px-4 py-1.5 border-t text-xs ${panelBg} ${textSecondary}`}>
          <span>Tool: {TOOLS_3D.find(t => t.id === tool)?.name || tool}</span>
          <span>Objects: 0 | Points: 0</span>
          <span>FPS: --</span>
        </div>
      </div>

      {/* Right properties panel */}
      <div className={`w-72 border-l ${panelBg} overflow-y-auto`}>
        <div className="p-4">
          <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>3D Properties</h3>

          {/* Object info */}
          <div className={`rounded-lg p-3 mb-4 ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>No object selected</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className={textSecondary}>Object ID</span>
                <span className={dark ? 'text-gray-500' : 'text-gray-400'}>--</span>
              </div>
              <div className="flex justify-between">
                <span className={textSecondary}>Track ID</span>
                <span className={dark ? 'text-gray-500' : 'text-gray-400'}>--</span>
              </div>
              <div className="flex justify-between">
                <span className={textSecondary}>Position</span>
                <span className={dark ? 'text-gray-500' : 'text-gray-400'}>--</span>
              </div>
              <div className="flex justify-between">
                <span className={textSecondary}>Dimensions</span>
                <span className={dark ? 'text-gray-500' : 'text-gray-400'}>--</span>
              </div>
              <div className="flex justify-between">
                <span className={textSecondary}>Rotation Y</span>
                <span className={dark ? 'text-gray-500' : 'text-gray-400'}>0.0</span>
              </div>
            </div>
          </div>

          {/* Visualization settings */}
          <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>Visualization</h3>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Color Mode', options: ['RGB', 'Height', 'Intensity', 'Class'] },
              { label: 'Point Size', options: ['1', '2', '3', '4'] },
              { label: 'Distance Filter', options: ['All', '< 10m', '< 30m', '< 50m'] },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className={textSecondary}>{s.label}</span>
                <select className={`px-2 py-1 rounded border text-xs ${
                  dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}>
                  {s.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Camera Sync */}
          <h3 className={`text-sm font-semibold ${textPrimary} mt-4 mb-3`}>Camera Sync</h3>
          <div className="space-y-2">
            {['Front Camera', 'Rear Camera', 'Left Camera', 'Right Camera'].map(cam => (
              <div key={cam} className="flex items-center justify-between">
                <span className={`text-xs ${textSecondary}`}>{cam}</span>
                <button className={`px-2 py-0.5 rounded text-xs ${dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  Sync
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
