"""
Enhanced PyTorch Model Server Template
This template can load and serve actual PyTorch models
"""
from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
import torch
import torch.nn as nn
import uvicorn
from typing import Dict, Any, List, Optional
import json
import base64
from io import BytesIO
from pathlib import Path
import numpy as np

# Configuration (will be replaced during deployment)
MODEL_NAME = "{{MODEL_NAME}}"
PORT = {{PORT}}
WORKERS = {{WORKERS}}
MODEL_PATH = "{{MODEL_PATH}}"

app = FastAPI(
    title=f"{MODEL_NAME} API",
    description="PyTorch Model Inference Server",
    version="1.0.0"
)

# Global model variable
model = None
device = "cuda" if torch.cuda.is_available() else "cpu"


class PredictionRequest(BaseModel):
    """Request model for predictions"""
    data: List[List[float]] = []  # For numeric input
    text: Optional[str] = None  # For text input
    image_base64: Optional[str] = None  # For image input
    batch: Optional[List[Dict[str, Any]]] = None  # For batch predictions


class PredictionResponse(BaseModel):
    """Response model for predictions"""
    predictions: Any
    model: str
    device: str
    inference_time_ms: float


def load_model():
    """Load the PyTorch model"""
    global model
    
    try:
        # Try to load the model
        if Path(MODEL_PATH).exists():
            # Load state dict
            state_dict = torch.load(MODEL_PATH, map_location=device)
            
            # If it's just the state dict, you need to define the model architecture
            # For now, we'll assume it's a complete model
            if isinstance(state_dict, dict) and 'state_dict' in state_dict:
                # Model saved with metadata
                model = state_dict.get('model', None)
                if model is None:
                    print("Warning: Model architecture not found, using state_dict only")
                    # You would need to define your model architecture here
                    pass
            else:
                # Direct model load
                model = torch.load(MODEL_PATH, map_location=device)
            
            if model is not None:
                model.to(device)
                model.eval()
                print(f"✓ Model loaded successfully on {device}")
        else:
            print(f"Warning: Model file not found at {MODEL_PATH}")
            print("Server will run in demo mode")
    
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Server will run in demo mode")
        model = None


@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    print("=" * 60)
    print(f"Starting {MODEL_NAME} Model Server")
    print("=" * 60)
    print(f"Port: {PORT}")
    print(f"Device: {device}")
    print(f"Workers: {WORKERS}")
    load_model()
    print("=" * 60)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "model": MODEL_NAME,
        "status": "running",
        "device": device,
        "model_loaded": model is not None,
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "info": "/model/info",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": device,
        "gpu_available": torch.cuda.is_available()
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make predictions using the model"""
    import time
    start_time = time.time()
    
    try:
        if model is None:
            # Demo mode - return sample predictions
            predictions = {
                "message": "Running in DEMO mode - no model loaded",
                "sample_prediction": [0.1, 0.7, 0.2],
                "note": "Load a real model to get actual predictions"
            }
        else:
            # Actual prediction
            with torch.no_grad():
                # Process input based on type
                if request.data:
                    # Numeric data
                    input_tensor = torch.tensor(request.data, dtype=torch.float32).to(device)
                    output = model(input_tensor)
                    predictions = output.cpu().numpy().tolist()
                
                elif request.image_base64:
                    # Image data
                    image_bytes = base64.b64decode(request.image_base64)
                    # Process image here (requires PIL/cv2)
                    predictions = "Image inference not implemented - add image preprocessing"
                
                elif request.text:
                    # Text data
                    predictions = "Text inference not implemented - add tokenization"
                
                elif request.batch:
                    # Batch predictions
                    predictions = []
                    for item in request.batch:
                        # Process each item
                        predictions.append({"item": item, "result": "processed"})
                
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="No valid input provided. Use 'data', 'text', 'image_base64', or 'batch'"
                    )
        
        inference_time = (time.time() - start_time) * 1000  # ms
        
        return PredictionResponse(
            predictions=predictions,
            model=MODEL_NAME,
            device=device,
            inference_time_ms=round(inference_time, 2)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/model/info")
async def model_info():
    """Get detailed model information"""
    info = {
        "name": MODEL_NAME,
        "port": PORT,
        "workers": WORKERS,
        "device": device,
        "model_loaded": model is not None,
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available()
    }
    
    if torch.cuda.is_available():
        info["cuda_version"] = torch.version.cuda
        info["gpu_name"] = torch.cuda.get_device_name(0)
        info["gpu_memory_allocated_mb"] = round(torch.cuda.memory_allocated() / 1024 / 1024, 2)
    
    if model is not None:
        try:
            # Get model size
            param_size = sum(p.numel() for p in model.parameters())
            info["parameters"] = param_size
            info["parameters_million"] = round(param_size / 1e6, 2)
            
            # Get model architecture summary
            info["architecture"] = str(model)[:500]  # First 500 chars
        except:
            pass
    
    return info


@app.post("/model/reload")
async def reload_model():
    """Reload the model"""
    try:
        load_model()
        return {
            "success": True,
            "message": "Model reloaded successfully",
            "model_loaded": model is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reload failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        workers=WORKERS,
        log_level="info"
    )
