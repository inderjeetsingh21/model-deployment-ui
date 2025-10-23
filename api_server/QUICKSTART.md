# 🚀 Quick Start Guide - Complete Setup

This guide will help you set up both the backend API server and frontend UI for model deployment.

## 📦 What You Get

- **Backend API**: FastAPI server for model deployment (Port 8000)
- **Frontend UI**: React interface for managing deployments (Port 3000)
- **Model Servers**: Auto-generated FastAPI servers for each deployed model (Ports 8001+)

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend UI   │  Port 3000
│   (React/Vite)  │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│  Backend API    │  Port 8000
│    (FastAPI)    │
└────────┬────────┘
         │ Manages
         ▼
┌─────────────────┐
│  Model Servers  │  Ports 8001, 8002, ...
│   (FastAPI)     │
└─────────────────┘
```

## 📋 Prerequisites

- **Node.js 18+** and npm
- **Python 3.9+** and pip
- **4GB+ RAM**
- **Linux/macOS** (Windows with WSL)

## ⚡ Installation

### Step 1: Setup Backend

```bash
# Navigate to your project directory
cd /path/to/your/project

# Make setup script executable
chmod +x setup.sh

# Run automated setup
./setup.sh

# Activate virtual environment
source venv/bin/activate
```

### Step 2: Start Backend Server

```bash
# Start the API server
python3 api_server.py
```

You should see:
```
==================================================
AI Model Deployment Server Started
==================================================
Server running on: http://localhost:8000
API Documentation: http://localhost:8000/docs
Models directory: /path/to/deployed_models
Uploads directory: /path/to/uploads
==================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Verify Backend (Optional)

Open a new terminal and test:

```bash
# Activate venv
source venv/bin/activate

# Run test suite
python3 test_api.py
```

Or test manually:
```bash
# Check health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

### Step 4: Setup Frontend

```bash
# Navigate to your frontend directory
cd /path/to/model-deployment-ui

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

You should see:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

## 🎯 Usage

### Method 1: Using the Frontend UI

1. **Open Browser**: Navigate to `http://localhost:3000`

2. **Upload Model**: 
   - Click "Upload Model" or use the upload form
   - Select your `.pth` or `.pt` file
   - Enter a model name

3. **Configure Deployment**:
   - API Type: REST
   - Port: 8001 (or auto-assign)
   - Workers: 2-4 (based on CPU cores)
   - Target: Local Process

4. **Deploy**: Click "Deploy Model"

5. **Monitor**: View real-time deployment status

6. **Test Model**: Use the endpoint shown (e.g., `http://localhost:8001`)

### Method 2: Using API Directly

```bash
# 1. Upload a model
curl -X POST http://localhost:8000/api/upload-model \
  -F "file=@my_model.pth" \
  -F "model_name=my_classifier"

# 2. Deploy the model
curl -X POST http://localhost:8000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "my_classifier",
    "port": 8001,
    "workers": 4
  }'

# 3. Test the deployed model
curl http://localhost:8001/health

# 4. Make a prediction
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"data": [[1.0, 2.0, 3.0, 4.0]]}'

# 5. List all deployments
curl http://localhost:8000/api/deployments

# 6. Stop deployment
curl -X DELETE http://localhost:8000/api/deployments/abc12345
```

## 🔍 Accessing Your Deployments

### Backend API
- **Main API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Frontend UI
- **Web Interface**: http://localhost:3000

### Deployed Models
- **First Model**: http://localhost:8001
- **Second Model**: http://localhost:8002
- **Third Model**: http://localhost:8003
- *(Ports auto-assigned if specified port is taken)*

## 📝 Example: Complete Workflow

### Deploy a PyTorch Model

1. **Start Backend**:
```bash
source venv/bin/activate
python3 api_server.py
```

2. **Start Frontend** (new terminal):
```bash
cd /path/to/frontend
npm run dev
```

3. **Create a Simple Model** (for testing):
```python
# create_test_model.py
import torch
import torch.nn as nn

class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(4, 3)
    
    def forward(self, x):
        return self.fc(x)

model = SimpleModel()
torch.save(model.state_dict(), "test_model.pth")
print("Model saved as test_model.pth")
```

4. **Deploy via UI**:
   - Go to http://localhost:3000
   - Upload `test_model.pth`
   - Configure: Port 8001, Workers 2
   - Click Deploy

