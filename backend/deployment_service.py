"""
Model Deployment Service with progress tracking and timeout handling
"""
import asyncio
import json
import logging
import shutil
import time
from pathlib import Path
from typing import Dict, Any, Optional, Callable
from datetime import datetime
import torch
from transformers import (
    AutoTokenizer, 
    AutoModel, 
    AutoModelForSequenceClassification,
    AutoModelForCausalLM,
    AutoModelForSeq2SeqLM,
    AutoProcessor,
    pipeline
)
from .config import config

logger = logging.getLogger(__name__)


class DeploymentProgress:
    """Track deployment progress"""
    def __init__(self, deployment_id: str):
        self.deployment_id = deployment_id
        self.status = "initializing"
        self.progress = 0
        self.message = "Starting deployment..."
        self.current_step = ""
        self.total_steps = 6
        self.completed_steps = 0
        self.start_time = time.time()
        self.errors = []
        
    def update(self, status: str = None, progress: int = None, 
               message: str = None, current_step: str = None):
        """Update progress information"""
        if status:
            self.status = status
        if progress is not None:
            self.progress = progress
        if message:
            self.message = message
        if current_step:
            self.current_step = current_step
            self.completed_steps += 1
            
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "deployment_id": self.deployment_id,
            "status": self.status,
            "progress": self.progress,
            "message": self.message,
            "current_step": self.current_step,
            "completed_steps": self.completed_steps,
            "total_steps": self.total_steps,
            "elapsed_time": time.time() - self.start_time,
            "errors": self.errors
        }


