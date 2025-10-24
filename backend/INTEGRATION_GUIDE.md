# 🔗 Integration Guide: Connecting Backend to Your Frontend

This guide shows you how to integrate the new backend API with your existing `model-deployment-ui` frontend.

## 📁 File Structure

After integration, your project should look like this:

```
model-deployment-ui/
├── frontend/                    # Your existing React frontend
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js          # ← Update this file
│   │   ├── components/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # New backend directory
│   ├── api_server.py           # Main API server
│   ├── model_server_template.py
│   ├── requirements.txt
│   ├── setup.sh
│   ├── test_api.py
│   ├── deployed_models/        # Auto-created
│   ├── uploads/                # Auto-created
│   ├── logs/                   # Auto-created
│   └── venv/                   # Auto-created
│
├── QUICKSTART.md
├── BACKEND_README.md
└── docker-compose.yml          # Optional
```

## 🔧 Step-by-Step Integration

### Step 1: Organize Your Files

```bash
# Create backend directory
mkdir -p backend

# Move backend files
mv api_server.py backend/
mv model_server_template.py backend/
mv requirements.txt backend/
mv setup.sh backend/
mv test_api.py backend/
mv Dockerfile backend/
mv .dockerignore backend/
mv .env.example backend/
mv Makefile backend/

# Your frontend stays in place
cd model-deployment-ui  # Your existing frontend repo
```

### Step 2: Setup Backend

```bash
cd backend

# Run setup
chmod +x setup.sh
./setup.sh

# Activate virtual environment
source venv/bin/activate

# Start backend
python3 api_server.py
```

Expected output:
```
==================================================
AI Model Deployment Server Started
==================================================
Server running on: http://localhost:8000
API Documentation: http://localhost:8000/docs
==================================================
```

### Step 3: Update Frontend API Configuration

