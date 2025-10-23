// src/services/api.js
// Updated API service with deployment status polling

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

console.log('API Configuration:', { API_BASE_URL, API_PREFIX });

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data);
    return response;
  },
  (error) => {
    console.error('[API] Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

/**
 * Health check
 */
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

/**
 * Upload model file
 */
export const uploadModel = async (file, modelName) => {
  const formData = new FormData();
  formData.append('file', file);
  if (modelName) {
    formData.append('model_name', modelName);
  }

  const response = await api.post(`${API_PREFIX}/upload-model`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes for file upload
  });

  return response.data;
};

/**
 * Deploy model (async - returns immediately with deployment ID)
 */
export const deployModel = async (config) => {
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

  const response = await api.post(`${API_PREFIX}/deploy`, deployConfig, {
    timeout: 10000, // Short timeout since it returns immediately
  });

  return response.data;
};

/**
 * Get deployment details (full info)
 */
export const getDeployment = async (deploymentId) => {
  const response = await api.get(`${API_PREFIX}/deployments/${deploymentId}`);
  return response.data;
};

/**
 * Get deployment status (lightweight for polling)
 */
export const getDeploymentStatus = async (deploymentId) => {
  const response = await api.get(`${API_PREFIX}/deployments/${deploymentId}/status`);
  return response.data;
};

/**
 * Get all deployments
 */
export const getDeployments = async () => {
  const response = await api.get(`${API_PREFIX}/deployments`);
  return response.data;
};

/**
 * Stop deployment
 */
export const stopDeployment = async (deploymentId) => {
  const response = await api.delete(`${API_PREFIX}/deployments/${deploymentId}`);
  return response.data;
};

/**
 * Get system information
 */
export const getSystemInfo = async () => {
  const response = await api.get(`${API_PREFIX}/system/info`);
  return response.data;
};

/**
 * Create WebSocket connection for real-time updates
 */
export const createWebSocket = () => {
  const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
  const wsBaseUrl = API_BASE_URL.replace(/^https?:/, wsProtocol + ':');
  const wsUrl = `${wsBaseUrl}/ws`;
  
  console.log('[WebSocket] Connecting to:', wsUrl);
  return new WebSocket(wsUrl);
};

/**
 * Poll deployment status until completion
 * @param {string} deploymentId - Deployment ID
 * @param {function} onUpdate - Callback for status updates
 * @param {number} interval - Polling interval in ms (default: 2000)
 */
export const pollDeploymentStatus = (deploymentId, onUpdate, interval = 2000) => {
  let pollInterval;
  
  const poll = async () => {
    try {
      const status = await getDeploymentStatus(deploymentId);
      
      if (onUpdate) {
        onUpdate(status);
      }
      
      // Stop polling if deployment is complete or failed
      if (status.status === 'running' || status.status === 'failed') {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      // Continue polling even on errors
    }
  };
  
  // Start polling
  poll(); // Initial call
  pollInterval = setInterval(poll, interval);
  
  // Return cleanup function
  return () => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  };
};

export default api;
