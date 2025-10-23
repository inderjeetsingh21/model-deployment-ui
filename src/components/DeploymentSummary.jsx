import React from 'react';
import { CheckCircle, Info } from 'lucide-react';

const DeploymentSummary = ({ config }) => {
  const summaryData = [
    {
      title: 'Model Configuration',
      items: [
        { label: 'Model Source', value: config.modelSource || 'Not specified' },
        { label: 'Model ID/Path', value: config.modelId || config.modelPath || 'Not specified' },
        { label: 'Model Type', value: config.modelType || 'Not specified' },
        { label: 'Deployment Name', value: config.deploymentName || 'default' },
      ],
    },
    {
      title: 'Hardware Settings',
      items: [
        { label: 'Compute', value: config.hardware === 'gpu' ? `GPU (${config.gpuMemory}GB)` : 'CPU' },
        { label: 'Memory', value: `${config.memoryAllocation || 8} GB` },
        { label: 'Precision', value: config.precision || 'fp16' },
        { label: 'Batch Size', value: config.batchSize || '1' },
      ],
    },
    {
      title: 'Dependencies',
      items: [
        { label: 'Python Version', value: config.pythonVersion || '3.10' },
        { label: 'Auto-Detect', value: config.autoDetectDeps !== false ? 'Enabled' : 'Disabled' },
        { label: 'Additional Packages', value: (config.additionalDeps || []).length || 'None' },
      ],
    },
    {
      title: 'Deployment Settings',
      items: [
        { label: 'API Type', value: config.apiType?.toUpperCase() || 'REST' },
        { label: 'Port', value: config.apiPort || '8001' },
        { label: 'Workers', value: config.workers || '4' },
        { label: 'Target', value: config.deploymentTarget === 'docker' ? 'Docker Container' : 'Local Process' },
      ],
    },
  ];

  return (
    <div className="step-content">
      <h2>Deployment Summary</h2>
      <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
        Review your configuration before starting deployment
      </p>

      {summaryData.map((section, idx) => (
        <div key={idx} className="summary-section">
          <h3>{section.title}</h3>
          <div>
            {section.items.map((item, itemIdx) => (
              <div key={itemIdx} className="summary-item">
                <span className="summary-label">{item.label}</span>
                <span className="summary-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {config.additionalDeps && config.additionalDeps.length > 0 && (
        <div className="summary-section">
          <h3>Selected Optional Dependencies</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {config.additionalDeps.map((dep) => (
              <span
                key={dep}
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {config.customRequirements && (
        <div className="summary-section">
          <h3>Custom Requirements</h3>
          <div className="code-block">
            <pre>{config.customRequirements}</pre>
          </div>
        </div>
      )}

      <div className="alert alert-info">
        <Info size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
        <strong>Note:</strong> Deployment may take 5-15 minutes depending on model size and dependencies.
      </div>

      <div className="alert alert-info" style={{ marginTop: '1rem' }}>
        <CheckCircle size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
        You can monitor the progress in real-time during deployment.
      </div>
    </div>
  );
};

export default DeploymentSummary;