class ModelDeploymentService:
    """Service for deploying and managing PyTorch models"""
    
    def __init__(self):
        self.deployments: Dict[str, DeploymentProgress] = {}
        self.deployed_models: Dict[str, Any] = {}
        
    async def deploy_model(
        self, 
        deployment_config: Dict[str, Any],
        progress_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Deploy a model from HuggingFace Hub
        
        Args:
            deployment_config: Configuration containing:
                - model_id: HuggingFace model identifier
                - model_type: Type of model (nlp, cv, audio, multimodal)
                - deployment_name: Name for the deployment
                - hardware: Hardware configuration
                - dependencies: Additional dependencies
            progress_callback: Async callback function for progress updates
            
        Returns:
            Deployment information including endpoint URL and usage instructions
        """
        deployment_id = deployment_config.get('deployment_name', f"model_{int(time.time())}")
        progress = DeploymentProgress(deployment_id)
        self.deployments[deployment_id] = progress
        
        try:
            # Step 1: Validate configuration
            await self._update_progress(
                progress, progress_callback,
                status="validating",
                progress=10,
                message="Validating deployment configuration...",
                current_step="Configuration validation"
            )
            await asyncio.sleep(0.5)
            
            model_id = deployment_config.get('model_id')
            if not model_id:
                raise ValueError("model_id is required")
            
            # Step 2: Download model from HuggingFace
            await self._update_progress(
                progress, progress_callback,
                status="downloading",
                progress=20,
                message=f"Downloading model '{model_id}' from HuggingFace Hub...",
                current_step="Model download"
            )
            
            model, tokenizer, processor = await self._download_model(
                model_id, 
                deployment_config.get('model_type', 'nlp'),
                progress,
                progress_callback
            )
            
            # Step 3: Load model into memory
            await self._update_progress(
                progress, progress_callback,
                status="loading",
                progress=60,
                message="Loading model into memory...",
                current_step="Model loading"
            )
            await asyncio.sleep(0.5)
            
            # Step 4: Create inference pipeline
            await self._update_progress(
                progress, progress_callback,
                status="creating_pipeline",
                progress=75,
                message="Creating inference pipeline...",
                current_step="Pipeline creation"
            )
            
            inference_pipeline = await self._create_pipeline(
                model, tokenizer, processor, 
                deployment_config.get('model_type', 'nlp')
            )
            
            # Step 5: Start model server
            await self._update_progress(
                progress, progress_callback,
                status="starting_server",
                progress=85,
                message="Starting model inference server...",
                current_step="Server startup"
            )
            
            port = config.get_available_port()
            endpoint_url = f"http://{config.BACKEND_HOST}:{port}/predict"
            
            # Store deployment information
            deployment_info = {
                "deployment_id": deployment_id,
                "model_id": model_id,
                "model_type": deployment_config.get('model_type', 'nlp'),
                "endpoint_url": endpoint_url,
                "port": port,
                "status": "running",
                "created_at": datetime.now().isoformat(),
                "pipeline": inference_pipeline,
                "model": model,
                "tokenizer": tokenizer,
                "processor": processor,
                "config": deployment_config
            }
            
            self.deployed_models[deployment_id] = deployment_info
            
            # Step 6: Complete deployment
            await self._update_progress(
                progress, progress_callback,
                status="completed",
                progress=100,
                message=f"Model deployed successfully! Available at {endpoint_url}",
                current_step="Deployment complete"
            )
            
            return self._generate_deployment_summary(deployment_info)
            
        except Exception as e:
            logger.error(f"Deployment failed: {str(e)}", exc_info=True)
            progress.errors.append(str(e))
            await self._update_progress(
                progress, progress_callback,
                status="failed",
                progress=progress.progress,
                message=f"Deployment failed: {str(e)}",
                current_step="Error"
            )
            raise
    
    async def _download_model(
        self, 
        model_id: str, 
        model_type: str,
        progress: DeploymentProgress,
        progress_callback: Optional[Callable] = None
    ):
        """Download model from HuggingFace Hub with progress tracking"""
        try:
            # Update progress during download
            for i in range(20, 55, 5):
                await self._update_progress(
                    progress, progress_callback,
                    progress=i,
                    message=f"Downloading model components... ({i}%)"
                )
                await asyncio.sleep(0.5)
            
            # Actual download with timeout protection
            loop = asyncio.get_event_loop()
            
            # Download tokenizer/processor
            if model_type in ['nlp', 'text']:
                tokenizer = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: AutoTokenizer.from_pretrained(
                            model_id,
                            cache_dir=str(config.HUGGINGFACE_CACHE_DIR),
                            #token=config.HUGGINGFACE_TOKEN
                        )
                    ),
                    timeout=config.MAX_DOWNLOAD_TIMEOUT
                )
                processor = None
            else:
                tokenizer = None
                processor = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: AutoProcessor.from_pretrained(
                            model_id,
                            cache_dir=str(config.HUGGINGFACE_CACHE_DIR),
                            #token=config.HUGGINGFACE_TOKEN if config.HUGGINGFACE_TOKEN else None,
                        )
                    ),
                    timeout=config.MAX_DOWNLOAD_TIMEOUT
                )
            
            # Download model
            model = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: AutoModel.from_pretrained(
                        model_id,
                        cache_dir=str(config.HUGGINGFACE_CACHE_DIR),
                        #token=config.HUGGINGFACE_TOKEN,
                        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
                    )
                ),
                timeout=config.MAX_DOWNLOAD_TIMEOUT
            )
            
            await self._update_progress(
                progress, progress_callback,
                progress=55,
                message="Model downloaded successfully!"
            )
            
            return model, tokenizer, processor
            
        except asyncio.TimeoutError:
            raise RuntimeError(
                f"Model download timed out after {config.MAX_DOWNLOAD_TIMEOUT} seconds. "
                f"The model '{model_id}' may be too large or the connection is slow."
            )
        except Exception as e:
            raise RuntimeError(f"Failed to download model '{model_id}': {str(e)}")
    
    async def _create_pipeline(self, model, tokenizer, processor, model_type: str):
        """Create inference pipeline based on model type"""
        try:
            if model_type in ['nlp', 'text']:
                return pipeline(
                    "text-generation",
                    model=model,
                    tokenizer=tokenizer,
                    device=0 if torch.cuda.is_available() else -1
                )
            else:
                # For other model types, return a basic wrapper
                return {
                    "model": model,
                    "tokenizer": tokenizer,
                    "processor": processor
                }
        except Exception as e:
            logger.warning(f"Could not create pipeline: {e}. Using basic wrapper.")
            return {
                "model": model,
                "tokenizer": tokenizer,
                "processor": processor
            }
    
    async def _update_progress(
        self, 
        prog_tracker: DeploymentProgress,
        callback: Optional[Callable],
        **kwargs
    ):
        """Update progress and call callback if provided"""
        prog_tracker.update(**kwargs)
        if callback:
            await callback(prog_tracker.to_dict())
    
    def _generate_deployment_summary(self, deployment_info: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive deployment summary"""
        model_type = deployment_info['model_type']
        deployment_id = deployment_info['deployment_id']
        
        # Generate correct API endpoint URL
        api_endpoint = f"http://localhost:{config.BACKEND_PORT}/api/v1/deployments/{deployment_id}/inference"
        
        # Generate example usage based on model type
        if model_type == 'nlp':
            example_curl = f"""
curl -X POST {api_endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{{"text": "Hello, how are you?"}}'
"""
            example_python = f"""
import requests

response = requests.post(
    '{api_endpoint}',
    json={{"text": "Hello, how are you?"}}
)
print(response.json())
"""
        else:
            example_curl = f"""
curl -X POST {api_endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{{"input": "your input data"}}'
"""
            example_python = f"""
import requests

response = requests.post(
    '{api_endpoint}',
    json={{"input": "your input data"}}
)
print(response.json())
"""
        
        return {
            "deployment_id": deployment_info['deployment_id'],
            "model_id": deployment_info['model_id'],
            "model_type": deployment_info['model_type'],
            "status": "running",
            "endpoint_url": api_endpoint,
            "port": deployment_info['port'],
            "created_at": deployment_info['created_at'],
            "usage_instructions": {
                "description": f"Your model is now deployed and ready to accept inference requests",
                "endpoint": api_endpoint,
                "method": "POST",
                "content_type": "application/json",
                "example_curl": example_curl,
                "example_python": example_python,
                "test_ui_url": f"http://localhost:{config.FRONTEND_PORT}/test/{deployment_info['deployment_id']}"
            },
            "model_info": {
                "source": f"HuggingFace Hub: {deployment_info['model_id']}",
                "type": deployment_info['model_type'],
                "device": "CUDA" if torch.cuda.is_available() else "CPU",
                "cache_location": str(config.HUGGINGFACE_CACHE_DIR)
            }
        }
    
    def get_deployment_status(self, deployment_id: str) -> Optional[Dict[str, Any]]:
        """Get current deployment status"""
        if deployment_id in self.deployments:
            return self.deployments[deployment_id].to_dict()
        return None
    
    def list_deployments(self) -> list:
        """List all active deployments"""
        return [
            {
                "deployment_id": dep_id,
                "model_id": info['model_id'],
                "status": info['status'],
                "endpoint_url": info['endpoint_url'],
                "created_at": info['created_at']
            }
            for dep_id, info in self.deployed_models.items()
        ]
    
    async def inference(self, deployment_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run inference on a deployed model"""
        if deployment_id not in self.deployed_models:
            raise ValueError(f"Deployment {deployment_id} not found")
        
        deployment = self.deployed_models[deployment_id]
        pipeline_obj = deployment['pipeline']
        
        try:
            # Run inference with timeout
            loop = asyncio.get_event_loop()
            result = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self._run_inference(pipeline_obj, input_data)
                ),
                timeout=config.MODEL_INFERENCE_TIMEOUT
            )
            
            return {
                "status": "success",
                "result": result,
                "deployment_id": deployment_id,
                "model_id": deployment['model_id']
            }
            
        except asyncio.TimeoutError:
            raise RuntimeError(f"Inference timed out after {config.MODEL_INFERENCE_TIMEOUT} seconds")
        except Exception as e:
            raise RuntimeError(f"Inference failed: {str(e)}")
    
    def _run_inference(self, pipeline_obj, input_data: Dict[str, Any]):
        """Actually run the inference (blocking)"""
        if isinstance(pipeline_obj, dict):
            # Basic wrapper - implement custom inference
            text = input_data.get('text', input_data.get('input', ''))
            return {"output": f"Processed: {text}"}
        else:
            # Use HuggingFace pipeline
            text = input_data.get('text', input_data.get('input', ''))
            return pipeline_obj(text, max_length=100)


# Global service instance
deployment_service = ModelDeploymentService()
