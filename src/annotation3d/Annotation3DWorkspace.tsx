import React, { useState, useRef, useCallback, Suspense, useMemo, lazy } from 'react';
import { Box, RotateCcw, ZoomIn, ZoomOut, RefreshCw, Download, Settings, Upload, LayoutGrid, Trash2 } from 'lucide-react';
import { AnnotationTool3D, TOOLS_3D, Annotation, Point, AnnotationClass } from '../types';

interface Props {
  dark: boolean;
  onBack: () => void;
  annotations?: Annotation[];
  classes?: AnnotationClass[];
  onCreateAnnotation?: (ann: Annotation) => void;
  onUpdateAnnotation?: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation?: (id: string) => void;
}

const CAMERA_VIEWS = [
  { id: 'front', label: 'Front' },
  { id: 'rear', label: 'Rear' },
  { id: 'top', label: 'Top (BEV)' },
  { id: 'perspective', label: 'Perspective' },
];

const COLOR_MODES = ['Height', 'RGB', 'Intensity', 'Distance', 'Class'];

// Lazy-load the R3F viewer - only loads when user navigates to 3D view
const PointCloudViewer = lazy(() => import('./PointCloudViewer'));

function parsePCDText(text: string): { points: Point[]; colors: string[] } | null {
  try {
    const lines = text.split('\n');
    const header: Record<string, string[]> = {};
    let dataStart = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('FIELDS')) header.fields = line.split(' ').slice(1);
      else if (line.startsWith('DATA')) { dataStart = i + 1; break; }
    }
    if (!header.fields || !dataStart) return null;
    const xI = header.fields.indexOf('x'), yI = header.fields.indexOf('y'), zI = header.fields.indexOf('z');
    if (xI === -1 || yI === -1 || zI === -1) return null;
    const rI = header.fields.indexOf('r'), gI = header.fields.indexOf('g'), bI = header.fields.indexOf('b');
    const points: Point[] = [], colors: string[] = [];
    for (let i = dataStart; i < lines.length && points.length < 100000; i++) {
      const vals = lines[i].trim().split(' ').map(Number);
      if (vals.length < Math.max(xI, yI, zI) + 1 || isNaN(vals[xI])) continue;
      points.push({ x: vals[xI], y: vals[yI], z: vals[zI] });
      if (rI !== -1 && gI !== -1 && bI !== -1) colors.push(`rgb(${vals[rI]},${vals[gI]},${vals[bI]})`);
    }
    return { points, colors };
  } catch { return null; }
}

function parsePLYText(text: string): { points: Point[]; colors: string[] } | null {
  try {
    const lines = text.split('\n');
    let headerEnd = 0;
    const props: string[] = [];
    let vertexCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('element vertex')) vertexCount = Number(line.split(' ').pop());
      else if (line.startsWith('property')) props.push(line.split(' ').pop()!);
      else if (line === 'end_header') { headerEnd = i + 1; break; }
    }
    const xI = props.indexOf('x'), yI = props.indexOf('y'), zI = props.indexOf('z');
    if (xI === -1 || yI === -1 || zI === -1) return null;
    const rI = props.indexOf('red'), gI = props.indexOf('green'), bI = props.indexOf('blue');
    const points: Point[] = [], colors: string[] = [];
    for (let i = headerEnd; i < lines.length && points.length < vertexCount && points.length < 100000; i++) {
      const vals = lines[i].trim().split(' ').map(Number);
      if (vals.length < Math.max(xI, yI, zI) + 1 || isNaN(vals[xI])) continue;
      points.push({ x: vals[xI], y: vals[yI], z: vals[zI] });
      if (rI !== -1 && gI !== -1 && bI !== -1 && vals[rI] !== undefined) colors.push(`rgb(${vals[rI]},${vals[gI]},${vals[bI]})`);
    }
    return { points, colors };
  } catch { return null; }
}

async function parseBINFile(buffer: ArrayBuffer): Promise<{ points: Point[]; colors: string[] } | null> {
  try {
    const view = new DataView(buffer);
    const points: Point[] = [], colors: string[] = [];
    const step = 4;
    for (let i = 0; i < view.byteLength / (step * 4) && points.length < 100000; i++) {
      const offset = i * step * 4;
      if (offset + 12 > view.byteLength) break;
      const x = view.getFloat32(offset, true);
      const y = view.getFloat32(offset + 4, true);
      const z = view.getFloat32(offset + 8, true);
      if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
      points.push({ x, y, z });
      const intensity = offset + 12 < view.byteLength ? view.getFloat32(offset + 12, true) : 0;
      const c = Math.floor(Math.max(0, Math.min(1, isNaN(intensity) ? 0.5 : intensity)) * 255);
      colors.push(`rgb(${c},${c},${c})`);
    }
    return { points, colors };
  } catch { return null; }
}

