# 🚀 AI Model Deployment Backend API

Complete FastAPI backend server for deploying and managing PyTorch models locally.

## 📋 Features

- ✅ **Model Upload & Management** - Upload PyTorch models via REST API
- ✅ **Dynamic Port Allocation** - Automatically finds available ports
- ✅ **Multi-Worker Support** - Configure workers for parallel processing
- ✅ **Real-time Monitoring** - WebSocket support for live updates
- ✅ **System Resources** - Monitor CPU, memory, and disk usage
- ✅ **Auto-generated Servers** - Creates FastAPI servers for each model
- ✅ **Process Management** - Start, stop, and monitor deployments
- ✅ **Dependency Management** - Install model-specific dependencies

## 🛠️ Quick Start

### Prerequisites

- Python 3.9+
- pip
- 4GB+ RAM recommended

### Installation

#### Option 1: Automated Setup (Recommended)

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh

# Activate virtual environment
source venv/bin/activate

# Start server
python3 api_server.py
```

#### Option 2: Manual Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create directories
mkdir -p deployed_models uploads logs

# Start server
python3 api_server.py
```

### Start the Server

```bash
# Development mode (with auto-reload)
python3 api_server.py

# Production mode with uvicorn
uvicorn api_server:app --host 0.0.0.0 --port 8000 --workers 4
```

Server will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 📡 API Endpoints

### Core Endpoints

#### Health Check
```bash
GET /health
```
Returns server health status and system information.

```bash
curl http://localhost:8000/health
```

#### System Information
```bash
GET /api/system/info
```
Returns CPU, memory, and disk usage.

### Model Management

#### Upload Model
```bash
POST /api/upload-model
Content-Type: multipart/form-data

Parameters:
- file: Model file (required)
- model_name: Custom name (optional)
```

Example:
```bash
curl -X POST http://localhost:8000/api/upload-model \
  -F "file=@model.pth" \
  -F "model_name=my_model"
```

#### Deploy Model
```bash
POST /api/deploy
Content-Type: application/json

Body:
{
  "model_name": "my_model",
  "api_type": "REST",
  "port": 8001,
  "workers": 4,
  "target": "Local Process",
  "framework": "pytorch",
  "dependencies": ["torch", "torchvision"]
}
```

Example:
```bash
curl -X POST http://localhost:8000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "my_model",
    "port": 8001,
    "workers": 4
  }'
```

Response:
```json
{
  "success": true,
  "message": "Deployment started successfully",
  "deployment_id": "abc12345",
  "port": 8001,
  "status": "running",
  "endpoint": "http://localhost:8001"
}
```

#### List Deployments
```bash
GET /api/deployments
```

Example:
```bash
curl http://localhost:8000/api/deployments
```

Response:
```json
{
  "deployments": [
    {
      "deployment_id": "abc12345",
      "model_name": "my_model",
      "port": 8001,
      "status": "running",
      "created_at": "2024-10-23T10:30:00",
      "pid": 12345
    }
  ],
  "count": 1
}
```

#### Get Deployment Details
```bash
GET /api/deployments/{deployment_id}
```

Example:
```bash
curl http://localhost:8000/api/deployments/abc12345
```

#### Stop Deployment
```bash
DELETE /api/deployments/{deployment_id}
```

Example:
```bash
curl -X DELETE http://localhost:8000/api/deployments/abc12345
```

### WebSocket

#### Real-time Updates
```bash
WS /ws
```

Connect to receive real-time deployment updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

## 🔧 Model Server API

Each deployed model gets its own FastAPI server with these endpoints:

### Deployed Model Endpoints

Once a model is deployed (e.g., on port 8001):

#### Model Info
```bash
GET http://localhost:8001/
```

#### Health Check
```bash
GET http://localhost:8001/health
```

#### Make Prediction
```bash
POST http://localhost:8001/predict
Content-Type: application/json

Body:
{
  "data": [[1.0, 2.0, 3.0, 4.0]]
}
```

Example:
```bash
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "data": [[5.1, 3.5, 1.4, 0.2]]
  }'
```

Response:
```json
{
  "predictions": [0.1, 0.7, 0.2],
  "model": "my_model",
  "device": "cpu",
  "inference_time_ms": 12.34
}
```

#### Model Information
```bash
GET http://localhost:8001/model/info
```

#### Reload Model
```bash
POST http://localhost:8001/model/reload
```

## 📁 Directory Structure

```
.
├── api_server.py              # Main API server
├── model_server_template.py   # Template for model servers
├── requirements.txt           # Python dependencies
├── setup.sh                   # Setup script
├── deployed_models/           # Deployed model instances
│   └── model_name_id/
│       ├── model_server.py
│       └── venv/
├── uploads/                   # Uploaded model files
└── logs/                      # Server logs
```

