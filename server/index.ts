import express from 'express';
import cors from 'cors';
import multer from 'multer';

const upload = multer();
const app = express();
app.use(cors());
app.use(express.json());

// Simple stub YOLO detector - returns demo boxes relative to passed width/height
app.post('/api/detect', upload.single('image'), async (req, res) => {
  try {
    // Accept either json with width/height or a file upload; fallback to default
    const { width = 1100, height = 640 } = req.body || {};
    const w = parseInt(width as any, 10) || 1100;
    const h = parseInt(height as any, 10) || 640;

    // Demo detections: two boxes and a small object
    const detections = [
      { label: 'person', confidence: 0.92, bbox: [w*0.15, h*0.12, w*0.45, h*0.68] },
      { label: 'car', confidence: 0.87, bbox: [w*0.5, h*0.4, w*0.86, h*0.72] },
      { label: 'dog', confidence: 0.76, bbox: [w*0.6, h*0.15, w*0.72, h*0.3] }
    ];

    // Simulate async model latency
    await new Promise(r => setTimeout(r, 600));
    res.json({ detections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'detection_failed' });
  }
});

const port = +(process.env.PORT || 6000);
app.listen(port, () => console.log(`Detection server listening on ${port}`));
