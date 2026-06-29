from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import torch, torch.nn as nn, timm, io, base64, cv2, os, sqlite3, tempfile, uuid, datetime
import numpy as np
from torchvision import transforms
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from facenet_pytorch import MTCNN

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# ════════════════════════════════════════════════════════════════
#  MODEL ARCHITECTURE (same as training)
# ════════════════════════════════════════════════════════════════
class DualBranchDeepfakeDetector(nn.Module):
    def __init__(self, num_classes=2, pretrained=False):
        super().__init__()
        self.rgb_backbone = timm.create_model('efficientnet_b4', pretrained=pretrained, num_classes=0)
        rgb_features = self.rgb_backbone.num_features
        self.fft_branch = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(), nn.AdaptiveAvgPool2d(1),
        )
        self.classifier = nn.Sequential(
            nn.Linear(rgb_features+128, 512), nn.ReLU(), nn.Dropout(0.4),
            nn.Linear(512,128), nn.ReLU(), nn.Dropout(0.3), nn.Linear(128,num_classes)
        )
    def forward(self, rgb, fft):
        r = self.rgb_backbone(rgb)
        f = self.fft_branch(fft).flatten(1)
        return self.classifier(torch.cat([r,f], dim=1))


model = DualBranchDeepfakeDetector().to(DEVICE)
ckpt  = torch.load('models/deepfake_detector_v2_final.pth', map_location=DEVICE, weights_only=False)
model.load_state_dict(ckpt['model_state'])
model.eval()
print(f"✅ Model loaded — Val AUC: {ckpt.get('val_auc', 'N/A')}, Val Acc: {ckpt.get('val_acc', 'N/A')}")

# Face detector
mtcnn = MTCNN(image_size=224, margin=20, post_process=False, device=DEVICE)

TF = transforms.Compose([
    transforms.Resize((224,224)), transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])


def compute_fft(tensor):
    gray = tensor.mean(0).numpy()
    fft  = np.fft.fft2(gray)
    mag  = np.log(np.abs(np.fft.fftshift(fft))+1e-8)
    mag  = (mag-mag.min())/(mag.max()-mag.min()+1e-8)
    return torch.tensor(mag, dtype=torch.float32).unsqueeze(0).repeat(3,1,1)


def get_verdict(fake_prob):
    """Apply uncertainty zone: 45-55% confidence = UNCERTAIN."""
    if 45 <= fake_prob <= 55:
        return "UNCERTAIN"
    return "FAKE" if fake_prob > 50 else "REAL"


def detect_and_crop_face(img_pil):
    """Use MTCNN to find and crop the face. Falls back to full image if no face found."""
    try:
        face_tensor = mtcnn(img_pil)
        if face_tensor is not None:
            # face_tensor is (3, 224, 224) in range [0, 255]
            face_np = face_tensor.permute(1,2,0).byte().numpy()
            return Image.fromarray(face_np), True
    except Exception as e:
        print(f"Face detection error: {e}")
    return img_pil, False


def run_inference(img_pil):
    """Run full pipeline: face detect -> model -> gradcam. Returns dict result."""
    face_img, face_found = detect_and_crop_face(img_pil)

    img_np = np.array(face_img.resize((224,224)))
    img_f  = np.float32(img_np)/255.0

    rgb_tensor = TF(face_img).unsqueeze(0).to(DEVICE)
    fft_tensor = compute_fft(TF(face_img)).unsqueeze(0).to(DEVICE)

    # ── Test-Time Augmentation (TTA) ──────────────────────────────
    # Average predictions from original + horizontally flipped input
    # for a more robust, less noisy final probability.
    with torch.no_grad():
        out1   = model(rgb_tensor, fft_tensor)
        probs1 = torch.softmax(out1, dim=1)[0]

        rgb_flipped = torch.flip(rgb_tensor, dims=[3])
        fft_flipped = torch.flip(fft_tensor, dims=[3])
        out2   = model(rgb_flipped, fft_flipped)
        probs2 = torch.softmax(out2, dim=1)[0]

        probs = (probs1 + probs2) / 2

    fake_prob = round(float(probs[0])*100, 1)
    real_prob = round(float(probs[1])*100, 1)
    verdict   = get_verdict(fake_prob)

    # Grad-CAM
    class ModelWrapper(nn.Module):
        def __init__(self, m, fft_t):
            super().__init__()
            self.m = m
            self.fft_t = fft_t
        def forward(self, x):
            return self.m(x, self.fft_t)

    wrapper = ModelWrapper(model, fft_tensor)
    cam = GradCAM(model=wrapper, target_layers=[model.rgb_backbone.blocks[-1][-1]])
    grayscale = cam(input_tensor=rgb_tensor, targets=[ClassifierOutputTarget(0)])[0]

    img_resized = cv2.resize(img_f, (224,224))
    heatmap = show_cam_on_image(img_resized, grayscale, use_rgb=True)
    _, buf = cv2.imencode('.jpg', cv2.cvtColor(heatmap, cv2.COLOR_RGB2BGR))
    heatmap_b64 = base64.b64encode(buf).decode()

    # Encode the (possibly cropped) face used for prediction
    _, face_buf = cv2.imencode('.jpg', cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR))
    face_b64 = base64.b64encode(face_buf).decode()

    return {
        "verdict": verdict,
        "fake_prob": fake_prob,
        "real_prob": real_prob,
        "heatmap_b64": heatmap_b64,
        "face_b64": face_b64,
        "face_detected": face_found,
    }