## 🔍 Configuration

### Environment Variables

Create a `.env` file:

```bash
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
RELOAD=True

# Model Configuration
DEFAULT_WORKERS=4
DEFAULT_PORT_START=8001

# Directories
MODELS_DIR=deployed_models
UPLOADS_DIR=uploads
LOGS_DIR=logs
```

### Port Configuration

The server automatically finds available ports starting from 8001. You can specify a preferred port in the deployment config:

```python
{
  "port": 8001,  # Preferred port
  # ... other config
}
```

If the port is taken, it will automatically use the next available port.

## 🐛 Troubleshooting

### Port Already in Use

If you get "Address already in use" error:

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Dependencies Not Installing

```bash
# Upgrade pip
pip install --upgrade pip

# Install with verbose output
pip install -r requirements.txt -v
```

### Virtual Environment Issues

```bash
# Remove old venv
rm -rf venv

# Create new one
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Model Won't Load

1. Check model file format (should be .pth or .pt)
2. Verify PyTorch version compatibility
3. Check logs in `logs/` directory
4. Ensure sufficient memory

### WebSocket Connection Failed

```bash
# Check if server is running
curl http://localhost:8000/health

# Test WebSocket
wscat -c ws://localhost:8000/ws
```

## 📊 Monitoring

### View Logs

```bash
# Main server logs
tail -f logs/api_server.log

# Specific deployment logs
tail -f logs/<deployment_id>.log
```

### Check System Resources

```bash
curl http://localhost:8000/api/system/info
```

## 🔐 Security Considerations

For production deployments:

1. **Authentication**: Add API key authentication
2. **HTTPS**: Use SSL/TLS certificates
3. **Firewall**: Restrict ports
4. **CORS**: Configure allowed origins
5. **Rate Limiting**: Add request throttling
6. **Input Validation**: Validate model inputs

Example CORS configuration:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)
```

## 🚀 Production Deployment

### Using systemd

Create `/etc/systemd/system/model-deployment.service`:

```ini
[Unit]
Description=Model Deployment API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/project
Environment="PATH=/path/to/project/venv/bin"
ExecStart=/path/to/project/venv/bin/python api_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable model-deployment
sudo systemctl start model-deployment
sudo systemctl status model-deployment
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "api_server.py"]
```

Build and run:

```bash
docker build -t model-deployment-api .
docker run -p 8000:8000 -v $(pwd)/deployed_models:/app/deployed_models model-deployment-api
```

## 📝 Example: Complete Workflow

1. **Start Backend**:
```bash
source venv/bin/activate
python3 api_server.py
```

2. **Upload Model**:
```bash
curl -X POST http://localhost:8000/api/upload-model \
  -F "file=@my_model.pth" \
  -F "model_name=classifier"
```

3. **Deploy Model**:
```bash
curl -X POST http://localhost:8000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "classifier",
    "port": 8001,
    "workers": 2
  }'
```

4. **Test Deployment**:
```bash
# Check health
curl http://localhost:8001/health

# Make prediction
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"data": [[1.0, 2.0, 3.0, 4.0]]}'
```

5. **Monitor**:
```bash
# List all deployments
curl http://localhost:8000/api/deployments

# Get specific deployment
curl http://localhost:8000/api/deployments/abc12345
```

6. **Stop Deployment**:
```bash
curl -X DELETE http://localhost:8000/api/deployments/abc12345
```

## 🤝 Integration with Frontend

The backend works seamlessly with your React frontend. Make sure your frontend's API configuration points to:

```javascript
// In your frontend config
const API_BASE_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PyTorch Documentation](https://pytorch.org/docs/)
- [Uvicorn Documentation](https://www.uvicorn.org/)

## 💡 Tips

1. **Test with demo models first** before deploying production models
2. **Monitor resource usage** - each deployment consumes memory
3. **Use appropriate worker counts** - typically 2x CPU cores
4. **Keep logs** for debugging deployment issues
5. **Backup models** before deployment

## 🐞 Common Issues

| Issue | Solution |
|-------|----------|
| Model won't load | Check PyTorch version and model format |
| Port conflict | Server auto-assigns next available port |
| Out of memory | Reduce workers or deploy smaller models |
| Slow predictions | Enable GPU if available, reduce batch size |
| WebSocket drops | Check firewall settings |

## 📞 Support

For issues:
1. Check logs in `logs/` directory
2. Review error messages in terminal
3. Test with `/health` endpoint
4. Verify all dependencies are installed

---

**Built with FastAPI, PyTorch, and ❤️**
