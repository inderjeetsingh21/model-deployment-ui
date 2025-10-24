# System Architecture & Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     http://localhost:3000                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP + WebSocket
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    REACT FRONTEND                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DeploymentWizard                                        │   │
│  │  ├── ModelSelection (Step 1)                            │   │
│  │  ├── HardwareConfig (Step 2)                            │   │
│  │  ├── DependencyManager (Step 3)                         │   │
│  │  ├── DeploymentConfig (Step 4)                          │   │
│  │  └── DeploymentSummary (Step 5)                         │   │
│  │                                                           │   │
│  │  DeploymentProgress                                      │   │
│  │  └── WebSocket Connection ◄──────────────────┐          │   │
│  └─────────────────────────────────────────────┼─┘          │   │
└────────────────────────────────────────────────┼────────────┘
                         │                        │
                         │ REST API              │ WebSocket
                         │                        │
┌────────────────────────▼────────────────────────▼──────────────┐
│                    FASTAPI BACKEND                              │
│                  http://localhost:8000                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Server (api_server.py)                              │  │
│  │  ├── POST /api/v1/deploy                                │  │
│  │  ├── GET  /api/v1/deployments                           │  │
│  │  ├── POST /api/v1/deployments/{id}/inference            │  │
│  │  └── WS   /api/v1/ws/{id}  ◄──────────────────┐         │  │
│  └──────────────────────┬───────────────────────┼─┘         │  │
│                          │                        │           │  │
│  ┌──────────────────────▼───────────────────────┼─────────┐ │  │
│  │  Deployment Service (deployment_service.py)   │         │ │  │
│  │  ├── deploy_model() ──┐                      │         │ │  │
│  │  ├── _download_model() │ Progress Callbacks ─┘         │ │  │
│  │  ├── _load_model()     │                                │ │  │
│  │  ├── _create_pipeline()│                                │ │  │
│  │  └── inference()       │                                │ │  │
│  └────────────────────────┼────────────────────────────────┘ │  │
│                            │                                   │  │
│  ┌────────────────────────▼────────────────────────────────┐ │  │
│  │  Configuration (config.py)                              │ │  │
│  │  └── Loads from .env file                               │ │  │
│  └──────────────────────────────────────────────────────────┘ │  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Downloads models
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    HUGGINGFACE HUB                               │
│                  https://huggingface.co                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Models Repository                                        │  │
│  │  ├── bert-base-uncased                                   │  │
│  │  ├── gpt2                                                 │  │
│  │  ├── distilbert-base-uncased-finetuned-sst-2-english    │  │
│  │  └── ... thousands more                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ Cached locally
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    LOCAL FILESYSTEM                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ./huggingface_cache/                                     │  │
│  │  └── models--distilbert-base.../                         │  │
│  │      ├── config.json                                      │  │
│  │      ├── model.safetensors                               │  │
│  │      └── tokenizer.json                                   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  ./deployed_models/                                       │  │
│  │  └── my-model/                                           │  │
│  │      └── metadata.json                                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  ./logs/                                                  │  │
│  │  └── deployment.log                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT SEQUENCE                            │
└─────────────────────────────────────────────────────────────────┘

1. USER INITIATES DEPLOYMENT
   ├── Fills in model configuration
   ├── Clicks "Deploy" button
   └── Frontend sends POST request

2. BACKEND RECEIVES REQUEST
   ├── Validates configuration
   ├── Creates deployment ID
   ├── Returns WebSocket URL
   └── Starts async deployment task

3. WEBSOCKET CONNECTION
   ├── Frontend connects to WebSocket
   ├── Backend sends real-time updates
   └── Progress: 0% → 10%

4. MODEL DOWNLOAD (10% → 55%)
   ├── Connect to HuggingFace Hub
   ├── Download model weights
   ├── Download tokenizer/processor
   ├── Download configuration
   ├── Cache locally
   └── Send progress updates every 5%

5. MODEL LOADING (55% → 60%)
   ├── Load from cache into memory
   ├── Move to selected device (CPU/GPU)
   ├── Set to evaluation mode
   └── Progress: 60%

6. PIPELINE CREATION (60% → 75%)
   ├── Create inference pipeline
   ├── Initialize tokenizer
   ├── Configure preprocessing
   └── Progress: 75%

7. SERVER STARTUP (75% → 85%)
   ├── Get available port (8100-8200)
   ├── Create API endpoint
   ├── Configure routes
   └── Progress: 85%

8. DEPLOYMENT COMPLETE (85% → 100%)
   ├── Register deployment
   ├── Generate usage examples
   ├── Send final status
   └── Progress: 100%

9. FRONTEND DISPLAYS RESULT
   ├── Show success message
   ├── Display endpoint URL
   ├── Show usage examples
   └── Provide test links
```

## WebSocket Progress Updates

```
Time    | Status        | Progress | Message
--------|---------------|----------|----------------------------------
0:00    | initializing  | 0%       | Starting deployment...
0:01    | validating    | 10%      | Validating configuration...
0:02    | downloading   | 15%      | Downloading model from HF Hub...
0:15    | downloading   | 25%      | Downloading model components...
0:30    | downloading   | 35%      | Downloading tokenizer...
1:00    | downloading   | 45%      | Download in progress...
1:30    | downloading   | 55%      | Model downloaded successfully!
1:35    | loading       | 60%      | Loading model into memory...
1:40    | creating      | 75%      | Creating inference pipeline...
1:42    | starting      | 85%      | Starting model inference server...
1:45    | completed     | 100%     | Deployed! Available at http://...
```

## Configuration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   CONFIGURATION SYSTEM                           │
└─────────────────────────────────────────────────────────────────┘

.env file
   │
   ├─── BACKEND_PORT=8000
   ├─── FRONTEND_PORT=3000
   ├─── MAX_DOWNLOAD_TIMEOUT=1800
   ├─── MODEL_STORAGE_PATH=./deployed_models
   └─── ... (20+ more settings)
   │
   ▼
config.py loads and validates
   │
   ├─── Type conversion (str → int, str → bool)
   ├─── Default values if missing
   ├─── Path creation
   └─── Exports config object
   │
   ▼
Used throughout application
   │
   ├─── api_server.py
   │    └── Uses config.BACKEND_PORT
   │
   ├─── deployment_service.py
   │    └── Uses config.MAX_DOWNLOAD_TIMEOUT
   │
   └─── vite.config.js
        └── Uses env.FRONTEND_PORT

Result: Single source of truth, easy to modify
```

## Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              INFERENCE REQUEST FLOW                              │
└─────────────────────────────────────────────────────────────────┘

User sends request:
POST http://localhost:8100/predict
{
  "text": "I love this product!"
}
   │
   ▼
API endpoint receives request
   │
   ├─── Validates input
   ├─── Finds deployment by ID
   └─── Calls inference()
   │
   ▼
Deployment Service
   │
   ├─── Gets model pipeline
   ├─── Preprocesses input
   ├─── Runs inference (with timeout)
   └─── Postprocesses output
   │
   ▼
Model processes input
   │
   ├─── Tokenizes text
   ├─── Generates embedding
   ├─── Runs through neural network
   ├─── Produces prediction
   └─── Returns logits/scores
   │
   ▼
Response formatted and returned
{
  "status": "success",
  "result": [
    {
      "label": "POSITIVE",
      "score": 0.9998
    }
  ],
  "deployment_id": "my-model",
  "inference_time_ms": 45
}
```

## File Organization

```
model-deployment-improved/
│
├── Configuration Layer
│   ├── .env                    ← All settings
│   └── .env.example           ← Template
│
├── Documentation Layer
│   ├── README.md              ← Main guide
│   ├── QUICKSTART.md          ← Fast setup
│   ├── DEPLOYMENT_GUIDE.md    ← Deep dive
│   ├── CHANGELOG.md           ← Changes
│   └── IMPLEMENTATION_SUMMARY.md ← Overview
│
├── Backend Layer
│   └── backend/
│       ├── config.py          ← Config loader
│       ├── deployment_service.py ← Business logic
│       ├── api_server.py      ← API endpoints
│       └── requirements.txt   ← Dependencies
│
├── Frontend Layer
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeploymentWizard.jsx
│   │   │   ├── DeploymentProgress.jsx
│   │   │   └── ... (step components)
│   │   └── styles/
│   │       └── App.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── Storage Layer
    ├── huggingface_cache/     ← Downloaded models
    ├── deployed_models/       ← Deployment metadata
    └── logs/                  ← Application logs
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      TECHNOLOGY STACK                            │
└─────────────────────────────────────────────────────────────────┘

Frontend:
├── React 18           ← UI framework
├── Vite               ← Build tool
├── Axios              ← HTTP client
├── WebSocket API      ← Real-time updates
└── CSS3               ← Styling

Backend:
├── Python 3.9+        ← Programming language
├── FastAPI            ← Web framework
├── Uvicorn            ← ASGI server
├── PyTorch            ← Deep learning framework
├── Transformers       ← HuggingFace library
├── asyncio            ← Async operations
└── python-dotenv      ← Config management

Communication:
├── REST API           ← HTTP endpoints
├── WebSocket          ← Real-time bidirectional
└── JSON               ← Data format

Infrastructure:
├── HuggingFace Hub    ← Model repository
├── Local filesystem   ← Caching
└── In-memory          ← Active models
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

1. Input Validation
   ├── API request validation (Pydantic)
   ├── Model ID validation
   └── Parameter sanitization

2. Resource Limits
   ├── MAX_MODEL_SIZE_GB
   ├── MAX_MEMORY_PER_MODEL_GB
   ├── Timeout protection
   └── Port range restrictions

3. CORS Configuration
   ├── Allowed origins in .env
   ├── Configurable per environment
   └── Credential handling

4. Optional API Key
   ├── API_KEY_ENABLED flag
   ├── Header-based authentication
   └── Request validation

5. Error Handling
   ├── Sanitized error messages
   ├── No stack traces to client
   └── Detailed logging server-side
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE FACTORS                           │
└─────────────────────────────────────────────────────────────────┘

Model Download:
├── First time: Depends on model size + internet speed
│   └── distilbert: ~268MB = 1-2 minutes
├── Subsequent: INSTANT (cached)
└── Configurable timeout prevents issues

Model Loading:
├── CPU: Slower, uses RAM
├── GPU: Faster, uses VRAM
└── Automatic device selection

Inference:
├── CPU: 50-500ms per request
├── GPU: 5-50ms per request
└── Depends on model size and input

Concurrent Requests:
├── Async handling via FastAPI
├── Max workers configurable
└── Queue management

Caching:
├── Models cached permanently
├── Redeployment = instant
└── Shared cache across deployments
```

## Monitoring Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONITORING POINTS                            │
└─────────────────────────────────────────────────────────────────┘

Application Logs:
├── ./logs/deployment.log
├── Deployment events
├── Error tracking
└── Performance metrics

WebSocket Status:
├── Connection state
├── Message throughput
├── Error rate
└── Latency

Deployment Status:
├── Active deployments count
├── Resource usage per model
├── Inference request count
└── Average response time

System Resources:
├── CPU usage
├── Memory consumption
├── Disk space
└── Network I/O
```

---

This architecture ensures:
- ✅ Scalability
- ✅ Reliability
- ✅ Maintainability
- ✅ Performance
- ✅ Security
- ✅ Observability
