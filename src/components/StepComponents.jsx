// HardwareConfig.jsx
import React from 'react'
import { Cpu, Zap } from 'lucide-react'

export function HardwareConfig({ data, onUpdate }) {
  const handleDeviceChange = (device) => {
    onUpdate({
      hardware: { ...data.hardware, device }
    })
  }

  return (
    <div className="hardware-config">
      <div className="section-header">
        <h2>Hardware Configuration</h2>
        <p className="section-description">Select the hardware resources for model deployment</p>
      </div>

      <div className="form-section">
        <label className="form-label">Compute Device</label>
        <div className="device-options">
          <div
            className={`device-option ${data.hardware.device === 'auto' ? 'selected' : ''}`}
            onClick={() => handleDeviceChange('auto')}
          >
            <Zap size={24} />
            <div>
              <div className="device-name">Auto</div>
              <div className="device-description">Automatically detect best device</div>
            </div>
          </div>
          <div
            className={`device-option ${data.hardware.device === 'cuda' ? 'selected' : ''}`}
            onClick={() => handleDeviceChange('cuda')}
          >
            <Cpu size={24} />
            <div>
              <div className="device-name">CUDA (GPU)</div>
              <div className="device-description">Use NVIDIA GPU acceleration</div>
            </div>
          </div>
          <div
            className={`device-option ${data.hardware.device === 'cpu' ? 'selected' : ''}`}
            onClick={() => handleDeviceChange('cpu')}
          >
            <Cpu size={24} />
            <div>
              <div className="device-name">CPU</div>
              <div className="device-description">Use CPU for inference</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// DependencyManager.jsx
export function DependencyManager({ data, onUpdate }) {
  return (
    <div className="dependency-manager">
      <div className="section-header">
        <h2>Dependencies</h2>
        <p className="section-description">All required dependencies will be automatically managed</p>
      </div>

      <div className="info-box">
        <p>The system will automatically install and manage all necessary dependencies including:</p>
        <ul>
          <li>PyTorch and transformers libraries</li>
          <li>Model-specific requirements</li>
          <li>Tokenizers and processors</li>
        </ul>
        <p>No manual configuration needed!</p>
      </div>
    </div>
  )
}

// DeploymentConfig.jsx
export function DeploymentConfig({ data, onUpdate }) {
  return (
    <div className="deployment-config">
      <div className="section-header">
        <h2>Deployment Settings</h2>
        <p className="section-description">Review and confirm deployment settings</p>
      </div>

      <div className="config-review">
        <div className="review-item">
          <span className="review-label">Deployment Name:</span>
          <span className="review-value">{data.deployment_name}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Model ID:</span>
          <span className="review-value">{data.model.model_id}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Model Type:</span>
          <span className="review-value">{data.model_type}</span>
        </div>
        <div className="review-item">
          <span className="review-label">Device:</span>
          <span className="review-value">{data.hardware.device}</span>
        </div>
      </div>
    </div>
  )
}

// DeploymentSummary.jsx
export function DeploymentSummary({ data, onUpdate }) {
  return (
    <div className="deployment-summary">
      <div className="section-header">
        <h2>Deployment Summary</h2>
        <p className="section-description">Review all settings before deployment</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <h3>Model Configuration</h3>
          <div className="summary-item">
            <span>Model ID:</span>
            <strong>{data.model.model_id}</strong>
          </div>
          <div className="summary-item">
            <span>Source:</span>
            <strong>{data.model.model_source}</strong>
          </div>
          <div className="summary-item">
            <span>Type:</span>
            <strong>{data.model_type}</strong>
          </div>
        </div>

        <div className="summary-card">
          <h3>Hardware Settings</h3>
          <div className="summary-item">
            <span>Device:</span>
            <strong>{data.hardware.device}</strong>
          </div>
        </div>

        <div className="summary-card">
          <h3>Deployment Info</h3>
          <div className="summary-item">
            <span>Name:</span>
            <strong>{data.deployment_name}</strong>
          </div>
        </div>
      </div>

      <div className="summary-note">
        <p>
          <strong>What happens next?</strong>
        </p>
        <ol>
          <li>The model will be downloaded from HuggingFace Hub</li>
          <li>Model files will be cached locally for faster future access</li>
          <li>An inference API endpoint will be created</li>
          <li>You'll receive the endpoint URL and usage examples</li>
        </ol>
      </div>
    </div>
  )
}

export default HardwareConfig
