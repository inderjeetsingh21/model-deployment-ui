import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, Loader, ExternalLink, Copy, AlertCircle } from 'lucide-react'
import axios from 'axios'

export default function DeploymentProgress({ deploymentData, onComplete, onCancel }) {
  const [progress, setProgress] = useState({
    status: 'initializing',
    progress: 0,
    message: 'Starting deployment...',
    current_step: '',
    completed_steps: 0,
    total_steps: 6,
    elapsed_time: 0
  })
  const [deploymentResult, setDeploymentResult] = useState(null)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    startDeployment()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const startDeployment = async () => {
    try {
      // Start deployment
      const response = await axios.post('/api/v1/deploy', deploymentData)
      const { deployment_id, websocket_url } = response.data

      // Connect to WebSocket for progress updates
      const wsUrl = websocket_url.replace('localhost', window.location.hostname)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        // Send ping every 10 seconds to keep connection alive
        setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 10000)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        // Ignore heartbeat messages
        if (data.type === 'heartbeat') {
          return
        }

        setProgress(data)

        // If deployment completed, fetch final result
        if (data.status === 'completed') {
          fetchDeploymentResult(deployment_id)
        } else if (data.status === 'failed') {
          setError(data.message)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('Connection error occurred. Please check the backend server.')
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
      }

    } catch (err) {
      console.error('Deployment error:', err)
      setError(err.response?.data?.detail || err.message || 'Deployment failed')
    }
  }

  const fetchDeploymentResult = async (deploymentId) => {
    try {
      const response = await axios.get(`/api/v1/deployments/${deploymentId}`)
      setDeploymentResult(response.data)
    } catch (err) {
      console.error('Failed to fetch deployment result:', err)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = () => {
    if (error || progress.status === 'failed') {
      return <XCircle size={48} className="status-icon error" />
    } else if (progress.status === 'completed' && deploymentResult) {
      return <CheckCircle size={48} className="status-icon success" />
    } else {
      return <Loader size={48} className="status-icon spinning" />
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="deployment-progress">
      <div className="progress-container">
        {/* Status Icon */}
        <div className="progress-status">
          {getStatusIcon()}
          <h2 className="progress-title">
            {error || progress.status === 'failed' ? 'Deployment Failed' :
             progress.status === 'completed' ? 'Deployment Successful!' :
             'Deploying Model...'}
          </h2>
        </div>

        {/* Progress Bar */}
        {!error && progress.status !== 'completed' && (
          <div className="progress-section">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <div className="progress-info">
              <span>{progress.progress}% Complete</span>
              <span>{progress.completed_steps} of {progress.total_steps} steps</span>
            </div>
          </div>
        )}

        {/* Current Step */}
        {!error && progress.status !== 'completed' && (
          <div className="progress-steps">
            <div className="step-current">
              <strong>Current Step:</strong> {progress.current_step || 'Initializing...'}
            </div>
            <div className="step-message">{progress.message}</div>
            <div className="step-time">
              Elapsed Time: {formatTime(progress.elapsed_time)}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={24} />
            <div>
              <strong>Error:</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Deployment Result */}
        {deploymentResult && (
          <div className="deployment-result">
            <h3>Deployment Complete!</h3>
            
            <div className="result-section">
              <h4>Model Information</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Model ID:</span>
                  <span className="info-value">{deploymentResult.model_id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{deploymentResult.model_type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value status-running">{deploymentResult.status}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Device:</span>
                  <span className="info-value">{deploymentResult.model_info.device}</span>
                </div>
              </div>
            </div>

            <div className="result-section">
              <h4>API Endpoint</h4>
              <div className="endpoint-box">
                <code>{deploymentResult.endpoint_url}</code>
                <button 
                  className="btn-icon" 
                  onClick={() => copyToClipboard(deploymentResult.endpoint_url)}
                  title="Copy to clipboard"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="result-section">
              <h4>Usage Examples</h4>
              
              <div className="code-example">
                <div className="code-header">
                  <span>cURL</span>
                  <button 
                    className="btn-icon" 
                    onClick={() => copyToClipboard(deploymentResult.usage_instructions.example_curl)}
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <pre><code>{deploymentResult.usage_instructions.example_curl}</code></pre>
              </div>

              <div className="code-example">
                <div className="code-header">
                  <span>Python</span>
                  <button 
                    className="btn-icon" 
                    onClick={() => copyToClipboard(deploymentResult.usage_instructions.example_python)}
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <pre><code>{deploymentResult.usage_instructions.example_python}</code></pre>
              </div>
            </div>

            <div className="result-section">
              <h4>What was deployed?</h4>
              <p>
                The system downloaded the <strong>{deploymentResult.model_id}</strong> model from HuggingFace Hub, 
                loaded it into memory, and created an inference API endpoint. The model files are cached locally at{' '}
                <code>{deploymentResult.model_info.cache_location}</code> for faster future deployments.
              </p>
              <p>
                You can now send inference requests to the endpoint above using HTTP POST requests with JSON data. 
                The model will process your input and return predictions in real-time.
              </p>
            </div>

            <div className="result-section">
              <h4>Testing the Model</h4>
              <div className="test-options">
                <a 
                  href={deploymentResult.usage_instructions.test_ui_url} 
                  className="btn-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={16} />
                  Open Test Interface
                </a>
                <a 
                  href={`http://localhost:8000/docs`} 
                  className="btn-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={16} />
                  API Documentation
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="progress-actions">
          {(error || deploymentResult) && (
            <button className="btn-primary" onClick={onComplete}>
              Deploy Another Model
            </button>
          )}
          {!error && progress.status !== 'completed' && (
            <button className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
