// src/components/DeploymentProgress.jsx
// Real-time deployment progress component

import { useState, useEffect, useRef } from 'react';
import { getDeployment } from '../services/api';

function DeploymentProgress({ deploymentId, onComplete, onError }) {
  const [status, setStatus] = useState({
    status: 'initializing',
    progress: 0,
    message: 'Starting deployment...',
  });
  const [error, setError] = useState(null);
  const pollInterval = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Start polling for status
    startPolling();

    // Try to connect via WebSocket for real-time updates
    connectWebSocket();

    return () => {
      // Cleanup
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [deploymentId]);

  const startPolling = () => {
    // Poll every 2 seconds
    pollInterval.current = setInterval(async () => {
      try {
        const data = await getDeployment(deploymentId);
        
        setStatus({
          status: data.status,
          progress: data.progress || 0,
          message: data.message || '',
        });

        // Check if completed
        if (data.status === 'running') {
          // Success!
          clearInterval(pollInterval.current);
          if (onComplete) {
            onComplete(data);
          }
        } else if (data.status === 'failed') {
          // Failed
          clearInterval(pollInterval.current);
          setError(data.error || 'Deployment failed');
          if (onError) {
            onError(data.error);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Don't stop polling on error, might be temporary
      }
    }, 2000); // Poll every 2 seconds
  };

  const connectWebSocket = () => {
    try {
      const wsUrl = 'ws://localhost:8000/ws';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for deployment updates');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Check if this message is for our deployment
          if (data.deployment_id === deploymentId) {
            if (data.type === 'status_update') {
              setStatus({
                status: data.status,
                progress: data.progress,
                message: data.message,
              });
            } else if (data.type === 'deployment_completed') {
              // Deployment completed!
              setStatus({
                status: 'running',
                progress: 100,
                message: 'Deployment successful',
              });
              
              if (onComplete) {
                onComplete(data);
              }
            } else if (data.type === 'deployment_failed') {
              setError(data.error);
              if (onError) {
                onError(data.error);
              }
            }
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Polling will continue as fallback
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection error:', err);
      // Polling will continue as fallback
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'running':
        return '#28a745';
      case 'failed':
        return '#dc3545';
      case 'initializing':
      case 'creating_directory':
      case 'creating_server':
      case 'installing_dependencies':
      case 'starting_server':
      case 'verifying':
        return '#007bff';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'running':
        return '✓';
      case 'failed':
        return '✗';
      default:
        return '⋯';
    }
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>✗</div>
          <h3>Deployment Failed</h3>
          <p>{error}</p>
          <details style={styles.details}>
            <summary>Troubleshooting</summary>
            <ul>
              <li>Check backend logs: <code>tail -f logs/{deploymentId}.log</code></li>
              <li>Verify model file is valid</li>
              <li>Check system resources</li>
              <li>Try a different port</li>
            </ul>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={{ ...styles.icon, color: getStatusColor() }}>
            {getStatusIcon()}
          </span>
          <h3>Deploying Model</h3>
        </div>

        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${status.progress}%`,
                backgroundColor: getStatusColor(),
              }}
            />
          </div>
          <div style={styles.progressText}>{status.progress}%</div>
        </div>

        <div style={styles.statusInfo}>
          <div style={styles.statusLabel}>Status:</div>
          <div style={{ ...styles.statusValue, color: getStatusColor() }}>
            {formatStatus(status.status)}
          </div>
        </div>

        <div style={styles.messageBox}>
          <div style={styles.messageIcon}>ℹ️</div>
          <div style={styles.messageText}>{status.message}</div>
        </div>

        <div style={styles.deploymentId}>
          Deployment ID: <code>{deploymentId}</code>
        </div>

        {status.status === 'running' && (
          <div style={styles.successBox}>
            <strong>🎉 Deployment Successful!</strong>
            <p>Your model is now running and ready to serve predictions.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const formatStatus = (status) => {
  const statusMap = {
    initializing: 'Initializing',
    creating_directory: 'Creating Directory',
    creating_server: 'Creating Server',
    installing_dependencies: 'Installing Dependencies',
    starting_server: 'Starting Server',
    verifying: 'Verifying',
    running: 'Running',
    failed: 'Failed',
    stopped: 'Stopped',
  };
  return statusMap[status] || status;
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  icon: {
    fontSize: '32px',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: '20px',
  },
  progressBar: {
    width: '100%',
    height: '24px',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '12px',
  },
  progressText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#6c757d',
    fontWeight: 'bold',
  },
  statusInfo: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  statusLabel: {
    fontWeight: 'bold',
  },
  statusValue: {
    fontWeight: 'bold',
  },
  messageBox: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#e7f3ff',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  messageIcon: {
    fontSize: '20px',
  },
  messageText: {
    flex: 1,
    color: '#0056b3',
  },
  deploymentId: {
    fontSize: '12px',
    color: '#6c757d',
    textAlign: 'center',
  },
  successBox: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    color: '#155724',
  },
  errorBox: {
    padding: '24px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    color: '#721c24',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  details: {
    marginTop: '16px',
    textAlign: 'left',
  },
};

export default DeploymentProgress;
