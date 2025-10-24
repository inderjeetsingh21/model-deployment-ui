"""
Fixed Model Testing Endpoint for Hugging Face Models
This file should replace or be added to your backend/deployment_service.py
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Cache for loaded models to avoid reloading on each request
model_cache = {}

class TestModelRequest(BaseModel):
    model_name: str
    input_text: str
    max_length: Optional[int] = 100
    temperature: Optional[float] = 0.7

class TestModelResponse(BaseModel):
    output: str
    model_name: str
    status: str

def load_model(model_name: str, model_path: str):
    """
    Load a Hugging Face model and tokenizer
    Args:
        model_name: Name of the model (e.g., 'openai-community/gpt2-large')
        model_path: Local path where model is stored
    """
    cache_key = model_name
    
    # Return cached model if already loaded
    if cache_key in model_cache:
        logger.info(f"Using cached model: {model_name}")
        return model_cache[cache_key]
    
    try:
        logger.info(f"Loading model from: {model_path}")
        
        # Check if model files exist
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model path does not exist: {model_path}")
        
        # Load tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
        
        # Set pad token if not exists
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Determine device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            local_files_only=True,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            device_map="auto" if device == "cuda" else None
        )
        
        if device == "cpu":
            model = model.to(device)
        
        model.eval()  # Set to evaluation mode
        
        # Cache the model and tokenizer
        model_cache[cache_key] = {
            'model': model,
            'tokenizer': tokenizer,
            'device': device
        }
        
        logger.info(f"Successfully loaded model: {model_name}")
        return model_cache[cache_key]
        
    except Exception as e:
        logger.error(f"Error loading model {model_name}: {str(e)}")
        raise


def generate_text(model_dict, input_text: str, max_length: int = 100, temperature: float = 0.7):
    """
    Generate text using the loaded model
    """
    try:
        model = model_dict['model']
        tokenizer = model_dict['tokenizer']
        device = model_dict['device']
        
        # Tokenize input
        inputs = tokenizer(input_text, return_tensors="pt", padding=True)
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Generate output
        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_length=max_length,
                temperature=temperature,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id
            )
        
        # Decode output
        generated_text = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        
        return generated_text
        
    except Exception as e:
        logger.error(f"Error generating text: {str(e)}")
        raise


@router.post("/test-model", response_model=TestModelResponse)
async def test_model(request: TestModelRequest):
    """
    Test a deployed Hugging Face model with input text
    """
    try:
        logger.info(f"Testing model: {request.model_name} with input: {request.input_text}")
        
        # Construct model path
        # Adjust this path based on your deployment structure
        # Typically models are stored in ./models/{model_name}
        model_name_safe = request.model_name.replace("/", "_")
        model_path = f"./models/{model_name_safe}"
        
        # Alternative path structure - adjust as needed
        if not os.path.exists(model_path):
            model_path = f"./downloads/{model_name_safe}"
        
        if not os.path.exists(model_path):
            raise HTTPException(
                status_code=404,
                detail=f"Model not found at expected paths. Please ensure the model is downloaded."
            )
        
        # Load the model
        model_dict = load_model(request.model_name, model_path)
        
        # Generate text
        output_text = generate_text(
            model_dict,
            request.input_text,
            max_length=request.max_length,
            temperature=request.temperature
        )
        
        return TestModelResponse(
            output=output_text,
            model_name=request.model_name,
            status="success"
        )
        
    except FileNotFoundError as e:
        logger.error(f"Model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error(f"Error testing model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error testing model: {str(e)}"
        )


@router.get("/models/loaded")
async def get_loaded_models():
    """
    Get list of currently loaded models in cache
    """
    return {
        "loaded_models": list(model_cache.keys()),
        "count": len(model_cache)
    }


@router.post("/models/unload/{model_name}")
async def unload_model(model_name: str):
    """
    Unload a model from cache to free memory
    """
    try:
        if model_name in model_cache:
            del model_cache[model_name]
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
            return {"message": f"Model {model_name} unloaded successfully"}
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found in cache")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Alternative simpler endpoint using pipeline API
@router.post("/test-model-simple")
async def test_model_simple(request: TestModelRequest):
    """
    Simplified version using transformers pipeline
    """
    try:
        model_name_safe = request.model_name.replace("/", "_")
        model_path = f"./models/{model_name_safe}"
        
        if not os.path.exists(model_path):
            model_path = f"./downloads/{model_name_safe}"
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Use pipeline for simpler inference
        device = 0 if torch.cuda.is_available() else -1
        
        generator = pipeline(
            'text-generation',
            model=model_path,
            tokenizer=model_path,
            device=device
        )
        
        result = generator(
            request.input_text,
            max_length=request.max_length,
            temperature=request.temperature,
            do_sample=True
        )
        
        output_text = result[0]['generated_text']
        
        return TestModelResponse(
            output=output_text,
            model_name=request.model_name,
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Error in simple test: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