5. **Test Deployment**:
```bash
# Health check
curl http://localhost:8001/health

# Prediction
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"data": [[1.0, 2.0, 3.0, 4.0]]}'
```

## 🐛 Troubleshooting

### Backend Won't Start

**Problem**: Port 8000 already in use

**Solution**:
```bash
# Find process
lsof -i :8000

# Kill it
kill -9 <PID>

# Or change port in api_server.py
uvicorn.run(app, port=8001)
```

### Frontend Can't Connect to Backend

**Problem**: CORS errors or connection refused

**Solution**:
1. Ensure backend is running: `curl http://localhost:8000/health`
2. Check frontend API config (usually in `src/services/api.js`)
3. Verify CORS settings in `api_server.py`

### Deployment Fails

**Problem**: "Deployment failed to start"

**Possible Causes**:
1. **Port conflict**: Try different port or let it auto-assign
2. **Missing dependencies**: Check `requirements.txt`
3. **Invalid model file**: Verify `.pth` format
4. **Insufficient memory**: Reduce workers or free up RAM

**Debug**:
```bash
# Check logs
tail -f logs/<deployment_id>.log

# Check deployments
curl http://localhost:8000/api/deployments

# System resources
curl http://localhost:8000/api/system/info
```

### Model Server Not Responding

**Problem**: Can't access model endpoint

**Solution**:
```bash
# Check if process is running
curl http://localhost:8001/health

# Check deployment status
curl http://localhost:8000/api/deployments

# View process list
ps aux | grep python

# Check logs
tail -f logs/*.log
```

## 📊 Monitoring

### View Logs

```bash
# Backend logs
tail -f logs/api_server.log

# Deployment logs
tail -f logs/<deployment_id>.log

# All logs
tail -f logs/*.log
```

### System Resources

```bash
# Via API
curl http://localhost:8000/api/system/info | jq

# Via command line
htop  # or top
```

### Active Deployments

```bash
# List all
curl http://localhost:8000/api/deployments | jq

# Specific deployment
curl http://localhost:8000/api/deployments/<id> | jq
```

## 🔄 Development Workflow

### Making Changes

**Backend Changes**:
```bash
# api_server.py runs with auto-reload
# Just save your changes and it will restart
python3 api_server.py
```

**Frontend Changes**:
```bash
# Vite has hot-reload built-in
# Changes appear instantly in browser
npm run dev
```

### Testing

```bash
# Backend tests
python3 test_api.py

# Frontend (if you have tests)
npm run test
```

## 📦 Production Deployment

### Build Frontend

```bash
cd frontend
npm run build
```

Serve with nginx or any static file server.

### Run Backend as Service

Create systemd service (see `BACKEND_README.md` for details):

```bash
sudo systemctl enable model-deployment
sudo systemctl start model-deployment
```

## 🛑 Stopping Everything

```bash
# Stop backend (Ctrl+C in terminal)
# Or if running as service:
sudo systemctl stop model-deployment

# Stop frontend (Ctrl+C in terminal)

# Stop all model deployments
curl -X DELETE http://localhost:8000/api/deployments/<id>
```

## 📚 Next Steps

1. **Customize Model Server**: Edit `model_server_template.py`
2. **Add Authentication**: Implement API keys
3. **Enable GPU**: Configure CUDA in deployments
4. **Scale Up**: Deploy on multiple machines
5. **Monitor**: Set up logging and alerting

## 💡 Tips

1. **Keep backend running** while using the UI
2. **Test with small models** first
3. **Monitor memory usage** for multiple deployments
4. **Use 2-4 workers** for most models
5. **Check logs** when things go wrong
6. **Backup models** before deployment

## 🆘 Getting Help

1. Check logs: `logs/` directory
2. API docs: http://localhost:8000/docs
3. Test endpoints: `python3 test_api.py`
4. Verify health: `curl http://localhost:8000/health`
5. Review this guide and `BACKEND_README.md`

## ✅ Checklist

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] Backend setup completed (`./setup.sh`)
- [ ] Virtual environment activated
- [ ] Backend running (port 8000)
- [ ] Frontend dependencies installed
- [ ] Frontend running (port 3000)
- [ ] Test deployment successful
- [ ] API docs accessible

## 🎉 Success!

If you can access:
- ✅ http://localhost:8000/docs
- ✅ http://localhost:3000

**You're ready to deploy models!**

---

**Need Help?** Check `BACKEND_README.md` for detailed documentation.
