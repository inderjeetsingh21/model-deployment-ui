"""
FastAPI Backend Server for AI Model Deployment
Handles model uploads, deployment, and monitoring
"""

import os
import sys
import json
import asyncio
import subprocess
import psutil
import shutil
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import uuid

from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

# Configuration
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "deployed_models"
UPLOADS_DIR = BASE_DIR / "uploads"
LOGS_DIR = BASE_DIR / "logs"

# Create directories
MODELS_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="AI Model Deployment Server",
    description="Backend API for deploying PyTorch models locally",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
active_deployments: Dict[str, Dict] = {}
websocket_connections: List[WebSocket] = []


# Pydantic Models
class DeploymentConfig(BaseModel):
    model_name: str
    api_type: str = "REST"
    port: int = 8001
    workers: int = 4
    target: str = "Local Process"
    framework: str = "pytorch"
    dependencies: List[str] = []


class DeploymentStatus(BaseModel):
    deployment_id: str
    status: str
    port: Optional[int]
    pid: Optional[int]
    created_at: str
    model_name: str


# Utility Functions
def find_available_port(start_port: int = 8001, max_attempts: int = 100) -> int:
    """Find an available port starting from start_port"""
    import socket
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('', port))
                return port
            except OSError:
                continue
    raise RuntimeError("No available ports found")


def get_system_info() -> Dict:
    """Get system resource information"""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu_percent": cpu_percent,
        "cpu_count": psutil.cpu_count(),
        "memory_total_gb": round(memory.total / (1024**3), 2),
        "memory_used_gb": round(memory.used / (1024**3), 2),
        "memory_percent": memory.percent,
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "disk_used_gb": round(disk.used / (1024**3), 2),
        "disk_percent": disk.percent
    }


async def broadcast_message(message: Dict):
    """Broadcast message to all connected WebSocket clients"""
    disconnected = []
    for ws in websocket_connections:
        try:
            await ws.send_json(message)
        except:
            disconnected.append(ws)
    
    # Remove disconnected clients
    for ws in disconnected:
        websocket_connections.remove(ws)


# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Model Deployment Server",
        "status": "online",
        "version": "1.0.0",
        "active_deployments": len(active_deployments)
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "system": get_system_info(),
        "deployments": len(active_deployments)
    }


