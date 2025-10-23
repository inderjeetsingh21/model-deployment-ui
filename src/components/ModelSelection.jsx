import React from 'react';
import { Database, Upload, Globe } from 'lucide-react';

const ModelSelection = ({ config, setConfig, onNext }) => {
  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  const modelSources = [
    { id: 'huggingface', name: 'HuggingFace Hub', icon: Globe, description: 'Download from HuggingFace' },
    { id: 'local', name: 'Local Path', icon: Database, description: 'Use local model files' },
    { id: 'upload', name: 'Upload Model', icon: Upload, description: 'Upload your own model' }
  ];

  const modelTypes = [
    { id: 'nlp', name: 'NLP/Text', description: 'BERT, GPT, T5, etc.' },
    { id: 'vision', name: 'Computer Vision', description: 'ResNet, ViT, YOLO, etc.' },
    { id: 'audio', name: 'Audio/Speech', description: 'Whisper, Wav2Vec, etc.' },
    { id: 'multimodal', name: 'Multimodal', description: 'CLIP, Flamingo, etc.' }
  ];

  return (
    <div className="step-content">
      <h2>Model Configuration</h2>
      <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
        Select your model source and type to begin deployment
      </p>

      <div className="form-group">
        <label>Model Source</label>
        <div className="radio-group">
          {modelSources.map((source) => (
            <div
              key={source.id}
              className={`radio-option ${config.modelSource === source.id ? 'selected' : ''}`}
              onClick={() => handleChange('modelSource', source.id)}
            >
              <input
                type="radio"
                name="modelSource"
                value={source.id}
                checked={config.modelSource === source.id}
                onChange={() => {}}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <source.icon size={20} />
                  <strong>{source.name}</strong>
                </div>
                <small style={{ color: '#6c757d' }}>{source.description}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {config.modelSource === 'huggingface' && (
        <div className="form-group">
          <label>Model ID</label>
          <input
            type="text"
            placeholder="e.g., bert-base-uncased, gpt2, facebook/opt-125m"
            value={config.modelId || ''}
            onChange={(e) => handleChange('modelId', e.target.value)}
          />
          <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
            Enter the HuggingFace model identifier
          </small>
        </div>
      )}

      {config.modelSource === 'local' && (
        <div className="form-group">
          <label>Local Model Path</label>
          <input
            type="text"
            placeholder="/path/to/model"
            value={config.modelPath || ''}
            onChange={(e) => handleChange('modelPath', e.target.value)}
          />
        </div>
      )}

      {config.modelSource === 'upload' && (
        <div className="form-group">
          <label>Upload Model Files</label>
          <input
            type="file"
            multiple
            onChange={(e) => handleChange('modelFiles', e.target.files)}
          />
          <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem' }}>
            Upload model weights and configuration files
          </small>
        </div>
      )}

      <div className="form-group">
        <label>Model Type</label>
        <div className="radio-group">
          {modelTypes.map((type) => (
            <div
              key={type.id}
              className={`radio-option ${config.modelType === type.id ? 'selected' : ''}`}
              onClick={() => handleChange('modelType', type.id)}
            >
              <input
                type="radio"
                name="modelType"
                value={type.id}
                checked={config.modelType === type.id}
                onChange={() => {}}
              />
              <div>
                <strong>{type.name}</strong>
                <br />
                <small style={{ color: '#6c757d' }}>{type.description}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Deployment Name</label>
        <input
          type="text"
          placeholder="my-model-deployment"
          value={config.deploymentName || ''}
          onChange={(e) => handleChange('deploymentName', e.target.value)}
        />
      </div>
    </div>
  );
};

export default ModelSelection;
