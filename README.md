# 🔍 Deepfake Detection System

![Python](https://img.shields.io/badge/Python-3.10-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=flat-square&logo=pytorch)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

A full-stack AI system for detecting deepfake images and videos using a **dual-branch deep learning architecture** that combines spatial and frequency domain analysis.

> 🎓 Final Year Project — B.E. Computer Science Engineering, CCET Chandigarh

---

## 🧠 Architecture

The model uses a **dual-branch approach** for robust deepfake detection:

| Branch | Model | Input |
|--------|-------|-------|
| Spatial Branch | EfficientNet-B4 | Raw face image (RGB) |
| Frequency Branch | Custom CNN | FFT frequency domain map |

Both branches are fused and passed through a classification head to produce a final real/fake prediction.

**Training was done in 3 progressive phases on Kaggle (T4 GPU):**
- Phase 1: Train classification head only (frozen backbone)
- Phase 2: Fine-tune top layers of EfficientNet-B4
- Phase 3: Full model fine-tuning with lower learning rate

**Results:**
- ✅ ~98% Accuracy on combined test set
- ✅ >0.998 AUC (Area Under ROC Curve)
- ✅ Covers 6 manipulation types (FaceSwap, Deepfakes, Face2Face, NeuralTextures, FaceShifter, etc.)

---

## ✨ Features

- 🖼️ **Image Analysis** — Upload any image for real/fake classification
- 🎥 **Video Frame Analysis** — Extracts and analyzes frames from video files
- 👤 **MTCNN Face Detection** — Automatically detects and crops faces before analysis
- 🔥 **Grad-CAM Explainability** — Visual heatmaps showing which regions influenced the prediction
- 🔁 **Test-Time Augmentation (TTA)** — Multiple augmented passes for more robust predictions
- ⚠️ **Uncertainty Zone** — Flags low-confidence predictions instead of forcing a binary output
- 📊 **Prediction History** — SQLite database storing all past predictions
- 🌐 **Full-Stack Web App** — FastAPI backend + React frontend

---

## 🗂️ Project Structure

```
deepfake-detection-system/
├── backend/
│   └── main.py              # FastAPI server — all endpoints, model loading, inference
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js           # Main React app
│       └── ...
├── .gitignore
└── README.md
```

> **Note:** The trained model file (`deepfake_detector_v3_final.pth`) is not included in this repo due to file size. Download it from the link below.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- pip

### 1. Clone the repository

```bash
git clone https://github.com/angadevgan/deepfake-detection-system.git
cd deepfake-detection-system
```

### 2. Backend Setup

```bash
cd backend
pip install fastapi uvicorn torch torchvision facenet-pytorch timm opencv-python pillow numpy
```

Download the pretrained model and place it in the `backend/` folder:

📥 **[Download https://drive.google.com/file/d/12BfXNLgikpynqLYwE6YPcuUYhss9Ejo_/view?usp=drive_link](#)** ← *(add your Google Drive / HuggingFace link here)*

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app will be available at `http://localhost:3000`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/image` | Analyze an image for deepfake |
| POST | `/predict/video` | Analyze a video file |
| GET | `/history` | Get prediction history |
| GET | `/health` | Health check |

---

## 🧪 Dataset

Trained on a combined dataset:
- **FaceForensics++** (multiple manipulation types)
- Real and fake samples covering 6 manipulation techniques

Data preprocessing: MTCNN face detection → 224×224 crop → normalization

---

## 📸 Screenshots

*(Add screenshots of the web interface here)*

---

## 🔬 Research

This project is associated with research on **carbon-aware benchmarking for AI systems** and lightweight model deployment for real-world detection tasks.

---

## 👤 Author

**Angad Devgan**
- 📧 [GitHub](https://github.com/angadevgan)
- 🎓 B.E. CSE — Chandigarh College of Engineering and Technology (CCET)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
