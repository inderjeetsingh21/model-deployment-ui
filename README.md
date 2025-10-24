# PyTorch Model Deployment Platform v2.0

A production-ready web platform for automated deployment of PyTorch models from HuggingFace Hub with real-time progress tracking and comprehensive API support.

![Platform Screenshot](screenshot.png)

## 🎯 What This Platform Does

This platform automates the entire process of deploying PyTorch models:

### During Deployment:
1. **Downloads** the model from HuggingFace Hub
2. **Caches** model files locally for faster future access
3. **Loads** the model into memory (GPU/CPU)
4. **Creates** an inference API endpoint
5. **Monitors** the entire process with real-time progress updates

### After Deployment:
- Your model is **running** and ready to accept inference requests
- You get a **REST API endpoint** to send predictions
- Complete **usage examples** in cURL and Python
- Access to **API documentation** via Swagger UI
- Ability to manage and monitor all deployed models

## 🚀 Key Features

- ✅ **No Timeout Issues** - Proper async handling with configurable timeouts
- ✅ **Real-time Progress** - WebSocket-based progress updates
- ✅ **Centralized Configuration** - All settings in `.env` file
- ✅ **Clear Documentation** - Comprehensive guides and examples
- ✅ **Multiple Model Types** - Support for NLP, Vision, Audio, and Multimodal
- ✅ **Automatic Dependency Management** - No manual configuration needed
- ✅ **Production Ready** - Error handling, logging, and monitoring

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- 4GB+ RAM (8GB+ recommended)
- 20GB+ free disk space
- Internet connection for model downloads

## 🛠️ Installation

### 1. Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp ../.env.example ../.env

# Edit .env file to customize settings (optional)
nano ../.env
```

### 2. Setup Frontend

```bash
# Navigate to project root
cd ..

# Install frontend dependencies
npm install

# Copy .env if not done
cp .env.example .env
```

### 3. Start the Services

#### Start Backend (Terminal 1):
```bash
cd backend
source venv/bin/activate
python -m backend.api_server
```

Backend will start on: `http://localhost:8000`
API Docs available at: `http://localhost:8000/docs`

#### Start Frontend (Terminal 2):
```bash
npm run dev
```

Frontend will start on: `http://localhost:3000`

## 📚 Configuration Guide

All configuration is centralized in the `.env` file. Here are the key settings:

### Server Ports
```env
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

### Storage Locations
```env
MODEL_STORAGE_PATH=./deployed_models
TEMP_MODEL_PATH=./temp_models
HUGGINGFACE_CACHE_DIR=./huggingface_cache
```

### Timeout Settings
```env
MAX_DOWNLOAD_TIMEOUT=1800  # 30 minutes for model download
MODEL_INFERENCE_TIMEOUT=120  # 2 minutes for inference
```

### Model Serving Ports
```env
MODEL_SERVE_PORT_START=8100
MODEL_SERVE_PORT_END=8200
```

These settings control which ports are used for deployed models. Adjust based on your needs.

## 🎓 How to Use the Platform

### Step-by-Step Deployment Guide

#### 1. Access the Platform
Open http://localhost:3000 in your browser

#### 2. Model Configuration (Step 1)
- **Model Source**: Select "HuggingFace Hub"
- **Model ID**: Enter a model identifier from HuggingFace
  - Examples:
    - `bert-base-uncased` (Text Classification)
    - `gpt2` (Text Generation)
    - `facebook/opt-125m` (Large Language Model)
    - `distilbert-base-uncased-finetuned-sst-2-english` (Sentiment Analysis)
- **Model Type**: Select the appropriate type (NLP/Text, Computer Vision, Audio, Multimodal)
- **Deployment Name**: Give your deployment a unique name (e.g., `my-sentiment-model`)

#### 3. Hardware Configuration (Step 2)
- Select compute device:
  - **Auto**: Automatically detects and uses best available device
  - **CUDA (GPU)**: Use NVIDIA GPU if available
  - **CPU**: Use CPU for inference

#### 4. Dependencies (Step 3)
- All dependencies are automatically managed
- No manual configuration required

#### 5. Review Settings (Step 4)
- Review all configuration before deployment

#### 6. Summary and Deploy (Step 5)
- Review complete deployment summary
- Click "Deploy" to start the deployment

#### 7. Monitor Progress
- Watch real-time progress updates via WebSocket
- See each deployment step as it completes:
  1. Configuration validation
  2. Model download from HuggingFace
  3. Model loading
  4. Pipeline creation
  5. Server startup
  6. Deployment complete!

## 🧪 Testing Deployed Models

Once your model is deployed, you have several ways to test it:

### 1. Using cURL

```bash
# For NLP models
curl -X POST http://localhost:8100/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, how are you?"}'

# The exact endpoint URL is provided in the deployment result
```

### 2. Using Python

```python
import requests

# Replace with your actual endpoint URL
endpoint = "http://localhost:8100/predict"

# For NLP models
response = requests.post(
    endpoint,
    json={"text": "This product is amazing!"}
)

