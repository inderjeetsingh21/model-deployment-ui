"""
FastAPI Server with WebSocket support for real-time deployment progress
"""
import asyncio
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn

from .config import config
from .deployment_service import deployment_service, router
from fastapi import FastAPI

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="PyTorch Model Deployment API",
    description="API for deploying and managing PyTorch models from HuggingFace Hub",
    version="2.0.0"
)

app.include_router(router, prefix="/api")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# Pydantic models for request validation
class ModelConfig(BaseModel):
    model_id: str
    model_source: str = "huggingface"
    
class HardwareConfig(BaseModel):
    device: str = "auto"
    gpu_memory: Optional[int] = None
    cpu_threads: Optional[int] = None

class DependencyConfig(BaseModel):
    packages: List[str] = []
    
class DeploymentConfig(BaseModel):
    model: ModelConfig
    hardware: HardwareConfig
    dependencies: DependencyConfig
    deployment_name: str
    model_type: str = "nlp"


class InferenceRequest(BaseModel):
    text: Optional[str] = None
    input: Optional[str] = None
    max_length: Optional[int] = 100


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, deployment_id: str):
        await websocket.accept()
        if deployment_id not in self.active_connections:
            self.active_connections[deployment_id] = []
        self.active_connections[deployment_id].append(websocket)
        logger.info(f"WebSocket connected for deployment: {deployment_id}")

    def disconnect(self, websocket: WebSocket, deployment_id: str):
        if deployment_id in self.active_connections:
            self.active_connections[deployment_id].remove(websocket)
            if not self.active_connections[deployment_id]:
                del self.active_connections[deployment_id]
        logger.info(f"WebSocket disconnected for deployment: {deployment_id}")

    async def send_progress(self, deployment_id: str, message: dict):
        if deployment_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[deployment_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to WebSocket: {e}")
                    dead_connections.append(connection)
            
            # Clean up dead connections
            for dead in dead_connections:
                self.disconnect(dead, deployment_id)


manager = ConnectionManager()


# API Routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PyTorch Model Deployment API",
        "version": "2.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@app.post(f"{config.API_PREFIX}/deploy")
async def deploy_model(deployment_config: DeploymentConfig):
    """
    Deploy a model from HuggingFace Hub
    
    This endpoint initiates model deployment and returns immediately.
    Use WebSocket connection to receive real-time progress updates.
    """
    try:
        deployment_id = deployment_config.deployment_name
        
        # Convert Pydantic model to dict
        config_dict = {
            "model_id": deployment_config.model.model_id,
            "model_type": deployment_config.model_type,
            "deployment_name": deployment_id,
            "hardware": deployment_config.hardware.dict(),
            "dependencies": deployment_config.dependencies.dict()
        }
        
        # Progress callback to send updates via WebSocket
        async def progress_callback(progress_data: dict):
            await manager.send_progress(deployment_id, progress_data)
        
        # Start deployment in background
        asyncio.create_task(
            deployment_service.deploy_model(config_dict, progress_callback)
        )
        
        return {
            "status": "started",
            "deployment_id": deployment_id,
            "message": "Deployment started. Connect to WebSocket for progress updates.",
            "websocket_url": f"ws://localhost:{config.BACKEND_PORT}{config.API_PREFIX}/ws/{deployment_id}"
        }
        
    except Exception as e:
        logger.error(f"Deployment initiation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket(f"{config.API_PREFIX}/ws/{{deployment_id}}")
async def websocket_endpoint(websocket: WebSocket, deployment_id: str):
    """
    WebSocket endpoint for real-time deployment progress updates
    """
    await manager.connect(websocket, deployment_id)
    try:
        # Send initial status
        status = deployment_service.get_deployment_status(deployment_id)
        if status:
            await websocket.send_json(status)
        
        # Keep connection alive and listen for heartbeat
        while True:
            try:
                # Wait for heartbeat or timeout
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=config.WS_HEARTBEAT_INTERVAL
                )
                
                # If client sends "ping", respond with current status
                if data == "ping":
                    status = deployment_service.get_deployment_status(deployment_id)
                    if status:
                        await websocket.send_json(status)
                    else:
                        await websocket.send_json({"status": "unknown"})
                        
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"type": "heartbeat"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, deployment_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, deployment_id)


@app.get(f"{config.API_PREFIX}/deployments")
async def list_deployments():
    """List all active deployments"""
    try:
        deployments = deployment_service.list_deployments()
        return {
            "status": "success",
            "count": len(deployments),
            "deployments": deployments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{config.API_PREFIX}/deployments/{{deployment_id}}")
async def get_deployment(deployment_id: str):
    """Get detailed information about a specific deployment"""
    try:
        if deployment_id not in deployment_service.deployed_models:
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        deployment_info = deployment_service.deployed_models[deployment_id]
        return deployment_service._generate_deployment_summary(deployment_info)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{config.API_PREFIX}/deployments/{{deployment_id}}/inference")
async def run_inference(deployment_id: str, request: InferenceRequest):
    """
    Run inference on a deployed model
    
    Example for NLP models:
    {
        "text": "Hello, how are you?"
    }
    """
    try:
        input_data = request.dict(exclude_none=True)
        result = await deployment_service.inference(deployment_id, input_data)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete(f"{config.API_PREFIX}/deployments/{{deployment_id}}")
async def delete_deployment(deployment_id: str):
    """Stop and remove a deployment"""
    try:
        if deployment_id not in deployment_service.deployed_models:
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        del deployment_service.deployed_models[deployment_id]
        if deployment_id in deployment_service.deployments:
            del deployment_service.deployments[deployment_id]
        
        return {
            "status": "success",
            "message": f"Deployment {deployment_id} removed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Add datetime import
from datetime import datetime


def main():
    """Main entry point"""
    logger.info(f"Starting server on {config.BACKEND_HOST}:{config.BACKEND_PORT}")
    logger.info(f"API documentation available at http://localhost:{config.BACKEND_PORT}/docs")
    
    uvicorn.run(
        "backend.api_server:app",
        host=config.BACKEND_HOST,
        port=config.BACKEND_PORT,
        reload=False,
        log_level=config.LOG_LEVEL.lower()
    )


if __name__ == "__main__":
    main()
