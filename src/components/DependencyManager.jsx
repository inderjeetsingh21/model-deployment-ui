import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';

const DependencyManager = ({ config, setConfig }) => {
  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  const toggleDependency = (dep) => {
    const current = config.additionalDeps || [];
    const newDeps = current.includes(dep)
      ? current.filter((d) => d !== dep)
      : [...current, dep];
    handleChange('additionalDeps', newDeps);
  };

  const coreDependencies = [
    { name: 'torch', version: '2.1.0', required: true },
    { name: 'transformers', version: '4.35.0', required: config.modelType === 'nlp' },
    { name: 'torchvision', version: '0.16.0', required: config.modelType === 'vision' },
    { name: 'torchaudio', version: '2.1.0', required: config.modelType === 'audio' },
    { name: 'fastapi', version: '0.104.0', required: true },
    { name: 'uvicorn', version: '0.24.0', required: true },
  ];

  const optionalDependencies = [
    { name: 'pillow', description: 'Image processing', category: 'vision' },
    { name: 'opencv-python', description: 'Advanced image operations', category: 'vision' },
    { name: 'librosa', description: 'Audio analysis', category: 'audio' },
    { name: 'sentencepiece', description: 'Text tokenization', category: 'nlp' },
    { name: 'accelerate', description: 'Distributed training/inference', category: 'optimization' },
    { name: 'bitsandbytes', description: 'Model quantization', category: 'optimization' },
    { name: 'scipy', description: 'Scientific computing', category: 'general' },
    { name: 'scikit-learn', description: 'ML utilities', category: 'general' },
  ];

  return (
    <div className="step-content">
      <h2>Dependency Management</h2>
      <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
        Manage Python packages and dependencies for your deployment
      </p>

      <div className="form-group">
        <label>
          <Package size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Auto-Detect Dependencies
        </label>
        <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={config.autoDetectDeps !== false}
            onChange={(e) => handleChange('autoDetectDeps', e.target.checked)}
          />
          Automatically detect and install required packages based on model type
        </label>
      </div>

      <div className="summary-section">
        <h3>Core Dependencies</h3>
        <div style={{ fontSize: '0.9rem' }}>
          {coreDependencies.map((dep) => (
            <div key={dep.name} className="summary-item">
              <span className="summary-label">
                {dep.name}
                {dep.required && <span style={{ color: '#dc3545', marginLeft: '0.25rem' }}>*</span>}
              </span>
              <span className="summary-value">{dep.version}</span>
            </div>
          ))}
        </div>
        <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
          * Required dependencies will be installed automatically
        </small>
      </div>

      <div className="form-group">
        <label>Optional Dependencies</label>
        <div className="checkbox-group">
          {optionalDependencies
            .filter((dep) => !config.modelType || dep.category === config.modelType || dep.category === 'general' || dep.category === 'optimization')
            .map((dep) => (
              <div
                key={dep.name}
                className="checkbox-option"
                onClick={() => toggleDependency(dep.name)}
              >
                <input
                  type="checkbox"
                  checked={(config.additionalDeps || []).includes(dep.name)}
                  onChange={() => {}}
                />
                <div style={{ flex: 1 }}>
                  <strong>{dep.name}</strong>
                  <br />
                  <small style={{ color: '#6c757d' }}>{dep.description}</small>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="form-group">
        <label>Additional Requirements</label>
        <textarea
          placeholder="Enter additional packages (one per line)&#10;Example:&#10;pandas>=1.5.0&#10;numpy>=1.24.0"
          value={config.customRequirements || ''}
          onChange={(e) => handleChange('customRequirements', e.target.value)}
          rows="5"
        />
        <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
          Add custom packages with optional version specifications
        </small>
      </div>

      {config.hardware === 'gpu' && (
        <div className="alert alert-info">
          <strong>GPU Support:</strong> PyTorch will be installed with CUDA {config.cudaVersion} support
        </div>
      )}

      <div className="form-group">
        <label>Python Version</label>
        <select
          value={config.pythonVersion || '3.10'}
          onChange={(e) => handleChange('pythonVersion', e.target.value)}
        >
          <option value="3.9">Python 3.9</option>
          <option value="3.10">Python 3.10 (Recommended)</option>
          <option value="3.11">Python 3.11</option>
        </select>
      </div>

      {config.additionalDeps?.includes('bitsandbytes') && !config.hardware === 'gpu' && (
        <div className="alert alert-warning">
          <AlertTriangle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          <strong>Warning:</strong> bitsandbytes requires GPU support
        </div>
      )}
    </div>
  );
};

export default DependencyManager;
