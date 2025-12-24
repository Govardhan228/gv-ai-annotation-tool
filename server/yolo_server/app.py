from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import numpy as np

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load a YOLO model (small by default). Replace model name/path as needed.
try:
    model = YOLO('yolov8n.pt')
except Exception as e:
    model = None
    print('Warning: Could not load YOLO model at startup. You must have ultralytics and the weights available.')


@app.post('/detect')
async def detect_image(file: UploadFile = File(...), conf_threshold: float = Form(0.25), classes: str = Form(None)):
    """Accepts an image file and returns detections in pixel coordinates.
    'classes' is an optional comma-separated list of class names or indices to filter.
    """
    if model is None:
        return {"error": "yolo_model_unavailable", "detail": "Ensure ultralytics is installed and weights are present (yolov8n.pt)"}

    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert('RGB')
    arr = np.array(img)

    # run model
    res = model.predict(source=arr, conf=conf_threshold, verbose=False)

    detections = []
    for r in res:
        boxes = getattr(r, 'boxes', None)
        if boxes is None:
            continue
        xyxy = boxes.xyxy.cpu().numpy() if hasattr(boxes.xyxy, 'cpu') else np.array(boxes.xyxy)
        confs = boxes.conf.cpu().numpy() if hasattr(boxes.conf, 'cpu') else np.array(boxes.conf)
        cls_idxs = boxes.cls.cpu().numpy() if hasattr(boxes.cls, 'cpu') else np.array(boxes.cls)
        for b, conf, cls_idx in zip(xyxy, confs, cls_idxs):
            x1, y1, x2, y2 = map(float, b)
            label = model.names[int(cls_idx)] if model and (int(cls_idx) in model.names) else str(int(cls_idx))
            detections.append({"label": label, "confidence": float(conf), "bbox": [x1, y1, x2, y2]})

    # optional client-side class filter by name(s)
    if classes:
        wanted = set([c.strip() for c in classes.split(',') if c.strip()])
        detections = [d for d in detections if d['label'] in wanted]

    return {"detections": detections}
