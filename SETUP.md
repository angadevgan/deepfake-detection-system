# Quick Setup Guide

## 1. Clone & Download Model

```bash
git clone https://github.com/angadevgan/deepguard.git
cd deepguard
```

Download the model from [Google Drive](https://drive.google.com/file/d/12BfXNLgikpynqLYwE6YPcuUYhss9Ejo_/view?usp=drive_link) and place it at:
`backend/models/deepfake_detector_v3_final.pth`

## 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 3. Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm start
```

## 4. Open the app

Go to `http://localhost:3000`

## Troubleshooting

**"Could not connect to backend"** → Make sure uvicorn is running on port 8000

**Model not found error** → Confirm `deepfake_detector_v3_final.pth` is inside `backend/models/`

**Pillow/torch import errors** → Run `pip install --upgrade --force-reinstall pillow==10.2.0`
