import React, { useRef, useMemo, useState, useEffect, Component, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';
import { Annotation, Point } from '../types';

interface Props {
  dark: boolean;
  pointCloud: { points: Point[]; colors: string[] } | null;
  colorMode: string;
  pointSize: number;
  annotations: Annotation[];
  activeView: string;
}

// Error boundary for Three.js rendering failures
class ViewerErrorBoundary extends Component<{ children: ReactNode; dark: boolean }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`w-full h-full flex items-center justify-center ${this.props.dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className="text-center p-6 max-w-sm">
            <div className={`text-4xl mb-3 ${this.props.dark ? 'text-gray-600' : 'text-gray-300'}`}>&#9888;</div>
            <h3 className={`font-semibold ${this.props.dark ? 'text-white' : 'text-gray-900'}`}>3D Viewer Error</h3>
            <p className={`text-sm mt-2 ${this.props.dark ? 'text-gray-400' : 'text-gray-500'}`}>{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PointCloudMesh({ points, colors, colorMode, pointSize }: {
  points: Point[]; colors: string[]; colorMode: string; pointSize: number;
}) {
  const { positions, vertexColors } = useMemo(() => {
    const pos = new Float32Array(points.length * 3);
    const col = new Float32Array(points.length * 3);

    let minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => { if (p.z !== undefined) { minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); } });
    const zRange = maxZ - minZ || 1;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z || 0;

      if (colorMode === 'Height' && p.z !== undefined) {
        const t = (p.z - minZ) / zRange;
        col[i * 3] = t < 0.5 ? t * 2 : 1;
        col[i * 3 + 1] = t < 0.5 ? t * 2 : (1 - t) * 2;
        col[i * 3 + 2] = t < 0.5 ? 1 - t * 2 : 0;
      } else if (colorMode === 'RGB' && colors[i]) {
        const m = colors[i].match(/rgb\((\d+),(\d+),(\d+)\)/);
        if (m) { col[i * 3] = +m[1] / 255; col[i * 3 + 1] = +m[2] / 255; col[i * 3 + 2] = +m[3] / 255; }
        else { col[i * 3] = 0.4; col[i * 3 + 1] = 0.6; col[i * 3 + 2] = 1; }
      } else if (colorMode === 'Distance') {
        const d = Math.sqrt(p.x * p.x + p.y * p.y + (p.z || 0) * (p.z || 0));
        const t = Math.min(1, d / 80);
        col[i * 3] = (1 - t) * 0.2 + t;
        col[i * 3 + 1] = (1 - t) * 0.8;
        col[i * 3 + 2] = (1 - t);
      } else {
        if (colors[i]) {
          const m = colors[i].match(/rgb\((\d+),(\d+),(\d+)\)/);
          if (m) { col[i * 3] = +m[1] / 255; col[i * 3 + 1] = +m[2] / 255; col[i * 3 + 2] = +m[3] / 255; }
          else { col[i * 3] = 0.4; col[i * 3 + 1] = 0.6; col[i * 3 + 2] = 1; }
        } else { col[i * 3] = 0.4; col[i * 3 + 1] = 0.6; col[i * 3 + 2] = 1; }
      }
    }
    return { positions: pos, vertexColors: col };
  }, [points, colors, colorMode]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={vertexColors.length / 3} array={vertexColors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={pointSize * 0.08} vertexColors sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}

// PCD file loader component - loads .pcd files directly via Three.js PCDLoader
function PCDFileObject({ url }: { url: string }) {
  const [object, setObject] = useState<THREE.Points | null>(null);

  useEffect(() => {
    const loader = new PCDLoader();
    loader.load(url, (pcd) => {
      pcd.material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, sizeAttenuation: true });
      setObject(pcd);
    }, undefined, (err) => {
      console.error('Failed to load PCD file:', err);
    });
    return () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); };
  }, [url]);

  if (!object) return null;
  return <primitive object={object} />;
}

function CuboidAnnotation({ ann }: { ann: Annotation }) {
  if (ann.points.length < 2) return null;
  const [p1, p2] = ann.points;
  const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);
  const minZ = p1.z || 0, maxZ = p2.z || 0;
  const w = Math.max(maxX - minX, 0.1), h = Math.max(maxY - minY, 0.1), d = Math.max(maxZ - minZ, 0.1);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;

  return (
    <mesh position={[cx, cy, cz]}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial color={ann.color || '#3b82f6'} wireframe transparent opacity={0.6} />
    </mesh>
  );
}

function Scene({ pointCloud, colorMode, pointSize, annotations }: Props) {
  return (
    <>
      <OrbitControls enableDamping dampingFactor={0.1} rotateSpeed={0.5} />
      <gridHelper args={[100, 20, 0x444444, 0x222222]} />
      <axesHelper args={[5]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {pointCloud && pointCloud.points.length > 0 && (
        <PointCloudMesh points={pointCloud.points} colors={pointCloud.colors} colorMode={colorMode} pointSize={pointSize} />
      )}
      {annotations.filter(a => a.visible).map(ann => <CuboidAnnotation key={ann.id} ann={ann} />)}
    </>
  );
}

export default function PointCloudViewer(props: Props) {
  const [webGLAvailable, setWebGLAvailable] = useState(false);
  const [glError, setGlError] = useState('');

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) { setWebGLAvailable(true); }
      else { setGlError('WebGL is not supported in this browser'); }
    } catch (e) {
      setGlError('WebGL initialization failed');
    }
  }, []);

  if (glError) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${props.dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <p className={`text-sm ${props.dark ? 'text-gray-400' : 'text-gray-500'}`}>{glError}</p>
      </div>
    );
  }

  if (!webGLAvailable) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${props.dark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ViewerErrorBoundary dark={props.dark}>
      <div className="w-full h-full">
        <Canvas
          camera={{ position: [30, 20, 30], fov: 50, near: 0.1, far: 2000 }}
          style={{ background: props.dark ? '#0a0a0f' : '#f0f0f0' }}
          gl={{ antialias: true, alpha: false }}
        >
          <React.Suspense fallback={null}>
            <Scene {...props} />
          </React.Suspense>
        </Canvas>
      </div>
    </ViewerErrorBoundary>
  );
}
