import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { useStore } from "../store";

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cuboids3d = useStore((s: import('../store').StoreState) => s.annotations).filter(a => a.type === "cuboid3d") as any[];

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f5f8);

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.set(2, 2, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    const grid = new THREE.GridHelper(10, 10);
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    const cubes: THREE.Mesh[] = [];
    cuboids3d.forEach((c) => {
      const geometry = new THREE.BoxGeometry(c.size[0], c.size[1], c.size[2]);
      const material = new THREE.MeshStandardMaterial({ color: 0x0b63ff, transparent: true, opacity: 0.9 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(c.center[0], c.center[1], c.center[2]);
      scene.add(cube);
      cubes.push(cube);
    });

    function onResize() {
      const w = mountRef.current!.clientWidth;
      const h = mountRef.current!.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    const animate = () => {
      requestAnimationFrame(animate);
      cubes.forEach((cube) => cube.rotation.y += 0.002);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [cuboids3d]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "400px" }} />
      <div style={{ padding: 12 }}>
        <div className="label">3D Cuboid Preview</div>
        <p style={{ marginTop: 6 }}>Use mouse to orbit and inspect 3D cuboid. Full transformation controls available in later iterations.</p>
      </div>
    </div>
  );
}
