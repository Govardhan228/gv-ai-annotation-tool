import React, { useState, useRef, useCallback } from 'react';
import { Box, Move, RotateCw, Maximize2, Crosshair, Radar, ScatterChart, LayoutGrid, Route, Eye, Camera, Layers, Grid3x3, ZoomIn, ZoomOut, RotateCcw, RefreshCw, Download, Settings, Upload, Sliders as Slider, MousePointer2, Pencil, Trash2, Lock, Unlock, Copy, ChevronDown } from 'lucide-react';
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

interface PointCloudHeader {
  version: string;
  fields: string[];
  size: number[];
  type: string[];
  count: number[];
  width: number;
  height: number;
  points: number;
}

const CAMERA_VIEWS = [
  { id: 'front', label: 'Front' },
  { id: 'rear', label: 'Rear' },
  { id: 'top', label: 'Top (BEV)' },
  { id: 'perspective', label: 'Perspective' },
];

const COLOR_MODES = ['RGB', 'Height', 'Intensity', 'Class', 'Distance'];

function parsePCD(text: string): { points: Point[]; colors: string[] } | null {
  try {
    const lines = text.split('\n');
    const header: Partial<PointCloudHeader> = {};
    let dataStart = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('VERSION')) header.version = line.split(' ')[1];
      else if (line.startsWith('FIELDS')) header.fields = line.split(' ').slice(1);
      else if (line.startsWith('SIZE')) header.size = line.split(' ').slice(1).map(Number);
      else if (line.startsWith('TYPE')) header.type = line.split(' ').slice(1);
      else if (line.startsWith('COUNT')) header.count = line.split(' ').slice(1).map(Number);
      else if (line.startsWith('WIDTH')) header.width = Number(line.split(' ')[1]);
      else if (line.startsWith('HEIGHT')) header.height = Number(line.split(' ')[1]);
      else if (line.startsWith('POINTS')) header.points = Number(line.split(' ')[1]);
      else if (line.startsWith('DATA')) { dataStart = i + 1; break; }
    }
    if (!header.fields || !dataStart) return null;
    const xIdx = header.fields.indexOf('x');
    const yIdx = header.fields.indexOf('y');
    const zIdx = header.fields.indexOf('z');
    if (xIdx === -1 || yIdx === -1 || zIdx === -1) return null;
    const rIdx = header.fields.indexOf('r');
    const gIdx = header.fields.indexOf('g');
    const bIdx = header.fields.indexOf('b');
    const points: Point[] = [];
    const colors: string[] = [];
    for (let i = dataStart; i < lines.length && points.length < 100000; i++) {
      const vals = lines[i].trim().split(' ').map(Number);
      if (vals.length < Math.max(xIdx, yIdx, zIdx) + 1) continue;
      points.push({ x: vals[xIdx], y: vals[yIdx], z: vals[zIdx] });
      if (rIdx !== -1 && gIdx !== -1 && bIdx !== -1) {
        colors.push(`rgb(${vals[rIdx]},${vals[gIdx]},${vals[bIdx]})`);
      }
    }
    return { points, colors };
  } catch { return null; }
}

