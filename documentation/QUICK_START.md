# 🚀 TacticoAI - One-Page Quick Start

## ⚡ Requirements
- ✅ Python 3.12 (NOT 3.13!)
- ✅ Node.js 16+
- ✅ NVIDIA GPU (optional - makes AI 10-50x faster)

---

## 🔧 Setup Commands (Copy & Paste)

### Windows Setup

```powershell
# 1. Install Python 3.12 (if not installed)
# Download from: https://www.python.org/downloads/release/python-3120/

# 2. Backend Setup
cd backend
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install PyTorch with GPU support (if you have NVIDIA GPU)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

# 4. Install dependencies
pip install -r requirements.txt

# 5. Verify GPU (if applicable)
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"

# 6. Create .env file
# Copy .env.example to .env and add your Supabase credentials
# Set ANALYSIS_DEVICE=cuda (or 'cpu' if no GPU)

# 7. Run backend
uvicorn main:app --reload

# 8. Frontend Setup (new terminal)
cd ..\frontend
npm install
npm run dev
```

### macOS/Linux Setup

```bash
# 1. Install Python 3.12
brew install python@3.12              # macOS
sudo apt install python3.12 -y       # Linux

# 2. Backend Setup
cd backend
python3.12 -m venv venv
source venv/bin/activate

# 3. Install PyTorch with GPU support (if you have NVIDIA GPU)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

# 4. Install dependencies
pip install -r requirements.txt

# 5. Verify GPU (if applicable)
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"

# 6. Create .env file
# Copy .env.example to .env and add your Supabase credentials
# Set ANALYSIS_DEVICE=cuda (or 'cpu' if no GPU)

# 7. Run backend
uvicorn main:app --reload

# 8. Frontend Setup (new terminal)
cd ../frontend
npm install
npm run dev
```

---

## 📍 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## ✅ Verification Checklist

After setup, run these to verify everything works:

```bash
# Check Python version
python --version
# Expected: Python 3.12.x

# Check PyTorch
python -c "import torch; print(torch.__version__)"
# Expected: 2.5.x+cu124

# Check CUDA (if GPU)
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"
# Expected: CUDA: True

# Check imports
python -c "import ultralytics, transformers, cv2; print('✅ Ready!')"
# Expected: ✅ Ready!
```

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| "Torch not compiled with CUDA" | `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124` |
| "python not found" | Make sure Python 3.12 is installed and in PATH |
| "Module not found" | Activate venv: `.\venv\Scripts\Activate.ps1` (Windows) or `source venv/bin/activate` (macOS/Linux) |
| Using Python 3.13 | Recreate venv with Python 3.12: `py -3.12 -m venv venv` |
| CUDA 13.0 in nvidia-smi | That's fine! PyTorch 12.4 works with CUDA 13.0 drivers |

---

## 💡 Pro Tips

1. **Always activate venv** before running commands - you'll see `(venv)` in your prompt
2. **GPU vs CPU**: GPU is 10-50x faster for video analysis
3. **Python versions**: Multiple versions can coexist - each project uses its own venv
4. **Check GPU usage**: Use `nvidia-smi` to monitor GPU during analysis

