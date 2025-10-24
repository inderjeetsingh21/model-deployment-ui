"""
Configuration module for loading and managing environment variables
"""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    """Centralized configuration management"""
    
    # Server Configuration
    BACKEND_HOST: str = os.getenv('BACKEND_HOST', '0.0.0.0')
    BACKEND_PORT: int = int(os.getenv('BACKEND_PORT', '8000'))
    FRONTEND_PORT: int = int(os.getenv('FRONTEND_PORT', '3000'))
    
    # API Configuration
    API_PREFIX: str = os.getenv('API_PREFIX', '/api/v1')
    CORS_ORIGINS: list = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Model Storage Paths
    MODEL_STORAGE_PATH: Path = Path(os.getenv('MODEL_STORAGE_PATH', './deployed_models'))
    TEMP_MODEL_PATH: Path = Path(os.getenv('TEMP_MODEL_PATH', './temp_models'))
    LOGS_PATH: Path = Path(os.getenv('LOGS_PATH', './logs'))
    
    # HuggingFace Configuration
    HUGGINGFACE_CACHE_DIR: Path = Path(os.getenv('HUGGINGFACE_CACHE_DIR', './huggingface_cache'))
    HUGGINGFACE_TOKEN: Optional[str] = os.getenv('HUGGINGFACE_TOKEN')
    
    # Deployment Configuration
    MAX_DOWNLOAD_TIMEOUT: int = int(os.getenv('MAX_DOWNLOAD_TIMEOUT', '1800'))
    MODEL_INFERENCE_TIMEOUT: int = int(os.getenv('MODEL_INFERENCE_TIMEOUT', '120'))
    MAX_WORKERS: int = int(os.getenv('MAX_WORKERS', '4'))
    
    # WebSocket Configuration
    WS_HEARTBEAT_INTERVAL: int = int(os.getenv('WS_HEARTBEAT_INTERVAL', '30'))
    WS_CONNECTION_TIMEOUT: int = int(os.getenv('WS_CONNECTION_TIMEOUT', '3600'))
    
    # Model Serving Configuration
    MODEL_SERVE_PORT_START: int = int(os.getenv('MODEL_SERVE_PORT_START', '8100'))
    MODEL_SERVE_PORT_END: int = int(os.getenv('MODEL_SERVE_PORT_END', '8200'))
    
    # Resource Limits
    MAX_MODEL_SIZE_GB: int = int(os.getenv('MAX_MODEL_SIZE_GB', '10'))
    MAX_MEMORY_PER_MODEL_GB: int = int(os.getenv('MAX_MEMORY_PER_MODEL_GB', '8'))
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT: str = os.getenv('LOG_FORMAT', 'json')
    
    # Security
    API_KEY_ENABLED: bool = os.getenv('API_KEY_ENABLED', 'false').lower() == 'true'
    API_KEY: Optional[str] = os.getenv('API_KEY')
    
    # Monitoring
    ENABLE_METRICS: bool = os.getenv('ENABLE_METRICS', 'true').lower() == 'true'
    METRICS_PORT: int = int(os.getenv('METRICS_PORT', '9090'))
    
    @classmethod
    def create_directories(cls):
        """Create necessary directories if they don't exist"""
        cls.MODEL_STORAGE_PATH.mkdir(parents=True, exist_ok=True)
        cls.TEMP_MODEL_PATH.mkdir(parents=True, exist_ok=True)
        cls.LOGS_PATH.mkdir(parents=True, exist_ok=True)
        cls.HUGGINGFACE_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def get_available_port(cls) -> int:
        """Get next available port for model serving"""
        import socket
        for port in range(cls.MODEL_SERVE_PORT_START, cls.MODEL_SERVE_PORT_END):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex(('localhost', port)) != 0:
                    return port
        raise RuntimeError("No available ports for model serving")


# Initialize configuration
config = Config()
config.create_directories()