function parsePLY(text: string): { points: Point[]; colors: string[] } | null {
  try {
    const lines = text.split('\n');
    let vertexCount = 0;
    let headerEnd = 0;
    const properties: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('element vertex')) vertexCount = Number(line.split(' ').pop());
      else if (line.startsWith('property')) properties.push(line.split(' ').pop()!);
      else if (line === 'end_header') { headerEnd = i + 1; break; }
    }
    const xIdx = properties.indexOf('x');
    const yIdx = properties.indexOf('y');
    const zIdx = properties.indexOf('z');
    if (xIdx === -1 || yIdx === -1 || zIdx === -1) return null;
    const rIdx = properties.indexOf('red');
    const gIdx = properties.indexOf('green');
    const bIdx = properties.indexOf('blue');
    const points: Point[] = [];
    const colors: string[] = [];
    for (let i = headerEnd; i < lines.length && points.length < vertexCount && points.length < 100000; i++) {
      const vals = lines[i].trim().split(' ').map(Number);
      if (vals.length < Math.max(xIdx, yIdx, zIdx) + 1) continue;
      points.push({ x: vals[xIdx], y: vals[yIdx], z: vals[zIdx] });
      if (rIdx !== -1 && gIdx !== -1 && bIdx !== -1 && vals[rIdx] !== undefined) {
        colors.push(`rgb(${vals[rIdx]},${vals[gIdx]},${vals[bIdx]})`);
      }
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
  const [isDrawingCuboid, setIsDrawingCuboid] = useState(false);
  const [cuboidStart, setCuboidStart] = useState<Point | null>(null);
  const [cameraSync, setCameraSync] = useState<Record<string, boolean>>({ front: true, rear: false, left: false, right: false });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef({ x: -30, y: 45, zoom: 1 });

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pcd' || ext === 'ply') {
      const text = await file.text();
      const result = ext === 'pcd' ? parsePCD(text) : parsePLY(text);
      if (result) setPointCloud(result);
      else alert('Failed to parse point cloud file');
    } else if (ext === 'bin') {
      const buffer = await file.arrayBuffer();
      const view = new DataView(buffer);
      const points: Point[] = [];
      const colors: string[] = [];
      const step = 4; // x,y,z,intensity
      const maxPoints = 100000;
      for (let i = 0; i < view.byteLength / (step * 4) && points.length < maxPoints; i++) {
        const offset = i * step * 4;
        if (offset + 12 > view.byteLength) break;
        const x = view.getFloat32(offset, true);
        const y = view.getFloat32(offset + 4, true);
        const z = view.getFloat32(offset + 8, true);
        points.push({ x, y, z });
        const intensity = offset + 12 < view.byteLength ? view.getFloat32(offset + 12, true) : 0;
        const c = Math.floor(Math.max(0, Math.min(1, intensity)) * 255);
        colors.push(`rgb(${c},${c},${c})`);
      }
      setPointCloud({ points, colors });
    } else if (ext === 'las') {
      alert('LAS format requires server-side conversion. Please convert to PCD or PLY first.');
    } else {
      alert('Unsupported format. Use .pcd, .bin, or .ply files.');
    }
  }, []);

  // Render point cloud on canvas
  const renderPointCloud = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = dark ? '#0a0a0f' : '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!pointCloud || !pointCloud.points.length) return;

    const { points, colors } = pointCloud;
    const rot = rotationRef.current;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = rot.zoom * 2;

    // Compute bounds for height coloring
    let minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => { if (p.z !== undefined) { minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); } });
    const zRange = maxZ - minZ || 1;

    const cosX = Math.cos(rot.x * Math.PI / 180);
    const sinX = Math.sin(rot.x * Math.PI / 180);
    const cosY = Math.cos(rot.y * Math.PI / 180);
    const sinY = Math.sin(rot.y * Math.PI / 180);

    ctx.fillStyle = dark ? 'rgba(100,150,255,0.7)' : 'rgba(50,100,200,0.7)';

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let x = p.x, y = p.y, z = p.z || 0;

      // Rotate Y
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      // Rotate X
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // Perspective projection
      const perspective = 500 / (500 + z2);
      const sx = cx + x1 * scale * perspective;
      const sy = cy - y1 * scale * perspective;

      if (sx < 0 || sx > canvas.width || sy < 0 || sy > canvas.height) continue;

      if (colorMode === 'Height' && p.z !== undefined) {
        const t = (p.z - minZ) / zRange;
        const r = Math.floor(t < 0.5 ? t * 2 * 255 : 255);
        const g = Math.floor(t < 0.5 ? t * 2 * 255 : (1 - t) * 2 * 255);
        const b = Math.floor(t < 0.5 ? (1 - t * 2) * 255 : 0);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      } else if (colors[i] && colorMode === 'RGB') {
        ctx.fillStyle = colors[i];
      } else if (colorMode === 'Intensity' && colors[i]) {
        ctx.fillStyle = colors[i];
      } else if (colorMode === 'Distance') {
        const d = Math.sqrt(p.x * p.x + p.y * p.y + z * z);
        const t = Math.min(1, d / 80);
        ctx.fillStyle = `rgb(${Math.floor((1 - t) * 50 + t * 255)},${Math.floor((1 - t) * 200)},${Math.floor((1 - t) * 255)})`;
      }

      const size = pointSize * perspective;
      if (size > 1.5) {
        ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
      } else {
        ctx.fillRect(sx, sy, 1, 1);
      }
    }

    // Draw cuboid annotations
    annotations.forEach(ann => {
      if (!ann.visible || ann.points.length < 2) return;
      const [p1, p2] = ann.points;
      // Project corners
      const corners = [
        { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y), z: p1.z || 0 },
        { x: Math.max(p1.x, p2.x), y: Math.min(p1.y, p2.y), z: p1.z || 0 },
        { x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y), z: p2.z || 0 },
        { x: Math.min(p1.x, p2.x), y: Math.max(p1.y, p2.y), z: p2.z || 0 },
      ];
      ctx.strokeStyle = ann.color || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      corners.forEach((c, i) => {
        const x1 = c.x * cosY - c.z * sinY;
        const z1 = c.x * sinY + c.z * cosY;
        const y1 = c.y * cosX - z1 * sinX;
        const z2 = c.y * sinX + z1 * cosX;
        const perspective = 500 / (500 + z2);
        const sx = cx + x1 * scale * perspective;
        const sy = cy - y1 * scale * perspective;
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.stroke();
    });

    // Draw cuboid being drawn
    if (isDrawingCuboid && cuboidStart && tool === '3d-cuboid') {
      // Preview cuboid at mouse position
    }

    // Grid lines
    if (activeView === 'top' || showBEV) {
      ctx.strokeStyle = dark ? 'rgba(100,100,100,0.3)' : 'rgba(200,200,200,0.5)';
      ctx.lineWidth = 0.5;
      for (let i = -50; i <= 50; i += 10) {
        const x1 = i * cosY * scale;
        const z1 = i * sinY * scale;
        ctx.beginPath();
        ctx.moveTo(cx + x1 - 500 * sinY * scale, cy - (-50 * cosX - z1 * sinX) * scale);
        ctx.lineTo(cx + x1 + 500 * sinY * scale, cy - (-50 * cosX + z1 * sinX) * scale);
        ctx.stroke();
      }
    }
  }, [pointCloud, dark, colorMode, pointSize, annotations, isDrawingCuboid, cuboidStart, tool, activeView, showBEV]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      renderPointCloud();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [renderPointCloud]);

  // Mouse interaction for rotation
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === '3d-cuboid') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCuboidStart({ x, y, z: 0 });
      setIsDrawingCuboid(true);
    } else {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, [tool]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      rotationRef.current.y += dx * 0.5;
      rotationRef.current.x += dy * 0.5;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleCanvasMouseUp = useCallback(() => {
    if (isDrawingCuboid && cuboidStart) {
      // Create cuboid annotation
      const cls = classes[0];
      if (onCreateAnnotation) {
        onCreateAnnotation({
          id: Date.now().toString(),
          type: '3d-cuboid',
          label: cls?.name || 'Object',
          points: [cuboidStart, { x: cuboidStart.x + 2, y: cuboidStart.y + 2, z: 0 }],
          visible: true,
          locked: false,
          color: cls?.color || '#3b82f6',
          strokeWidth: 2,
          fillOpacity: 0.1,
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
        });
      }
      setIsDrawingCuboid(false);
      setCuboidStart(null);
    }
    isDragging.current = false;
  }, [isDrawingCuboid, cuboidStart, classes, onCreateAnnotation]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    rotationRef.current.zoom *= e.deltaY > 0 ? 0.95 : 1.05;
    rotationRef.current.zoom = Math.max(0.1, Math.min(10, rotationRef.current.zoom));
  }, []);

  const dm = dark;
  const panelBg = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = dm ? 'text-white' : 'text-gray-900';
  const textSecondary = dm ? 'text-gray-400' : 'text-gray-600';
  const btnCls = `p-2 rounded-lg transition-colors ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`;
  const activeBtnCls = `p-2 rounded-lg bg-blue-600 text-white`;

  return (
    <div className={`flex h-full ${dm ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 3D Toolbar */}
      <div className={`w-14 flex flex-col border-r ${panelBg}`}>
        <div className="p-1 border-b border-gray-700">
          <span className={`block text-center text-[10px] font-semibold py-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>3D</span>
        </div>
        {TOOLS_3D.map(t => (
          <button
            key={t.id}
            onClick={() => setTool(t.id as AnnotationTool3D)}
            className={`w-14 h-11 flex flex-col items-center justify-center transition-colors ${
              tool === t.id ? (dm ? 'bg-blue-600/30 text-blue-400' : 'bg-blue-50 text-blue-700') : (dm ? 'text-gray-500 hover:bg-gray-700 hover:text-gray-300' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700')
            }`}
            title={`${t.name} (${t.hotkey})`}
          >
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
            <span className={`text-sm font-medium ${textPrimary}`}>
              {fileName || '3D Point Cloud Viewer'}
            </span>
            {pointCloud && (
              <span className={`text-xs ${textSecondary}`}>
                {pointCloud.points.length.toLocaleString()} points
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className={btnCls} onClick={() => { rotationRef.current.zoom *= 1.2; }}><ZoomIn size={16} /></button>
            <button className={btnCls} onClick={() => { rotationRef.current.zoom *= 0.8; }}><ZoomOut size={16} /></button>
            <button className={btnCls} onClick={() => { rotationRef.current = { x: -30, y: 45, zoom: 1 }; }}><RefreshCw size={16} /></button>
            <div className={`w-px h-5 ${dm ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <button className={btnCls}><Download size={16} /></button>
            <button className={btnCls}><Settings size={16} /></button>
          </div>
        </div>

        {/* Viewer area */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onWheel={handleWheel}
          />

          {/* Camera view tabs */}
          <div className={`absolute top-3 left-3 flex gap-1 rounded-lg p-1 ${dm ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm`}>
            {CAMERA_VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => {
                  setActiveView(v.id);
                  if (v.id === 'front') rotationRef.current = { x: 0, y: 0, zoom: rotationRef.current.zoom };
                  else if (v.id === 'rear') rotationRef.current = { x: 0, y: 180, zoom: rotationRef.current.zoom };
                  else if (v.id === 'top') rotationRef.current = { x: -90, y: 0, zoom: rotationRef.current.zoom };
                  else rotationRef.current = { x: -30, y: 45, zoom: rotationRef.current.zoom };
                }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeView === v.id ? 'bg-blue-600 text-white' : (dm ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Upload overlay when no data */}
          {!pointCloud && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`text-center p-8 rounded-2xl ${dm ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur pointer-events-auto`}>
                <Box size={56} className={`mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl font-semibold ${textPrimary}`}>Load Point Cloud</h3>
                <p className={`text-sm mt-2 mb-4 max-w-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                  Supports .pcd, .bin, .ply, and .las formats for LiDAR data visualization
                </p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-medium">
                  <Upload size={18} />
                  Upload Point Cloud
                  <input type="file" className="hidden" accept=".pcd,.bin,.ply,.las" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {/* BEV mini-map */}
          {showBEV && pointCloud && (
            <div className={`absolute bottom-3 left-3 w-52 h-52 rounded-lg border-2 overflow-hidden ${
              dm ? 'bg-gray-900/90 border-gray-600' : 'bg-white/90 border-gray-300'
            } backdrop-blur`}>
              <div className="flex items-center justify-between p-2">
                <span className={`text-xs font-semibold ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Bird Eye View</span>
                <button onClick={() => setShowBEV(false)} className={`text-xs ${dm ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>Hide</button>
              </div>
              <div className={`w-full h-[calc(100%-28px)] flex items-center justify-center ${dm ? 'text-gray-700' : 'text-gray-300'}`}>
                <LayoutGrid size={48} className="opacity-30" />
              </div>
            </div>
          )}

          {/* Info overlay */}
          <div className={`absolute top-3 right-3 flex flex-col gap-2`}>
            <div className={`px-3 py-1.5 rounded-lg text-xs ${dm ? 'bg-gray-900/80 text-gray-500' : 'bg-white/80 text-gray-400'} backdrop-blur`}>
              Color: {colorMode} | Size: {pointSize}px
            </div>
            {pointCloud && (
              <button
                onClick={() => setShowBEV(!showBEV)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  showBEV ? 'bg-blue-600 text-white' : (dm ? 'bg-gray-900/80 text-gray-400' : 'bg-white/80 text-gray-600')
                } backdrop-blur`}
              >
                <LayoutGrid size={14} /> BEV
              </button>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className={`flex items-center justify-between px-4 py-1.5 border-t text-xs ${panelBg} ${textSecondary}`}>
          <span>Tool: {TOOLS_3D.find(t => t.id === tool)?.name || tool}</span>
          <span>Annotations: {annotations.length} | Points: {pointCloud?.points.length.toLocaleString() || 0}</span>
          <span>Rotation: {Math.round(rotationRef.current.y)}y / {Math.round(rotationRef.current.x)}x</span>
        </div>
      </div>

      {/* Right properties panel */}
      <div className={`w-72 border-l ${panelBg} overflow-y-auto`}>
        <div className="p-4 space-y-5">
          {/* 3D Properties */}
          <section>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>3D Properties</h3>
            <div className={`rounded-lg p-3 ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Object ID', value: '--' },
                  { label: 'Track ID', value: '--' },
                  { label: 'Position (X,Y,Z)', value: '--' },
                  { label: 'Dimensions (W,L,H)', value: '--' },
                  { label: 'Rotation Y', value: '0.0' },
                  { label: 'Occlusion', value: 'None' },
                  { label: 'Truncation', value: 'No' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className={textSecondary}>{row.label}</span>
                    <span className={dm ? 'text-gray-500' : 'text-gray-400'}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Visualization */}
          <section>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Visualization</h3>
            <div className="space-y-3">
              <div>
                <label className={`text-xs ${textSecondary}`}>Color Mode</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {COLOR_MODES.map(mode => (
                    <button
                      key={mode}
                      onClick={() => setColorMode(mode)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        colorMode === mode ? 'bg-blue-600 text-white' : (dm ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <label className={`text-xs ${textSecondary}`}>Point Size</label>
                  <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{pointSize}px</span>
                </div>
                <input
                  type="range" min="1" max="5" step="0.5" value={pointSize}
                  onChange={(e) => setPointSize(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <label className={`text-xs ${textSecondary}`}>Distance Filter</label>
                <select
                  value={distanceFilter}
                  onChange={(e) => setDistanceFilter(e.target.value)}
                  className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-xs ${
                    dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option>All</option>
                  <option>&lt; 10m</option>
                  <option>&lt; 30m</option>
                  <option>&lt; 50m</option>
                  <option>&lt; 100m</option>
                </select>
              </div>
            </div>
          </section>

          {/* Camera Sync */}
          <section>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Camera Sync</h3>
            <div className="space-y-1.5">
              {['Front Camera', 'Rear Camera', 'Left Camera', 'Right Camera'].map((cam, i) => {
                const key = ['front', 'rear', 'left', 'right'][i];
                return (
                  <div key={cam} className="flex items-center justify-between">
                    <span className={`text-xs ${textSecondary}`}>{cam}</span>
                    <button
                      onClick={() => setCameraSync(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        cameraSync[key] ? 'bg-blue-600 text-white' : (dm ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-500')
                      }`}
                    >
                      {cameraSync[key] ? 'Synced' : 'Sync'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Annotation list */}
          <section>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
              3D Objects ({annotations.length})
            </h3>
            <div className="space-y-1">
              {annotations.map(ann => (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnnotationId(ann.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                    selectedAnnotationId === ann.id ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700') : (dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-50 text-gray-600')
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ann.color }} />
                  <span className="flex-1 truncate">{ann.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteAnnotation?.(ann.id); }} className={dm ? 'hover:text-rose-400' : 'hover:text-rose-600'}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {annotations.length === 0 && (
                <p className={`text-xs text-center py-3 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>No 3D annotations yet</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
