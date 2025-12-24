import io
from PIL import Image
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def make_image_bytes(width=320, height=240, color=(128, 128, 128)):
    img = Image.new('RGB', (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return buf


def test_detect_endpoint_returns_expected_shape_or_unavailable():
    buf = make_image_bytes()
    files = {'file': ('test.jpg', buf, 'image/jpeg')}
    response = client.post('/detect', files=files)
    assert response.status_code == 200
    data = response.json()
    # The server will return either detections or an error if the model isn't available
    assert ('detections' in data) or (data.get('error') == 'yolo_model_unavailable')
