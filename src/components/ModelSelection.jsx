import React from 'react'
import { Globe, FolderOpen, Upload } from 'lucide-react'

export default function ModelSelection({ data, onUpdate }) {
  const modelSources = [
    {
      id: 'huggingface',
      name: 'HuggingFace Hub',
      icon: Globe,
      description: 'Download from HuggingFace'
    },
    {
      id: 'local',
      name: 'Local Path',
      icon: FolderOpen,
      description: 'Use local model files'
    },
    {
      id: 'upload',
      name: 'Upload Model',
      icon: Upload,
      description: 'Upload your own model'
    }
  ]

  const modelTypes = [
    {
      id: 'nlp',
      name: 'NLP/Text',
      description: 'BERT, GPT, T5, etc.'
    },
    {
      id: 'cv',
      name: 'Computer Vision',
      description: 'ResNet, ViT, YOLO, etc.'
    },
    {
      id: 'text-to-image',
      name: 'Text to Image',
      description: 'Stable Diffusion, DALL-E, etc.'
    },
    {
      id: 'text-to-video',
      name: 'Text to Video',
      description: 'Video generation models'
    }
  ]

  const handleSourceChange = (sourceId) => {
    onUpdate({
      model: { ...data.model, model_source: sourceId }
    })
  }

  const handleModelIdChange = (e) => {
    onUpdate({
      model: { ...data.model, model_id: e.target.value }
    })
  }

  const handleTypeChange = (typeId) => {
    onUpdate({
      model_type: typeId
    })
  }

  const handleDeploymentNameChange = (e) => {
    onUpdate({
      deployment_name: e.target.value
    })
  }

  return (
    <div className="model-selection">
      <div className="section-header">
        <h2>Model Configuration</h2>
        <p className="section-description">Select your model source and type to begin deployment</p>
      </div>

      {/* Model Source */}
      <div className="form-section">
        <label className="form-label">Model Source</label>
        <div className="source-options">
          {modelSources.map((source) => {
            const Icon = source.icon
            return (
              <div
                key={source.id}
                className={`source-option ${data.model.model_source === source.id ? 'selected' : ''}`}
                onClick={() => handleSourceChange(source.id)}
              >
                <input
                  type="radio"
                  name="model_source"
                  value={source.id}
                  checked={data.model.model_source === source.id}
                  onChange={() => {}}
                />
                <Icon className="source-icon" size={20} />
                <div className="source-content">
                  <div className="source-name">{source.name}</div>
                  <div className="source-description">{source.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Model ID */}
      <div className="form-section">
        <label className="form-label">Model ID</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g., bert-base-uncased, gpt2, facebook/opt-125m"
          value={data.model.model_id}
          onChange={handleModelIdChange}
        />
        <p className="form-hint">Enter the HuggingFace model identifier</p>
      </div>

      {/* Model Type */}
      <div className="form-section">
        <label className="form-label">Model Type</label>
        <div className="type-options">
          {modelTypes.map((type) => (
            <div
              key={type.id}
              className={`type-option ${data.model_type === type.id ? 'selected' : ''}`}
              onClick={() => handleTypeChange(type.id)}
            >
              <input
                type="radio"
                name="model_type"
                value={type.id}
                checked={data.model_type === type.id}
                onChange={() => {}}
              />
              <div className="type-content">
                <div className="type-name">{type.name}</div>
                <div className="type-description">{type.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Name */}
      <div className="form-section">
        <label className="form-label">Deployment Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="my-model"
          value={data.deployment_name}
          onChange={handleDeploymentNameChange}
        />
      </div>
    </div>
  )
}