Open your frontend's API service file (usually `src/services/api.js`) and ensure it points to the backend:

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Upload model
export const uploadModel = async (file, modelName) => {
  const formData = new FormData();
  formData.append('file', file);
  if (modelName) formData.append('model_name', modelName);

  return await api.post('/api/upload-model', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Deploy model
export const deployModel = async (config) => {
  return await api.post('/api/deploy', config);
};

// Get deployments
export const getDeployments = async () => {
  return await api.get('/api/deployments');
};

// Get specific deployment
export const getDeployment = async (deploymentId) => {
  return await api.get(`/api/deployments/${deploymentId}`);
};

// Stop deployment
export const stopDeployment = async (deploymentId) => {
  return await api.delete(`/api/deployments/${deploymentId}`);
};

// System info
export const getSystemInfo = async () => {
  return await api.get('/api/system/info');
};

// Health check
export const healthCheck = async () => {
  return await api.get('/health');
};

// WebSocket connection
export const createWebSocket = () => {
  const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
  return new WebSocket(wsUrl);
};

export default api;
```

### Step 4: Update Frontend Environment Variables

Create or update `.env` in your frontend directory:

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

### Step 5: Start Frontend

```bash
cd ../  # Back to frontend directory
npm run dev
```

## 🧪 Testing the Integration

### Test 1: Health Check

```bash
# Backend health
curl http://localhost:8000/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2024-10-23T...",
#   "system": {...},
#   "deployments": 0
# }
```

### Test 2: Frontend Connection

1. Open browser: http://localhost:3000
2. Open browser console (F12)
3. Should see no CORS errors
4. Upload form should be visible

### Test 3: Full Workflow

1. **Upload Model**:
   - Click upload button in UI
   - Select a `.pth` file
   - Check console for success message

2. **Deploy Model**:
   - Fill deployment form:
     - Model Name: "test_model"
     - API Type: REST
     - Port: 8001
     - Workers: 2
   - Click Deploy
   - Wait for success notification

3. **Verify Deployment**:
```bash
# Check backend
curl http://localhost:8000/api/deployments

# Test deployed model
curl http://localhost:8001/health
```

4. **Make Prediction**:
```bash
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"data": [[1.0, 2.0, 3.0, 4.0]]}'
```

## 🔄 WebSocket Integration

If your frontend uses WebSocket for real-time updates:

```javascript
// In your React component
import { useEffect, useState } from 'react';
import { createWebSocket } from '../services/api';

function DeploymentMonitor() {
  const [updates, setUpdates] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = createWebSocket();
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Update received:', data);
      
      setUpdates(prev => [...prev, data]);
      
      // Handle different update types
      if (data.type === 'deployment_started') {
        // Update UI for new deployment
      } else if (data.type === 'deployment_stopped') {
        // Update UI for stopped deployment
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  return (
    <div>
      <h2>Real-time Updates</h2>
      {updates.map((update, idx) => (
        <div key={idx}>{JSON.stringify(update)}</div>
      ))}
    </div>
  );
}
```

## 📝 Frontend Component Example

Example deployment component integration:

```javascript
// components/DeploymentWizard.jsx
import { useState } from 'react';
import { uploadModel, deployModel } from '../services/api';

function DeploymentWizard() {
  const [file, setFile] = useState(null);
  const [modelName, setModelName] = useState('');
  const [config, setConfig] = useState({
    port: 8001,
    workers: 4,
    api_type: 'REST',
    target: 'Local Process',
    framework: 'pytorch',
  });
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const response = await uploadModel(file, modelName);
      console.log('Upload success:', response.data);
      alert('Model uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!modelName) return;
    
    setLoading(true);
    try {
      const response = await deployModel({
        model_name: modelName,
        ...config,
      });
      console.log('Deploy success:', response.data);
      alert(`Model deployed on port ${response.data.port}!`);
    } catch (error) {
      console.error('Deploy failed:', error);
      alert('Deploy failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deployment-wizard">
      <h2>Deploy Model</h2>
      
      <div className="upload-section">
        <input
          type="file"
          accept=".pth,.pt"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <input
          type="text"
          placeholder="Model Name"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
        />
        <button onClick={handleUpload} disabled={loading || !file}>
          Upload Model
        </button>
      </div>

      <div className="config-section">
        <label>
          Port:
          <input
            type="number"
            value={config.port}
            onChange={(e) => setConfig({...config, port: parseInt(e.target.value)})}
          />
        </label>
        
        <label>
          Workers:
          <input
            type="number"
            value={config.workers}
            onChange={(e) => setConfig({...config, workers: parseInt(e.target.value)})}
          />
        </label>

        <button onClick={handleDeploy} disabled={loading || !modelName}>
          Deploy Model
        </button>
      </div>
    </div>
  );
}

export default DeploymentWizard;
```

## 🚨 Common Issues & Fixes

### Issue 1: CORS Error

**Error**: "Access-Control-Allow-Origin" header missing

**Fix**: The backend already has CORS enabled for all origins in development. For production, update:

```python
# api_server.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 2: Connection Refused

**Error**: "Failed to fetch" or "Network Error"

**Fix**:
1. Ensure backend is running: `curl http://localhost:8000/health`
2. Check frontend API URL in `.env`
3. Verify no firewall blocking port 8000

### Issue 3: Deployment Fails

**Error**: "Deployment failed to start"

**Fix**:
1. Check backend logs: `tail -f backend/logs/*.log`
2. Verify model file uploaded correctly
3. Check system resources: `curl http://localhost:8000/api/system/info`
4. Try different port or let it auto-assign

### Issue 4: WebSocket Won't Connect

**Error**: WebSocket connection failed

**Fix**:
1. Verify WebSocket URL: should be `ws://` not `wss://` for local
2. Check backend is running
3. Test manually: `wscat -c ws://localhost:8000/ws`

## 🎯 Production Checklist

Before deploying to production:

- [ ] Set specific CORS origins (not `*`)
- [ ] Add authentication/API keys
- [ ] Use HTTPS and WSS
- [ ] Set up proper logging
- [ ] Configure firewall rules
- [ ] Set resource limits
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Set up monitoring/alerts
- [ ] Configure backup strategy

## 📦 Deployment Options

### Option 1: Separate Processes (Development)

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python3 api_server.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Option 2: Docker Compose (Recommended)

```bash
# Start both services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 3: Production with Nginx

```nginx
# /etc/nginx/sites-available/model-deployment
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/model-deployment/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## ✅ Verification

After integration, verify everything works:

```bash
# 1. Backend health
curl http://localhost:8000/health

# 2. Frontend accessible
curl http://localhost:3000

# 3. API docs
open http://localhost:8000/docs

# 4. Run full test
cd backend
python3 test_api.py
```

## 🎉 Success!

If all tests pass, you now have:
- ✅ Working backend API on port 8000
- ✅ Working frontend UI on port 3000
- ✅ Real-time WebSocket updates
- ✅ Model deployment capabilities
- ✅ Monitoring and management

**You're ready to deploy AI models!**

---

For detailed documentation:
- Backend: See `BACKEND_README.md`
- Quick Start: See `QUICKSTART.md`
- Troubleshooting: Check logs in `backend/logs/`
