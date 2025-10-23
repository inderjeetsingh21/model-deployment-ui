// src/services/api.js - Complete configurable API service
import axios from 'axios';

// Configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX;

// Endpoints configuration
const ENDPOINTS = {
  health: import.meta.env.VITE_ENDPOINT_HEALTH || '/health',
  uploadModel: import.meta.env.VITE_ENDPOINT_UPLOAD || `${API_PREFIX}/upload-model`,
  deploy: import.meta.env.VITE_ENDPOINT_DEPLOY || `${API_PREFIX}/deploy`,
  deployments: import.meta.env.VITE_ENDPOINT_DEPLOYMENTS || `${API_PREFIX}/deployments`,
  systemInfo: import.meta.env.VITE_ENDPOINT_SYSTEM_INFO || `${API_PREFIX}/system/info`,
  websocket: import.meta.env.VITE_ENDPOINT_WS || '/ws',
};

// Debug log
console.log('=== API Configuration ===');
console.log('Base URL:', API_BASE_URL);
console.log('API Prefix:', API_PREFIX);
console.log('Endpoints:', ENDPOINTS);
console.log('========================');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,  //30000 before
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`[API Request] ${config.method.toUpperCase()} ${fullUrl}`);
    if (config.data) {
      console.log('[API Request Data]', config.data);
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status}`, response.data);
    return response;
  },
  (error) => {
    const fullUrl = error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
    console.error('[API Response Error]', {
      url: fullUrl,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// API Functions

/**
 * Health check
 */
export const healthCheck = async () => {
  try {
    const response = await api.get(ENDPOINTS.health);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

/**
 * Upload model file
 * @param {File} file - Model file to upload
 * @param {string} modelName - Optional model name
 */
export const uploadModel = async (file, modelName) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (modelName) {
      formData.append('model_name', modelName);
    }

    console.log(`[Upload] File: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const response = await api.post(ENDPOINTS.uploadModel, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for large files
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`[Upload Progress] ${percentCompleted}%`);
      },
    });

    return response.data;
  } catch (error) {
    console.error('Upload model failed:', error);
    throw error;
  }
};

/**
 * Deploy model
 * @param {object} config - Deployment configuration
 */
export const deployModel = async (config) => {
  try {
    // Normalize config to match backend expectations
    const deployConfig = {
      // model_name: config.model_name || config.modelName,
      // api_type: config.api_type || config.apiType || 'REST',
      // port: parseInt(config.port) || 8001,
      // workers: parseInt(config.workers) || 4,
      // target: config.target || 'Local Process',
      // framework: config.framework || 'pytorch',
      // dependencies: Array.isArray(config.dependencies) ? config.dependencies : [],

      model_name: config.deploymentName,
      api_type: config.apiType.toUpperCase(),
      port: parseInt(config.apiPort, 10),
      workers: parseInt(config.workers, 10),
      target: config.deploymentTarget === 'local' ? 'Local Process' : 'Docker',
      framework: 'pytorch', // or extract dynamically
      dependencies: config.additionalDeps?.length ? config.additionalDeps : ['torch'],

    };

    console.log('[Deploy] Configuration:', deployConfig);

    const response = await api.post(ENDPOINTS.deploy, deployConfig);
    return response.data;
  } catch (error) {
    console.error('Deploy model failed:', error);
    
    // Enhanced error logging for 422 errors
    if (error.response?.status === 422) {
      console.error('[Deploy] Validation Error Details:', {
        errors: error.response.data?.detail,
        sentConfig: config,
      });
    }
    
    throw error;
  }
};

/**
 * Get all deployments
 */
export const getDeployments = async () => {
  try {
    const response = await api.get(ENDPOINTS.deployments);
    return response.data;
  } catch (error) {
    console.error('Get deployments failed:', error);
    throw error;
  }
};

/**
 * Get specific deployment
 * @param {string} deploymentId - Deployment ID
 */
export const getDeployment = async (deploymentId) => {
  try {
    const response = await api.get(`${ENDPOINTS.deployments}/${deploymentId}`);
    return response.data;
  } catch (error) {
    console.error('Get deployment failed:', error);
    throw error;
  }
};

/**
 * Stop deployment
 * @param {string} deploymentId - Deployment ID
 */
export const stopDeployment = async (deploymentId) => {
  try {
    const response = await api.delete(`${ENDPOINTS.deployments}/${deploymentId}`);
    return response.data;
  } catch (error) {
    console.error('Stop deployment failed:', error);
    throw error;
  }
};

/**
 * Get system information
 */
export const getSystemInfo = async () => {
  try {
    const response = await api.get(ENDPOINTS.systemInfo);
    return response.data;
  } catch (error) {
    console.error('Get system info failed:', error);
    throw error;
  }
};

/**
 * Create WebSocket connection
 */
export const createWebSocket = () => {
  const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
  const wsBaseUrl = API_BASE_URL.replace(/^https?:/, wsProtocol + ':');
  const wsUrl = `${wsBaseUrl}${ENDPOINTS.websocket}`;
  
  console.log('[WebSocket] Connecting to:', wsUrl);
  
  return new WebSocket(wsUrl);
};

/**
 * Test connection to backend
 */
export const testConnection = async () => {
  try {
    console.log('[Test] Testing backend connection...');
    const health = await healthCheck();
    console.log('[Test] Backend is healthy:', health);
    return { success: true, data: health };
  } catch (error) {
    console.error('[Test] Backend connection failed:', error);
    return { 
      success: false, 
      error: error.message,
      details: {
        baseUrl: API_BASE_URL,
        endpoint: ENDPOINTS.health,
        fullUrl: `${API_BASE_URL}${ENDPOINTS.health}`
      }
    };
  }
};

// Export configuration for debugging
export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  prefix: API_PREFIX,
  endpoints: ENDPOINTS,
};

export default api;