export default function Annotation3DWorkspace({
  dark, onBack, annotations = [], classes = [],
  onCreateAnnotation, onUpdateAnnotation, onDeleteAnnotation
}: Props) {
  const [tool, setTool] = useState<AnnotationTool3D>('3d-cuboid');
  const [activeView, setActiveView] = useState('perspective');
  const [showBEV, setShowBEV] = useState(true);
  const [colorMode, setColorMode] = useState('Height');
  const [pointSize, setPointSize] = useState(2);
  const [distanceFilter, setDistanceFilter] = useState('All');
  const [pointCloud, setPointCloud] = useState<{ points: Point[]; colors: string[] } | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [cameraSync, setCameraSync] = useState<Record<string, boolean>>({ front: true, rear: false, left: false, right: false });

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoadError('');
    setIsLoading(true);
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      let result: { points: Point[]; colors: string[] } | null = null;

      if (ext === 'pcd') {
        const text = await file.text();
        result = parsePCDText(text);
      } else if (ext === 'ply') {
        const text = await file.text();
        result = parsePLYText(text);
      } else if (ext === 'bin') {
        const buffer = await file.arrayBuffer();
        result = await parseBINFile(buffer);
      } else if (ext === 'las') {
        setLoadError('LAS format requires server-side conversion. Convert to PCD or PLY first.');
        setIsLoading(false);
        return;
      } else {
        setLoadError('Unsupported format. Use .pcd, .bin, .ply, or .las files.');
        setIsLoading(false);
        return;
      }

      if (result && result.points.length > 0) {
        setPointCloud(result);
      } else {
        setLoadError('Failed to parse point cloud file or file contains no valid points.');
      }
    } catch (err) {
      setLoadError(`Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  }, []);

  const dm = dark;
  const panelBg = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = dm ? 'text-white' : 'text-gray-900';
  const textSecondary = dm ? 'text-gray-400' : 'text-gray-600';
  const btnCls = `p-2 rounded-lg transition-colors ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`;

  return (
    <div className={`flex h-full ${dm ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 3D Toolbar */}
      <div className={`w-14 flex flex-col border-r ${panelBg}`}>
        <div className="p-1 border-b border-gray-700">
          <span className={`block text-center text-[10px] font-semibold py-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>3D</span>
        </div>
        {TOOLS_3D.map(t => (
          <button key={t.id} onClick={() => setTool(t.id as AnnotationTool3D)}
            className={`w-14 h-11 flex flex-col items-center justify-center transition-colors ${
              tool === t.id ? (dm ? 'bg-blue-600/30 text-blue-400' : 'bg-blue-50 text-blue-700') : (dm ? 'text-gray-500 hover:bg-gray-700 hover:text-gray-300' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700')
            }`} title={`${t.name} (${t.hotkey})`}>
            <Box size={16} />
            <span className="text-[9px] mt-0.5 truncate w-full text-center">{t.name.split(' ').pop()}</span>
          </button>
        ))}
      </div>

      {/* Main viewer */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${panelBg}`}>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={btnCls}><RotateCcw size={16} /></button>
            <div className={`w-px h-5 ${dm ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <span className={`text-sm font-medium ${textPrimary}`}>{fileName || '3D Point Cloud Viewer'}</span>
            {pointCloud && <span className={`text-xs ${textSecondary}`}>{pointCloud.points.length.toLocaleString()} points</span>}
          </div>
          <div className="flex items-center gap-1">
            <button className={btnCls}><ZoomIn size={16} /></button>
            <button className={btnCls}><ZoomOut size={16} /></button>
            <button className={btnCls}><RefreshCw size={16} /></button>
            <div className={`w-px h-5 ${dm ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <button className={btnCls}><Download size={16} /></button>
            <button className={btnCls}><Settings size={16} /></button>
          </div>
        </div>

        {/* Viewer area */}
        <div className="flex-1 relative">
          <Suspense fallback={
            <div className={`w-full h-full flex items-center justify-center ${dm ? 'bg-gray-900' : 'bg-gray-100'}`}>
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <PointCloudViewer
              dark={dm}
              pointCloud={pointCloud}
              colorMode={colorMode}
              pointSize={pointSize}
              annotations={annotations}
              activeView={activeView}
            />
          </Suspense>

          {/* Camera view tabs */}
          <div className={`absolute top-3 left-3 flex gap-1 rounded-lg p-1 ${dm ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm`}>
            {CAMERA_VIEWS.map(v => (
              <button key={v.id} onClick={() => setActiveView(v.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeView === v.id ? 'bg-blue-600 text-white' : (dm ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                }`}>{v.label}</button>
            ))}
          </div>

          {/* Upload overlay when no data */}
          {!pointCloud && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`text-center p-8 rounded-2xl ${dm ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur pointer-events-auto`}>
                <Box size={56} className={`mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl font-semibold ${textPrimary}`}>Load Point Cloud</h3>
                <p className={`text-sm mt-2 mb-1 max-w-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                  Supports .pcd, .bin, .ply, and .las formats for LiDAR data visualization
                </p>
                {loadError && <p className="text-sm text-rose-500 mb-3">{loadError}</p>}
                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-medium">
                  <Upload size={18} /> Upload Point Cloud
                  <input type="file" className="hidden" accept=".pcd,.bin,.ply,.las" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`text-center p-6 rounded-xl ${dm ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur pointer-events-auto`}>
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className={`text-sm ${textSecondary}`}>Loading point cloud...</p>
              </div>
            </div>
          )}

          {/* Info overlay */}
          {pointCloud && (
            <div className={`absolute top-3 right-3 flex flex-col gap-2`}>
              <div className={`px-3 py-1.5 rounded-lg text-xs ${dm ? 'bg-gray-900/80 text-gray-500' : 'bg-white/80 text-gray-400'} backdrop-blur`}>
                Color: {colorMode} | Size: {pointSize}px
              </div>
              <button onClick={() => setShowBEV(!showBEV)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  showBEV ? 'bg-blue-600 text-white' : (dm ? 'bg-gray-900/80 text-gray-400' : 'bg-white/80 text-gray-600')
                } backdrop-blur`}>
                <LayoutGrid size={14} /> BEV
              </button>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className={`flex items-center justify-between px-4 py-1.5 border-t text-xs ${panelBg} ${textSecondary}`}>
          <span>Tool: {TOOLS_3D.find(t => t.id === tool)?.name || tool}</span>
          <span>Objects: {annotations.length} | Points: {pointCloud?.points.length.toLocaleString() || 0}</span>
          <span>View: {activeView}</span>
        </div>
      </div>

      {/* Right properties panel */}
      <div className={`w-72 border-l ${panelBg} overflow-y-auto`}>
        <div className="p-4 space-y-5">
          <section>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>3D Properties</h3>
            <div className={`rounded-lg p-3 ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="space-y-2 text-xs">
                {[['Object ID', '--'], ['Track ID', '--'], ['Position (X,Y,Z)', '--'], ['Dimensions (W,L,H)', '--'], ['Rotation Y', '0.0'], ['Occlusion', 'None'], ['Truncation', 'No']].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className={textSecondary}>{label}</span>
                    <span className={dm ? 'text-gray-500' : 'text-gray-400'}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Visualization</h3>
            <div className="space-y-3">
              <div>
                <label className={`text-xs ${textSecondary}`}>Color Mode</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {COLOR_MODES.map(mode => (
                    <button key={mode} onClick={() => setColorMode(mode)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        colorMode === mode ? 'bg-blue-600 text-white' : (dm ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                      }`}>{mode}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <label className={`text-xs ${textSecondary}`}>Point Size</label>
                  <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{pointSize}px</span>
                </div>
                <input type="range" min="1" max="6" step="0.5" value={pointSize} onChange={(e) => setPointSize(Number(e.target.value))} className="w-full mt-1" />
              </div>
              <div>
                <label className={`text-xs ${textSecondary}`}>Distance Filter</label>
                <select value={distanceFilter} onChange={(e) => setDistanceFilter(e.target.value)}
                  className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-xs ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option>All</option><option>&lt; 10m</option><option>&lt; 30m</option><option>&lt; 50m</option><option>&lt; 100m</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Camera Sync</h3>
            <div className="space-y-1.5">
              {['Front Camera', 'Rear Camera', 'Left Camera', 'Right Camera'].map((cam, i) => {
                const key = ['front', 'rear', 'left', 'right'][i];
                return (
                  <div key={cam} className="flex items-center justify-between">
                    <span className={`text-xs ${textSecondary}`}>{cam}</span>
                    <button onClick={() => setCameraSync(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        cameraSync[key] ? 'bg-blue-600 text-white' : (dm ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-500')
                      }`}>{cameraSync[key] ? 'Synced' : 'Sync'}</button>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>3D Objects ({annotations.length})</h3>
            <div className="space-y-1">
              {annotations.map(ann => (
                <div key={ann.id} onClick={() => setSelectedAnnotationId(ann.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                    selectedAnnotationId === ann.id ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700') : (dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-50 text-gray-600')
                  }`}>
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ann.color }} />
                  <span className="flex-1 truncate">{ann.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteAnnotation?.(ann.id); }} className={dm ? 'hover:text-rose-400' : 'hover:text-rose-600'}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {annotations.length === 0 && <p className={`text-xs text-center py-3 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>No 3D annotations yet</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