@app.post("/api/upload-model")
async def upload_model(
    file: UploadFile = File(...),
    model_name: Optional[str] = Form(None)
):
    """Upload a model file"""
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())[:8]
        model_name = model_name or file.filename.rsplit('.', 1)[0]
        safe_name = "".join(c for c in model_name if c.isalnum() or c in ('-', '_'))
        
        # Save file
        file_path = UPLOADS_DIR / f"{safe_name}_{file_id}{Path(file.filename).suffix}"
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        file_size_mb = len(content) / (1024 * 1024)
        
        return {
            "success": True,
            "message": "Model uploaded successfully",
            "file_id": file_id,
            "file_path": str(file_path),
            "file_size_mb": round(file_size_mb, 2),
            "model_name": safe_name
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.post("/api/deploy")
async def deploy_model(config: DeploymentConfig):
    """Deploy a model with the specified configuration"""
    try:
        deployment_id = str(uuid.uuid4())[:8]
        
        # Find available port
        port = find_available_port(config.port)
        
        # Create deployment directory
        deployment_dir = MODELS_DIR / f"{config.model_name}_{deployment_id}"
        deployment_dir.mkdir(exist_ok=True)
        
        # Create model server script
        server_script = create_model_server_script(
            deployment_dir,
            config.model_name,
            port,
            config.workers,
            config.framework
        )
        
        # Install dependencies if specified
        if config.dependencies:
            await install_dependencies(config.dependencies, deployment_dir)
        
        # Start the model server
        process = await start_model_server(
            server_script,
            deployment_dir,
            deployment_id
        )
        
        # Store deployment info
        active_deployments[deployment_id] = {
            "deployment_id": deployment_id,
            "model_name": config.model_name,
            "port": port,
            "pid": process.pid,
            "status": "running",
            "created_at": datetime.now().isoformat(),
            "config": config.dict(),
            "process": process
        }
        
        # Broadcast status update
        await broadcast_message({
            "type": "deployment_started",
            "deployment_id": deployment_id,
            "model_name": config.model_name,
            "port": port
        })
        
        return {
            "success": True,
            "message": "Deployment started successfully",
            "deployment_id": deployment_id,
            "port": port,
            "status": "running",
            "endpoint": f"http://localhost:{port}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")


@app.get("/api/deployments")
async def list_deployments():
    """List all active deployments"""
    deployments = []
    
    for dep_id, dep_info in list(active_deployments.items()):
        # Check if process is still running
        if dep_info["process"].poll() is not None:
            dep_info["status"] = "stopped"
        
        deployments.append({
            "deployment_id": dep_info["deployment_id"],
            "model_name": dep_info["model_name"],
            "port": dep_info["port"],
            "status": dep_info["status"],
            "created_at": dep_info["created_at"],
            "pid": dep_info["pid"]
        })
    
    return {
        "deployments": deployments,
        "count": len(deployments)
    }


@app.get("/api/deployments/{deployment_id}")
async def get_deployment(deployment_id: str):
    """Get deployment details"""
    if deployment_id not in active_deployments:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    dep_info = active_deployments[deployment_id]
    
    # Check process status
    is_running = dep_info["process"].poll() is None
    
    return {
        "deployment_id": dep_info["deployment_id"],
        "model_name": dep_info["model_name"],
        "port": dep_info["port"],
        "pid": dep_info["pid"],
        "status": "running" if is_running else "stopped",
        "created_at": dep_info["created_at"],
        "config": dep_info["config"],
        "endpoint": f"http://localhost:{dep_info['port']}"
    }


@app.delete("/api/deployments/{deployment_id}")
async def stop_deployment(deployment_id: str):
    """Stop a running deployment"""
    if deployment_id not in active_deployments:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    dep_info = active_deployments[deployment_id]
    
    try:
        # Terminate process
        process = dep_info["process"]
        process.terminate()
        
        # Wait for graceful shutdown
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        
        dep_info["status"] = "stopped"
        
        # Broadcast status update
        await broadcast_message({
            "type": "deployment_stopped",
            "deployment_id": deployment_id
        })
        
        return {
            "success": True,
            "message": "Deployment stopped successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop deployment: {str(e)}")


@app.get("/api/system/info")
async def system_info():
    """Get system information"""
    return get_system_info()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    websocket_connections.append(websocket)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Echo back or handle commands
            await websocket.send_json({
                "type": "pong",
                "timestamp": datetime.now().isoformat()
            })
    
    except WebSocketDisconnect:
        websocket_connections.remove(websocket)


# Helper Functions

def create_model_server_script(
    deployment_dir: Path,
    model_name: str,
    port: int,
    workers: int,
    framework: str
) -> Path:
    """Create a FastAPI server script for the model"""
    
    script_content = f'''"""
Auto-generated model server for {model_name}
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import uvicorn
from typing import Dict, Any
import json

app = FastAPI(title="{model_name} API")

class PredictionRequest(BaseModel):
    data: Dict[str, Any]

class PredictionResponse(BaseModel):
    predictions: Any
    model: str = "{model_name}"

# Load model (placeholder - replace with actual model loading)
model = None

@app.get("/")
async def root():
    return {{
        "model": "{model_name}",
        "status": "running",
        "framework": "{framework}"
    }}

@app.get("/health")
async def health():
    return {{
        "status": "healthy",
        "model_loaded": model is not None
    }}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make predictions using the model"""
    try:
        # TODO: Implement actual prediction logic
        # For now, return a placeholder response
        return PredictionResponse(
            predictions="Prediction placeholder - implement model inference here",
            model="{model_name}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/info")
async def model_info():
    """Get model information"""
    return {{
        "name": "{model_name}",
        "framework": "{framework}",
        "port": {port},
        "workers": {workers}
    }}

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port={port},
        workers={workers},
        log_level="info"
    )
'''
    
    script_path = deployment_dir / "model_server.py"
    script_path.write_text(script_content)
    return script_path


async def install_dependencies(dependencies: List[str], deployment_dir: Path):
    """Install Python dependencies"""
    venv_dir = deployment_dir / "venv"
    
    # Create virtual environment
    subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)
    
    # Install dependencies
    pip_path = venv_dir / "bin" / "pip"
    for dep in dependencies:
        subprocess.run([str(pip_path), "install", dep], check=True)


async def start_model_server(
    script_path: Path,
    deployment_dir: Path,
    deployment_id: str
) -> subprocess.Popen:
    """Start the model server as a subprocess"""
    
    log_file = LOGS_DIR / f"{deployment_id}.log"
    
    with open(log_file, "w") as log:
        process = subprocess.Popen(
            [sys.executable, str(script_path)],
            cwd=str(deployment_dir),
            stdout=log,
            stderr=subprocess.STDOUT,
            text=True
        )
    
    # Wait a moment to ensure it starts
    await asyncio.sleep(2)
    
    if process.poll() is not None:
        raise RuntimeError("Server failed to start. Check logs for details.")
    
    return process


# Startup and Shutdown Events

@app.on_event("startup")
async def startup_event():
    """Run on server startup"""
    print("=" * 60)
    print("AI Model Deployment Server Started")
    print("=" * 60)
    print(f"Server running on: http://localhost:8000")
    print(f"API Documentation: http://localhost:8000/docs")
    print(f"Models directory: {MODELS_DIR}")
    print(f"Uploads directory: {UPLOADS_DIR}")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Run on server shutdown"""
    print("\nShutting down server...")
    
    # Stop all active deployments
    for dep_id, dep_info in active_deployments.items():
        try:
            dep_info["process"].terminate()
            dep_info["process"].wait(timeout=5)
        except:
            dep_info["process"].kill()
    
    print("All deployments stopped")


if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
