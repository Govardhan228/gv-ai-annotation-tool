import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Annotation, Point } from '../types';

interface Props {
  dark: boolean;
  pointCloud: { points: Point[]; colors: string[] } | null;
  colorMode: string;
  pointSize: number;
  annotations: Annotation[];
  activeView: string;
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

function Scene({ pointCloud, colorMode, pointSize, annotations, activeView }: Props) {
  const cameraPositions: Record<string, [number, number, number]> = {
    front: [0, 5, 50],
    rear: [0, 5, -50],
    top: [0, 50, 0.1],
    perspective: [30, 20, 30],
  };

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
  return (
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
  );
}
