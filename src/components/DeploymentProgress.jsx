import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader, XCircle, ExternalLink, Copy } from 'lucide-react';
import deploymentAPI from '../services/api';

const DeploymentProgress = ({ config, deploymentId }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('initializing');
  const [currentStage, setCurrentStage] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [endpointUrl, setEndpointUrl] = useState('');
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (!deploymentId) return;

    // Establish WebSocket connection
    const websocket = deploymentAPI.createWebSocket(
      deploymentId,
      (data) => {
        setProgress(data.progress || 0);
        setStatus(data.status || 'running');
        setCurrentStage(data.stage || '');
        
        if (data.log) {
          setLogs((prev) => [...prev, data.log]);
        }

        if (data.status === 'completed') {
          setEndpointUrl(data.endpoint || `http://localhost:${config.apiPort || 8001}`);
        }

        if (data.status === 'failed') {
          setError(data.error || 'Deployment failed');
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
        setError('Connection lost to deployment service');
      }
    );

    setWs(websocket);

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [deploymentId]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStageIcon = () => {
    if (status === 'completed') {
      return <CheckCircle size={24} color="#28a745" />;
    } else if (status === 'failed') {
      return <XCircle size={24} color="#dc3545" />;
    } else {
      return <Loader size={24} className="loading-spinner" />;
    }
  };

  const curlExample = `curl -X POST "${endpointUrl}/predict" \\
  -H "Content-Type: application/json" \\
  -d '{"input_text": "Hello, world!", "max_length": 512}'`;

  const pythonExample = `import requests

response = requests.post(
    "${endpointUrl}/predict",
    json={"input_text": "Hello, world!", "max_length": 512}
)
print(response.json())`;

  return (
    <div className="deployment-progress">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        {getStageIcon()}
        <div>
          <h2 style={{ margin: 0 }}>
            {status === 'completed' ? 'Deployment Complete!' : 
             status === 'failed' ? 'Deployment Failed' : 
             'Deploying Model...'}
          </h2>
          <p style={{ color: '#6c757d', margin: '0.25rem 0 0 0' }}>
            {currentStage || 'Starting deployment process'}
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {status !== 'failed' && (
        <div className="progress-container">
          <div className="progress-bar-fill">
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>

          {status !== 'completed' && (
            <div className="progress-stage">
              <h4>Current Stage: {currentStage || 'Initializing'}</h4>
              <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                Please wait while we set up your deployment...
              </p>
            </div>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Deployment Logs</h3>
          <div className="log-output">
            <pre>
              {logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </pre>
          </div>
        </div>
      )}

      {status === 'completed' && endpointUrl && (
        <div style={{ marginTop: '2rem' }}>
          <div className="success-message">
            <CheckCircle size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            <strong>Success!</strong> Your model is now deployed and ready to use.
          </div>

          <div className="endpoint-card">
            <h3>API Endpoint</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="endpoint-url" style={{ flex: 1 }}>
                {endpointUrl}
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => copyToClipboard(endpointUrl)}
                style={{ padding: '0.5rem 1rem' }}
              >
                <Copy size={16} />
              </button>
              <a
                href={`${endpointUrl}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', textDecoration: 'none' }}
              >
                <ExternalLink size={16} />
              </a>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4>Test Your API</h4>
              
              <div style={{ marginTop: '1rem' }}>
                <strong>cURL:</strong>
                <div className="code-block" style={{ position: 'relative' }}>
                  <button
                    onClick={() => copyToClipboard(curlExample)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: '#667eea',
                      border: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'white',
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <pre>{curlExample}</pre>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <strong>Python:</strong>
                <div className="code-block" style={{ position: 'relative' }}>
                  <button
                    onClick={() => copyToClipboard(pythonExample)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: '#667eea',
                      border: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'white',
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <pre>{pythonExample}</pre>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4>Available Endpoints:</h4>
              <ul style={{ marginLeft: '1.5rem', color: '#6c757d' }}>
                <li><code>POST /predict</code> - Make predictions</li>
                <li><code>GET /health</code> - Health check</li>
                <li><code>GET /docs</code> - Interactive API documentation</li>
                {config.enableMetrics && <li><code>GET /metrics</code> - Prometheus metrics</li>}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Deploy Another Model
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentProgress;
