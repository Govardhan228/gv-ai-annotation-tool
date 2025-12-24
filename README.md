# gv-ai-annotation-tool

Prototype implementation scaffolding for an annotation tool supporting multiple annotation types (bounding box, polygon, polyline, keypoints, cuboid projection, 3D cuboid preview).

## Quick start

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open http://localhost:5173

## Features in this prototype
- Create and edit basic annotation types in 2D canvas (Konva): BBox, Polygon, Polyline, Keypoints, Cuboid (2D projection)
- Simple 3D cuboid preview with orbit controls (Three.js)
- Replace/convert of bbox <-> polygon (best-effort, preview applies immediately)
- Vertex handles for polygon/polyline/cuboid; draggable keypoints

## Next steps
- Add full 3D transform controls and cuboid editing in 3D space
- Add persistence (backend API and DB), undo/redo, snapping, keyboard shortcuts
- Add export to COCO/Pascal/KITTI
- Add tests and documentation

## Auto-detection (YOLO)
This prototype includes a demo Auto-detect (YOLO) endpoint and UI integration:

- Frontend: click **Auto-detect (YOLO)** in the Selected panel to request detections for the active canvas size.
- Server: a simple stub is provided at `server/index.ts` which returns demo detections. It listens on port 6000 by default.
- Suggestions appear in the Suggestions panel and as dashed green boxes on the canvas. You can **Accept** (adds a bbox annotation) or **Reject** each suggestion, or **Accept All**.

To run locally:
1. Install deps: `npm install`
2. Start both frontend and server: `npm run dev` (uses concurrently to run Vite and the demo detection server)

Integrating a real YOLO model
- Python (recommended): the repository now includes `server/yolo_server/app.py` — a FastAPI app that uses Ultralytics YOLO. Install dependencies into a virtualenv with `pip install -r server/yolo_server/requirements.txt` and run `uvicorn app:app --reload --port 8000` (or `npm run yolo-server`). The endpoint is `POST http://localhost:8000/detect` and accepts multipart/form-data with `file`, `conf_threshold` (form float), and `classes` (comma-separated names).

Example response: `{"detections": [{"label":"car","confidence":0.9,"bbox":[x1,y1,x2,y2]}]}`.

- Notes: ensure the model weights (e.g., `yolov8n.pt`) are available to the ultralytics package. The FastAPI server will report a helpful error if the model isn't available.

Docker (optional):

Build and run the YOLO server via Docker:

```bash
cd server/yolo_server
docker build -t gv-yolo-server .
docker run -p 8000:8000 gv-yolo-server
```

The test suite (FastAPI + pytest) is included and can be run inside the YOLO server environment (it will pass even when the model is not available; in that case the server returns `{"error": "yolo_model_unavailable"}`). To run tests locally inside the yolo_server folder:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
```

GitHub Actions & deploys

Two workflows are included in `.github/workflows`:

- `deploy-vercel-render.yml` — triggered on `push` to `main`. It deploys the frontend to Vercel (requires Vercel secrets) and triggers a Render deploy for the YOLO server.
- `ngrok-dispatch.yml` — a manual workflow you can run (`Actions` → `ngrok-dispatch` → `Run workflow`) to expose your frontend temporarily through ngrok for demos.

Required GitHub repository secrets (set in repo Settings → Secrets):
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — for Vercel deploy
- `RENDER_API_KEY`, `RENDER_SERVICE_ID` — for Render deploy trigger
- `NGROK_AUTHTOKEN` — for ngrok manual demo runs

Example: Configure secrets and push to `main` to trigger the automatic deployment workflow.

ngrok demo usage

1. Go to the repository -> Actions -> select `Temporary ngrok share (manual)` -> Run workflow.
2. The job will install deps, start the dev server, create an ngrok tunnel and print the public URL in the job logs. The job will keep running for up to 60 minutes.

Security

- Keep tokens & API keys private (GitHub Secrets). For production, add authentication and rate limits for the detection endpoint.

- Node alternative: use ONNX runtime or a Node-based detection library and expose the same `/detect` API.


- Alternative (Node): use ONNX runtime or a JS-based YOLO implementation and expose a compatible `/api/detect`.

Security & performance
- For production, add image upload size limits, authentication, batching, and GPU support as needed.
