import React from "react";
import AnnotationCanvas from "./components/AnnotationCanvas";
import ThreeScene from "./components/ThreeScene";

export default function App() {
  return (
    <div className="app">
      <div className="sidebar">
        <h3>GV AI Annotation Tool</h3>
        <p>Prototype with multiple annotation types: bbox, polygon, polyline, keypoints, cuboid, cuboid3d</p>
        <div style={{ marginTop: 12 }}>
          <div className="label">2D Canvas</div>
          <div style={{ border: '1px solid #eee', padding: 8, marginTop:8 }}>
            Use tools to create and edit annotations. Click to select; drag vertices to reshape; use replace buttons to convert types where possible.
          </div>
        </div>
      </div>

      <div className="canvasWrap">
        <div style={{ padding: 12, display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <AnnotationCanvas />
          </div>
          <div style={{ width: 380 }}>
            <ThreeScene />
          </div>
        </div>
      </div>
    </div>
  );
}
