import React, { useCallback, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Line, Circle, Transformer } from "react-konva";
import type { Annotation } from "../types/annotation";
import { v4 as uuid } from "uuid";
import { convertAnnotation } from "../utils/conversions";
import { useStore } from "../store";

interface Props {}

export default function AnnotationCanvas(_: Props) {
  const annotations = useStore((s: import('../store').StoreState) => s.annotations);
  const setAnnotations = useStore((s: import('../store').StoreState) => s.setAnnotations);
  const addAnnotation = useStore((s: import('../store').StoreState) => s.addAnnotation);
  const selectedId = useStore((s: import('../store').StoreState) => s.selectedId);
  const setSelectedId = useStore((s: import('../store').StoreState) => s.setSelectedId);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [threshold, setThreshold] = React.useState<number>(0.25);
  const [classFilter, setClassFilter] = React.useState<string>('');

  const acceptSuggestion = (index: number) => {
    const s = suggestions[index];
    if (!s) return;
    const newAnno: any = {
      id: uuid(),
      type: 'bbox',
      bbox: [s.bbox[0], s.bbox[1], s.bbox[2], s.bbox[3]],
      label: s.label,
      attributes: { confidence: s.confidence }
    };
    addAnnotation(newAnno);
    // remove suggestion
    setSuggestions(prev => prev.filter((_: any, i: number) => i !== index));
  };

  const rejectSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_: any, i: number) => i !== index));
  };

  const acceptAll = () => {
    suggestions.forEach((s:any) => {
      const newAnno: any = {
        id: uuid(),
        type: 'bbox',
        bbox: [s.bbox[0], s.bbox[1], s.bbox[2], s.bbox[3]],
        label: s.label,
        attributes: { confidence: s.confidence }
      };
      addAnnotation(newAnno);
    });
    setSuggestions([]);
  };


  const addBBox = () => {
    const w = 240, h = 140;
    const newAnno: Annotation = {
      id: uuid(),
      type: "bbox",
      bbox: [100, 80, 100 + w, 80 + h],
      label: "object"
    } as any;
    addAnnotation(newAnno);
    setSelectedId(newAnno.id);
  };

  const addPolygon = () => {
    const newAnno: Annotation = {
      id: uuid(),
      type: "polygon",
      points: [[150, 120], [300, 120], [280, 230], [200, 260]],
      label: "poly"
    } as any;
    addAnnotation(newAnno);
    setSelectedId(newAnno.id);
  };

  const addPolyline = () => {
    const newAnno: Annotation = {
      id: uuid(),
      type: "polyline",
      points: [[120, 90], [240, 140], [300, 120]],
      label: "line"
    } as any;
    addAnnotation(newAnno);
    setSelectedId(newAnno.id);
  };

  const addKeypoint = () => {
    const newAnno: any = {
      id: uuid(),
      type: "keypoints",
      keypoints: [{ name: "pt1", point: [220, 180], visible: true }],
      label: "kp"
    };
    addAnnotation(newAnno);
    setSelectedId(newAnno.id);
  };

  const addCuboid = () => {
    const newAnno: any = {
      id: uuid(),
      type: "cuboid",
      points: [[200, 120], [320, 120], [360, 200], [240, 200]],
      label: "cuboid"
    };
    addAnnotation(newAnno);
    setSelectedId(newAnno.id);
  };

  const replaceSelected = (toType: string) => {
    if (!selectedId) return;
    const idx = annotations.findIndex(a => a.id === selectedId);
    if (idx === -1) return;
    try {
      const converted = convertAnnotation(annotations[idx] as any, toType);
      const copy = annotations.slice();
      copy[idx] = converted as any;
      setAnnotations(copy);
      setSelectedId(copy[idx].id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const onDragEndRect = (id: string, e: any) => {
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const w = node.width() * node.scaleX();
    const h = node.height() * node.scaleY();
    node.scaleX(1); node.scaleY(1);
    setAnnotations(a => a.map(an => {
      if (an.id !== id) return an;
      if (an.type !== "bbox") return an;
      (an as any).bbox = [x, y, x + w, y + h];
      return { ...an };
    }));
  };

  const onTransformEndRect = (id: string, e: any) => {
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const w = node.width() * node.scaleX();
    const h = node.height() * node.scaleY();
    node.scaleX(1); node.scaleY(1);
    setAnnotations(a => a.map(an => {
      if (an.id !== id) return an;
      if (an.type !== "bbox") return an;
      (an as any).bbox = [x, y, x + w, y + h];
      return { ...an };
    }));
  };

  const onVertexDrag = (id: string, vIndex: number, x: number, y: number) => {
    setAnnotations(a => a.map(an => {
      if (an.id !== id) return an;
      if (an.type === "polygon" || an.type === "polyline" || an.type === "cuboid") {
        (an as any).points[vIndex] = [x, y];
      }
      return { ...an };
    }));
  };

  const selectedShape = annotations.find(a => a.id === selectedId);

  useEffect(() => {
    // reset suggestions when annotations change
    setSuggestions([]);
  }, [annotations]);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: 220, paddingRight: 10 }}>
        <div className="label">Create</div>
        <div className="toolbar">
          <button className="button" onClick={addBBox}>BBox</button>
          <button className="button" onClick={addPolygon}>Polygon</button>
          <button className="button" onClick={addPolyline}>Polyline</button>
          <button className="button" onClick={addKeypoint}>Keypoint</button>
          <button className="button" onClick={addCuboid}>Cuboid</button>
          <button className="button" onClick={() => {
            const newAnno: any = {
              id: uuid(),
              type: "cuboid3d",
              center: [0, 0, 0],
              size: [1, 1, 2],
              label: "cuboid3d"
            };
            addAnnotation(newAnno);
            setSelectedId(newAnno.id);
          }}>3D Cuboid</button>
        </div>

        <div className="properties">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div className="label">Selected</div>
            <div>
              <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <div style={{ marginTop:6, display:'flex', gap:8, alignItems:'center' }}>
                <label style={{ fontSize:12 }}>Conf:</label>
                <input type="range" min={0} max={1} step={0.01} value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} />
                <span style={{ width:44, textAlign:'right' }}>{(threshold*100).toFixed(0)}%</span>
              </div>
              <div style={{ marginTop:6 }}>
                <input placeholder="class filter (comma list)" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ width: 160 }} />
              </div>

              <div style={{ marginTop:8 }}>
                <button className="button" onClick={async () => {
                  const stage = stageRef.current;
                  const w = stage ? stage.width() : 1100;
                  const h = stage ? stage.height() : 640;
                  try {
                    setLoading(true);
                    if (selectedFile) {
                      const fd = new FormData();
                      fd.append('file', selectedFile as any);
                      fd.append('conf_threshold', String(threshold));
                      if (classFilter) fd.append('classes', classFilter);
                      const res = await fetch('http://localhost:8000/detect', { method: 'POST', body: fd });
                      const data = await res.json();
                      if (data && data.detections) setSuggestions(data.detections);
                      else alert('Detection server error. See console.');
                    } else {
                      // fallback to demo node stub
                      const res = await fetch('http://localhost:6000/api/detect', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ width: w, height: h })
                      });
                      const data = await res.json();
                      setSuggestions(data.detections || []);
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Auto-detection failed. See console.');
                  } finally { setLoading(false); }
                }}>Auto-detect (YOLO)</button>
              </div>

            </div>
          </div>

          {selectedShape ? (
            <div>
              <div>ID: {selectedShape.id}</div>
              <div>Type: {selectedShape.type}</div>
              <div style={{ marginTop:8, display:'flex', gap:8 }}>
                <button className="button" onClick={() => replaceSelected("polygon")}>To Polygon</button>
                <button className="button" onClick={() => replaceSelected("bbox")}>To BBox</button>
                <button className="button" onClick={() => replaceSelected("polyline")}>To Polyline</button>
              </div>
            </div>
          ) : (
            <div>None</div>
          )}

          <div style={{ marginTop: 12 }}>
            <div className="label">Suggestions</div>
            {loading ? (<div>Running model... ⏳</div>) : (
              <div>
                {suggestions.length === 0 ? (<div>No suggestions</div>) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {suggestions.map((s:any, i:number) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>{s.label} ({(s.confidence*100).toFixed(0)}%)</div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="button" onClick={() => acceptSuggestion(i)}>Accept</button>
                          <button className="button" onClick={() => rejectSuggestion(i)}>Reject</button>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:6, display:'flex', gap:8 }}>
                      <button className="button primary" onClick={acceptAll}>Accept All</button>
                      <button className="button" onClick={() => setSuggestions([])}>Clear</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ height: 640 }} className="canvasArea">
          <Stage width={1100} height={640} ref={stageRef} onMouseDown={(e) => {
            // deselect on click empty area
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty) setSelectedId(null);
          }}>
            <Layer>
              {/* render items */}
              {annotations.map((a) => {
                if (a.type === "bbox") {
                  const b = a as any;
                  const [x1, y1, x2, y2] = b.bbox;
                  return (
                    <React.Fragment key={a.id}>
                      <Rect id={a.id} x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={selectedId === a.id ? "rgba(10,120,255,0.1)" : "transparent"}
                        stroke={selectedId === a.id ? "#0b63ff" : "#ff8a00"}
                        strokeWidth={2}
                        draggable
                        onDragEnd={(e) => onDragEndRect(a.id, e)}
                        onTransformEnd={(e) => onTransformEndRect(a.id, e)}
                        onClick={() => setSelectedId(a.id)}
                      />
                      {selectedId === a.id && (
                        <Transformer ref={trRef} nodes={[stageRef.current?.findOne(`#${a.id}`)]} />
                      )}
                    </React.Fragment>
                  );
                }

                if (a.type === "polygon" || a.type === "polyline" || a.type === "cuboid") {
                  // Draw suggestion overlay highlights for active suggestions
                  return null;
                  const p = a as any;
                  const flat = ([] as number[]).concat(...p.points.map((pt: any) => [pt[0], pt[1]]));
                  return (
                    <React.Fragment key={a.id}>
                      <Line points={flat} closed={a.type === "polygon" || a.type === "cuboid"} stroke={selectedId === a.id ? "#0b63ff" : "#e85"} strokeWidth={2} fill={a.type === "polygon" ? "rgba(200,80,120,0.08)" : undefined}
                        onClick={() => setSelectedId(a.id)} />
                      {p.points.map((pt: any, i: number) => (
                        <Circle key={i} x={pt[0]} y={pt[1]} radius={6} fill={"#fff"} stroke={"#666"} strokeWidth={1}
                          draggable={selectedId === a.id}
                          onDragMove={(e) => onVertexDrag(a.id, i, e.target.x(), e.target.y())}
                          onClick={() => setSelectedId(a.id)}
                        />
                      ))}
                    </React.Fragment>
                  );
                }

                if (a.type === "keypoints") {
                  const k = a as any;
                  return (
                    <React.Fragment key={a.id}>
                      {k.keypoints.map((kp: any, i: number) => (
                        <Circle key={i} x={kp.point[0]} y={kp.point[1]} radius={6} fill={kp.visible ? "#0b63ff" : "#999"}
                          onClick={() => setSelectedId(a.id)} draggable={selectedId === a.id}
                          onDragMove={(e) => {
                            setAnnotations(aList => aList.map(an => {
                              if (an.id !== a.id) return an;
                              (an as any).keypoints[i].point = [e.target.x(), e.target.y()];
                              return { ...an };
                            }));
                          }}
                        />
                      ))}
                    </React.Fragment>
                  );
                }

                if (a.type === "cuboid3d") {
                  // not rendered in 2D canvas
                  return null;
                }

                return null;
              })}
            </Layer>

            {/* suggestion overlay */}
            <Layer>
              {suggestions.map((s:any, i:number) => {
                const [x1,y1,x2,y2] = s.bbox;
                return (
                  <React.Fragment key={`s-${i}`}>
                    <Rect x={x1} y={y1} width={x2-x1} height={y2-y1}
                      stroke={'#00b37e'} strokeWidth={2} dash={[6,4]} fill={'rgba(0,179,126,0.06)'} opacity={0.95}
                      onClick={() => setSelectedId(null)}
                    />
                    <Circle x={x1+8} y={y1+8} radius={10} fill={'#00b37e'} onClick={() => acceptSuggestion(i)} />
                    <Circle x={x1+8} y={y1+30} radius={10} fill={'#e85'} onClick={() => rejectSuggestion(i)} />
                  </React.Fragment>
                );
              })}
            </Layer>
          </Stage>
        </div>

      </div>
    </div>
  );
}