print(response.json())
```

### 3. Using the API Documentation

1. Open http://localhost:8000/docs
2. Find your deployment endpoint
3. Click "Try it out"
4. Enter test data
5. Execute the request

### 4. Using the Test Interface (Coming Soon)

The platform provides a built-in test interface accessible after deployment.

## 📖 Understanding Model Deployments

### What Happens During Deployment?

1. **Model Download**
   - Platform connects to HuggingFace Hub
   - Downloads model weights, configuration, and tokenizer
   - Files are cached in `HUGGINGFACE_CACHE_DIR` (default: `./huggingface_cache`)
   - Future deployments of the same model are much faster!

2. **Model Loading**
   - Model is loaded into memory (RAM or VRAM)
   - Appropriate device (CPU/GPU) is selected
   - Model is set to evaluation mode for inference

3. **Pipeline Creation**
   - Inference pipeline is created based on model type
   - Tokenizers and processors are initialized
   - Input/output handling is configured

4. **Server Startup**
   - REST API endpoint is created
   - Port is assigned from available pool
   - Health checks are configured
   - Ready to accept requests!

### Model File Locations

After deployment, you can find model files at:

```
./
├── huggingface_cache/          # Downloaded model files
│   ├── models--bert-base-uncased/
│   ├── models--gpt2/
│   └── ...
├── deployed_models/            # Deployment metadata
│   └── my-model/
└── logs/                       # Application logs
```

### Resource Usage

- **Storage**: Models range from 100MB to several GB
- **Memory**: Loaded models consume RAM/VRAM based on size
- **CPU/GPU**: Used during inference requests

## 🔧 API Reference

### Deploy Model
```
POST /api/v1/deploy
Content-Type: application/json

{
  "model": {
    "model_id": "bert-base-uncased",
    "model_source": "huggingface"
  },
  "model_type": "nlp",
  "deployment_name": "my-model",
  "hardware": {
    "device": "auto"
  },
  "dependencies": {
    "packages": []
  }
}
```

### WebSocket Progress Updates
```
ws://localhost:8000/api/v1/ws/{deployment_id}

Messages:
{
  "status": "downloading",
  "progress": 45,
  "message": "Downloading model...",
  "current_step": "Model download",
  "completed_steps": 2,
  "total_steps": 6
}
```

### Run Inference
```
POST /api/v1/deployments/{deployment_id}/inference
Content-Type: application/json

{
  "text": "Your input text here"
}
```

### List Deployments
```
GET /api/v1/deployments

Response:
{
  "status": "success",
  "count": 3,
  "deployments": [...]
}
```

### Get Deployment Details
```
GET /api/v1/deployments/{deployment_id}
```

### Delete Deployment
```
DELETE /api/v1/deployments/{deployment_id}
```

## 🐛 Troubleshooting

### Deployment Timeouts
- **Problem**: Model download times out
- **Solution**: Increase `MAX_DOWNLOAD_TIMEOUT` in `.env`
- **Note**: Large models (>5GB) may need 30+ minutes

### WebSocket Connection Issues
- **Problem**: Progress updates not showing
- **Solution**: Check backend is running and CORS settings
- **Note**: WebSocket URL uses same host as frontend

### Out of Memory Errors
- **Problem**: Model too large for available RAM/VRAM
- **Solution**: 
  - Use smaller model
  - Increase system memory
  - Use CPU instead of GPU
  - Adjust `MAX_MEMORY_PER_MODEL_GB` in `.env`

### Port Already in Use
- **Problem**: Cannot start backend/frontend
- **Solution**: Change ports in `.env`
  ```env
  BACKEND_PORT=8001
  FRONTEND_PORT=3001
  ```

### Model Not Found
- **Problem**: HuggingFace model ID invalid
- **Solution**: 
  - Verify model exists on HuggingFace Hub
  - Check model ID spelling
  - Some models require HF token (set `HUGGINGFACE_TOKEN`)

## 📊 Example Models to Try

### Text Generation
- `gpt2` - Small GPT-2 model
- `facebook/opt-125m` - OPT language model
- `EleutherAI/gpt-neo-125M` - GPT-Neo model

### Sentiment Analysis
- `distilbert-base-uncased-finetuned-sst-2-english`
- `cardiffnlp/twitter-roberta-base-sentiment`

### Question Answering
- `deepset/roberta-base-squad2`
- `distilbert-base-cased-distilled-squad`

### Text Classification
- `bert-base-uncased`
- `distilbert-base-uncased`

## 🔒 Security Considerations

- Set `API_KEY_ENABLED=true` in `.env` for production
- Configure firewall rules for exposed ports
- Use HTTPS in production (configure reverse proxy)
- Restrict CORS origins in `.env`
- Keep dependencies updated

## 📈 Performance Tips

1. **Use GPU** when available for faster inference
2. **Cache models** - redeploying same model is instant
3. **Adjust workers** - increase `MAX_WORKERS` for concurrent requests
4. **Monitor resources** - use `ENABLE_METRICS=true`
5. **Use smaller models** when possible for faster loading

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review API documentation at `/docs`

## 🎉 Acknowledgments

- HuggingFace for the transformers library and model hub
- FastAPI for the excellent API framework
- React and Vite for the frontend framework
