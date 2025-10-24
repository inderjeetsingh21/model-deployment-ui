import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Image, Video, FileText, ArrowLeft, Loader } from 'lucide-react'
import axios from 'axios'

export default function ModelTester() {
  const { deploymentId } = useParams()
  const navigate = useNavigate()
  
  const [modelInfo, setModelInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [inputImage, setInputImage] = useState(null)
  const [result, setResult] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchModelInfo()
  }, [deploymentId])
  
  const fetchModelInfo = async () => {
    try {
      const response = await axios.get(`/api/v1/deployments/${deploymentId}`)
      setModelInfo(response.data)
      setLoading(false)
    } catch (err) {
      setError('Failed to load model information')
      setLoading(false)
    }
  }
  
  const handleTest = async () => {
    setIsGenerating(true)
    setError(null)
    setResult(null)
    
    try {
      let requestData = {}
      
      // Determine input based on model type
      if (modelInfo.model_type === 'nlp' || modelInfo.model_type === 'text') {
        requestData = { text: inputText }
      } else if (modelInfo.model_type === 'text-to-image') {
        requestData = { prompt: inputText }
      } else if (modelInfo.model_type === 'text-to-video') {
        requestData = { prompt: inputText }
      } else if (modelInfo.model_type === 'image-to-text') {
        // For image input models
        requestData = { image: inputImage }
      }
      
      const response = await axios.post(
        `/api/v1/deployments/${deploymentId}/inference`,
        requestData
      )
      
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Inference failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setInputImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const renderInputArea = () => {
    if (!modelInfo) return null
    
    const modelType = modelInfo.model_type
    
    if (modelType === 'nlp' || modelType === 'text' || 
        modelType === 'text-to-image' || modelType === 'text-to-video') {
      return (
        <div className="input-section">
          <label className="input-label">
            <FileText size={20} />
            {modelType === 'text-to-image' ? 'Image Prompt' : 
             modelType === 'text-to-video' ? 'Video Prompt' : 
             'Input Text'}
          </label>
          <textarea
            className="test-textarea"
            placeholder={
              modelType === 'text-to-image' ? 'Describe the image you want to generate...' :
              modelType === 'text-to-video' ? 'Describe the video you want to generate...' :
              'Enter your text here...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
          />
        </div>
      )
    } else if (modelType === 'image-to-text' || modelType === 'cv') {
      return (
        <div className="input-section">
          <label className="input-label">
            <Image size={20} />
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="file-input"
          />
          {inputImage && (
            <div className="image-preview">
              <img src={inputImage} alt="Preview" />
            </div>
          )}
        </div>
      )
    }
    
    return (
      <div className="input-section">
        <label className="input-label">
          <FileText size={20} />
          Input
        </label>
        <textarea
          className="test-textarea"
          placeholder="Enter your input..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={6}
        />
      </div>
    )
  }
  
  const renderResult = () => {
    if (!result) return null
    
    const modelType = modelInfo?.model_type
    
    if (modelType === 'text-to-image') {
      // For image generation models
      return (
        <div className="result-section">
          <h3 className="result-title">Generated Image</h3>
          {result.result?.image_url ? (
            <div className="generated-image">
              <img src={result.result.image_url} alt="Generated" />
            </div>
          ) : (
            <div className="result-output">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )
    } else if (modelType === 'text-to-video') {
      // For video generation models
      return (
        <div className="result-section">
          <h3 className="result-title">Generated Video</h3>
          {result.result?.video_url ? (
            <div className="generated-video">
              <video controls src={result.result.video_url} />
            </div>
          ) : (
            <div className="result-output">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )
    } else {
      // For text models and other types
      return (
        <div className="result-section">
          <h3 className="result-title">Result</h3>
          <div className="result-output">
            {result.result?.generated_text && (
              <div className="generated-text">
                <strong>Generated Text:</strong>
                <p>{result.result.generated_text}</p>
              </div>
            )}
            {result.result?.output && (
              <div className="output-text">
                <p>{result.result.output}</p>
              </div>
            )}
            {!result.result?.generated_text && !result.result?.output && (
              <pre>{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        </div>
      )
    }
  }
  
  if (loading) {
    return (
      <div className="model-tester loading">
        <Loader className="spinning" size={48} />
        <p>Loading model information...</p>
      </div>
    )
  }
  
  if (error && !modelInfo) {
    return (
      <div className="model-tester error">
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Home
        </button>
      </div>
    )
  }
  
  return (
    <div className="model-tester">
      <div className="tester-container">
        {/* Header */}
        <div className="tester-header">
          <button onClick={() => navigate('/')} className="back-button">
            <ArrowLeft size={20} />
            Back
          </button>
          <h1>Test Your Model</h1>
        </div>
        
        {/* Model Info */}
        <div className="model-info-card">
          <h2>{modelInfo?.model_id}</h2>
          <div className="info-badges">
            <span className="badge">{modelInfo?.model_type}</span>
            <span className="badge status-running">{modelInfo?.status}</span>
            <span className="badge">{modelInfo?.model_info?.device}</span>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="test-area">
          {renderInputArea()}
          
          <button
            onClick={handleTest}
            disabled={isGenerating || (!inputText && !inputImage)}
            className="btn-primary test-button"
          >
            {isGenerating ? (
              <>
                <Loader className="spinning" size={20} />
                Generating...
              </>
            ) : (
              <>
                <Send size={20} />
                Test Model
              </>
            )}
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {/* Result Display */}
        {renderResult()}
        
        {/* API Info */}
        {modelInfo && (
          <div className="api-info">
            <h3>API Endpoint</h3>
            <div className="endpoint-box">
              <code>{modelInfo.endpoint_url}</code>
            </div>
            <p className="api-note">
              You can also call this endpoint directly from your applications using the examples provided in the deployment summary.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
