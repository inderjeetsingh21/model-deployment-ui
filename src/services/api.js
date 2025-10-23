import axios from 'axios';

const API_BASE_URL = '/api';

export const deploymentAPI = {
  // Initiate deployment
  startDeployment: async (config) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/deploy`, config);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Deployment failed to start');
    }
  },

  // Get deployment status
  getDeploymentStatus: async (deploymentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/deployment/${deploymentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get status');
    }
  },

  // Test model endpoint
  testModel: async (endpoint, testData) => {
    try {
      const response = await axios.post(endpoint, testData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Model test failed');
    }
  },

  // Create WebSocket connection
  createWebSocket: (deploymentId, onMessage, onError) => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/${deploymentId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return ws;
  }
};

export default deploymentAPI;
