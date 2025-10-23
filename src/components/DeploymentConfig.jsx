import React from 'react';
import { Server, Globe, Container } from 'lucide-react';

const DeploymentConfig = ({ config, setConfig }) => {
  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value });
    console.log('Deploy config:', config);
  };

  return (
    <div className="step-content">
      <h2>Deployment Configuration</h2>
      <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
        Configure API and deployment settings
      </p>

      <div className="form-group">
        <label>API Type</label>
        <div className="radio-group">
          <div
            className={`radio-option ${config.apiType === 'rest' ? 'selected' : ''}`}
            onClick={() => handleChange('apiType', 'rest')}
          >
            <input
              type="radio"
              name="apiType"
              value="rest"
              checked={config.apiType === 'rest'}
              onChange={() => {}}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Globe size={20} />
                <strong>REST API</strong>
              </div>
              <small style={{ color: '#6c757d' }}>Standard HTTP endpoints</small>
            </div>
          </div>

          <div
            className={`radio-option ${config.apiType === 'grpc' ? 'selected' : ''}`}
            onClick={() => handleChange('apiType', 'grpc')}
          >
            <input
              type="radio"
              name="apiType"
              value="grpc"
              checked={config.apiType === 'grpc'}
              onChange={() => {}}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Server size={20} />
                <strong>gRPC</strong>
              </div>
              <small style={{ color: '#6c757d' }}>High-performance RPC</small>
            </div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>API Port</label>
        <input
          type="number"
          min="1024"
          max="65535"
          value={config.apiPort || '8001'}
          onChange={(e) => handleChange('apiPort', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Worker Processes</label>
        <input
          type="number"
          min="1"
          max="16"
          value={config.workers || '4'}
          onChange={(e) => handleChange('workers', e.target.value)}
        />
        <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
          Number of concurrent worker processes
        </small>
      </div>

      <div className="form-group">
        <label>Request Timeout (seconds)</label>
        <input
          type="number"
          min="5"
          max="300"
          value={config.timeout || '30'}
          onChange={(e) => handleChange('timeout', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Deployment Target</label>
        <div className="radio-group">
          <div
            className={`radio-option ${config.deploymentTarget === 'docker' ? 'selected' : ''}`}
            onClick={() => handleChange('deploymentTarget', 'docker')}
          >
            <input
              type="radio"
              name="deploymentTarget"
              value="docker"
              checked={config.deploymentTarget === 'docker'}
              onChange={() => {}}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Container size={20} />
                <strong>Docker Container</strong>
              </div>
              <small style={{ color: '#6c757d' }}>Isolated, portable deployment</small>
            </div>
          </div>

          <div
            className={`radio-option ${config.deploymentTarget === 'local' ? 'selected' : ''}`}
            onClick={() => handleChange('deploymentTarget', 'local')}
          >
            <input
              type="radio"
              name="deploymentTarget"
              value="local"
              checked={config.deploymentTarget === 'local'}
              onChange={() => {}}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Server size={20} />
                <strong>Local Process</strong>
              </div>
              <small style={{ color: '#6c757d' }}>Run directly on host</small>
            </div>
          </div>
        </div>
      </div>

      {config.deploymentTarget === 'docker' && (
        <>
          <div className="form-group">
            <label>Container Name</label>
            <input
              type="text"
              placeholder="my-model-container"
              value={config.containerName || ''}
              onChange={(e) => handleChange('containerName', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Docker Registry (Optional)</label>
            <input
              type="text"
              placeholder="docker.io/username"
              value={config.dockerRegistry || ''}
              onChange={(e) => handleChange('dockerRegistry', e.target.value)}
            />
            <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
              Push image to registry after build
            </small>
          </div>
        </>
      )}

      <div className="form-group">
        <label>Monitoring & Logging</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={config.enableMetrics !== false}
              onChange={(e) => handleChange('enableMetrics', e.target.checked)}
            />
            Enable Prometheus metrics endpoint
          </label>
          <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={config.enableLogging !== false}
              onChange={(e) => handleChange('enableLogging', e.target.checked)}
            />
            Enable structured logging
          </label>
          <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={config.enableHealthCheck !== false}
              onChange={(e) => handleChange('enableHealthCheck', e.target.checked)}
            />
            Enable health check endpoint
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Log Level</label>
        <select
          value={config.logLevel || 'INFO'}
          onChange={(e) => handleChange('logLevel', e.target.value)}
        >
          <option value="DEBUG">DEBUG</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>
    </div>
  );
};

export default DeploymentConfig;