# ════════════════════════════════════════════════════════════════
#  DATABASE — simple SQLite for history
# ════════════════════════════════════════════════════════════════
DB_PATH = 'history.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id TEXT PRIMARY KEY,
            filename TEXT,
            verdict TEXT,
            fake_prob REAL,
            real_prob REAL,
            face_detected INTEGER,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def save_to_history(filename, result):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        'INSERT INTO predictions VALUES (?, ?, ?, ?, ?, ?, ?)',
        (
            str(uuid.uuid4()),
            filename,
            result['verdict'],
            result['fake_prob'],
            result['real_prob'],
            1 if result['face_detected'] else 0,
            datetime.datetime.now().isoformat(),
        )
    )
    conn.commit()
    conn.close()


# ════════════════════════════════════════════════════════════════
#  ROUTES
# ════════════════════════════════════════════════════════════════

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Single image prediction."""
    content = await file.read()
    img = Image.open(io.BytesIO(content)).convert('RGB')

    result = run_inference(img)
    save_to_history(file.filename, result)

    return result


@app.post("/predict-batch")
async def predict_batch(files: list[UploadFile] = File(...)):
    """Multiple image upload — returns a list of results."""
    results = []
    for f in files:
        content = await f.read()
        img = Image.open(io.BytesIO(content)).convert('RGB')
        result = run_inference(img)
        save_to_history(f.filename, result)
        results.append({
            "filename": f.filename,
            **result
        })
    return {"results": results}


@app.post("/predict-video")
async def predict_video(file: UploadFile = File(...), max_frames: int = 20):
    """
    Extract evenly-spaced frames from video, run detection on each,
    return per-frame results for a probability-over-time graph.
    """
    content = await file.read()

    # Save to temp file (OpenCV needs a file path)
    suffix = os.path.splitext(file.filename)[1] or '.mp4'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        cap = cv2.VideoCapture(tmp_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25

        if total_frames <= 0:
            return {"error": "Could not read video file"}

        step = max(1, total_frames // max_frames)
        frame_results = []
        frame_idx = 0
        sampled = 0

        while cap.isOpened() and sampled < max_frames:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img_pil = Image.fromarray(rgb_frame)

            result = run_inference(img_pil)
            timestamp_sec = round(frame_idx / fps, 2)

            frame_results.append({
                "frame_index": frame_idx,
                "timestamp_sec": timestamp_sec,
                "fake_prob": result["fake_prob"],
                "real_prob": result["real_prob"],
                "verdict": result["verdict"],
                "face_detected": result["face_detected"],
            })

            frame_idx += step
            sampled += 1

        cap.release()

        if not frame_results:
            return {"error": "No frames could be processed"}

        # Aggregate stats
        avg_fake = sum(r['fake_prob'] for r in frame_results) / len(frame_results)
        max_fake = max(r['fake_prob'] for r in frame_results)
        fake_frame_count = sum(1 for r in frame_results if r['verdict'] == 'FAKE')

        overall_verdict = get_verdict(avg_fake)

        # Save summary to history
        save_to_history(
            file.filename,
            {
                "verdict": overall_verdict,
                "fake_prob": round(avg_fake, 1),
                "real_prob": round(100 - avg_fake, 1),
                "face_detected": any(r['face_detected'] for r in frame_results),
            }
        )

        return {
            "overall_verdict": overall_verdict,
            "avg_fake_prob": round(avg_fake, 1),
            "max_fake_prob": round(max_fake, 1),
            "fake_frame_count": fake_frame_count,
            "total_frames_analyzed": len(frame_results),
            "frames": frame_results,
        }

    finally:
        os.unlink(tmp_path)


@app.get("/history")
async def get_history(limit: int = 50):
    """Return recent prediction history."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        'SELECT * FROM predictions ORDER BY timestamp DESC LIMIT ?', (limit,)
    ).fetchall()
    conn.close()
    return {"history": [dict(r) for r in rows]}


@app.delete("/history")
async def clear_history():
    """Clear all history."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('DELETE FROM predictions')
    conn.commit()
    conn.close()
    return {"status": "cleared"}


@app.get("/stats")
async def get_stats():
    """Summary statistics for dashboard."""
    conn = sqlite3.connect(DB_PATH)
    total = conn.execute('SELECT COUNT(*) FROM predictions').fetchone()[0]
    fake_count = conn.execute("SELECT COUNT(*) FROM predictions WHERE verdict='FAKE'").fetchone()[0]
    real_count = conn.execute("SELECT COUNT(*) FROM predictions WHERE verdict='REAL'").fetchone()[0]
    uncertain_count = conn.execute("SELECT COUNT(*) FROM predictions WHERE verdict='UNCERTAIN'").fetchone()[0]
    conn.close()
    return {
        "total_predictions": total,
        "fake_count": fake_count,
        "real_count": real_count,
        "uncertain_count": uncertain_count,
    }


@app.get("/")
async def root():
    return {
        "status": "running",
        "model": "DualBranchDeepfakeDetector",
        "device": str(DEVICE),
        "endpoints": ["/predict", "/predict-batch", "/predict-video", "/history", "/stats"]
    }