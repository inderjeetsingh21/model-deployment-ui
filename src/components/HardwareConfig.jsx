import React from 'react';
import { Cpu, Zap, HardDrive } from 'lucide-react';

const HardwareConfig = ({ config, setConfig }) => {
  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  return (
    <div className="step-content">
      <h2>Hardware Configuration</h2>
      <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
        Configure compute resources for your model
      </p>

      <div className="form-group">
        <label>Compute Type</label>
        <div className="radio-group">
          <div
            className={`radio-option ${config.hardware === 'cpu' ? 'selected' : ''}`}
            onClick={() => handleChange('hardware', 'cpu')}
          >
            <input
              type="radio"
              name="hardware"
              value="cpu"
              checked={config.hardware === 'cpu'}
              onChange={() => {}}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Cpu size={20} />
                <strong>CPU Only</strong>
              </div>
              <small style={{ color: '#6c757d' }}>For smaller models and testing</small>
            </div>
          </div>

          <div
            className={`radio-option ${config.hardware === 'gpu' ? 'selected' : ''}`}
            onClick={() => handleChange('hardware', 'gpu')}
          >
            <input
              type="radio"
              name="hardware"
              value="gpu"
              checked={config.hardware === 'gpu'}
              onChange={() => {}}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Zap size={20} />
                <strong>GPU Accelerated</strong>
              </div>
              <small style={{ color: '#6c757d' }}>For production workloads</small>
            </div>
          </div>
        </div>
      </div>

      {config.hardware === 'gpu' && (
        <>
          <div className="form-group">
            <label>GPU Memory (GB)</label>
            <select
              value={config.gpuMemory || '8'}
              onChange={(e) => handleChange('gpuMemory', e.target.value)}
            >
              <option value="4">4 GB</option>
              <option value="8">8 GB</option>
              <option value="16">16 GB</option>
              <option value="24">24 GB</option>
              <option value="32">32 GB</option>
              <option value="40">40 GB</option>
              <option value="80">80 GB</option>
            </select>
          </div>

          <div className="form-group">
            <label>CUDA Version</label>
            <select
              value={config.cudaVersion || '12.1'}
              onChange={(e) => handleChange('cudaVersion', e.target.value)}
            >
              <option value="11.8">CUDA 11.8</option>
              <option value="12.1">CUDA 12.1</option>
              <option value="12.2">CUDA 12.2</option>
            </select>
          </div>
        </>
      )}

      <div className="form-group">
        <label>
          <HardDrive size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Memory Allocation (GB)
        </label>
        <input
          type="number"
          min="1"
          max="128"
          value={config.memoryAllocation || '8'}
          onChange={(e) => handleChange('memoryAllocation', e.target.value)}
        />
        <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
          RAM to allocate for model inference
        </small>
      </div>

      <div className="form-group">
        <label>Model Precision</label>
        <select
          value={config.precision || 'fp16'}
          onChange={(e) => handleChange('precision', e.target.value)}
        >
          <option value="fp32">FP32 (Full Precision)</option>
          <option value="fp16">FP16 (Half Precision) - Recommended</option>
          <option value="int8">INT8 (Quantized)</option>
          <option value="int4">INT4 (Highly Quantized)</option>
        </select>
        <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
          Lower precision = faster inference, less memory, slight accuracy trade-off
        </small>
      </div>

      <div className="form-group">
        <label>Batch Size</label>
        <input
          type="number"
          min="1"
          max="128"
          value={config.batchSize || '1'}
          onChange={(e) => handleChange('batchSize', e.target.value)}
        />
        <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
          Number of inputs processed simultaneously
        </small>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={config.enableCaching || false}
            onChange={(e) => handleChange('enableCaching', e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          Enable Model Caching
        </label>
        <small style={{ color: '#6c757d', display: 'block', marginLeft: '1.5rem' }}>
          Cache model weights for faster subsequent loads
        </small>
      </div>
    </div>
  );
};

export default HardwareConfig;
