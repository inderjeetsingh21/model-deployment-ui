import React, { useState } from 'react';
import axios from 'axios';
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const ModelTester = () => {
  const [modelName, setModelName] = useState('openai-community/gpt2-large');
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maxLength, setMaxLength] = useState(100);
  const [temperature, setTemperature] = useState(0.7);

  const handleTestModel = async () => {
    if (!inputText.trim()) {
      setError('Please enter some input text');
      return;
    }

    setLoading(true);
    setError(null);
    setOutput('');

    try {
      // Make sure to use the correct backend URL
      const response = await axios.post('http://localhost:8000/api/test-model', {
        model_name: modelName,
        input_text: inputText,
        max_length: maxLength,
        temperature: temperature
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for model inference
      });

      if (response.data && response.data.output) {
        setOutput(response.data.output);
      } else {
        setError('No output received from model');
      }
    } catch (err) {
      console.error('Error testing model:', err);
      
      let errorMessage = 'Failed to test model';
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.detail || err.response.statusText || errorMessage;
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'No response from server. Is the backend running?';
      } else {
        // Error setting up request
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTestModel();
    }
  };

  return (
    <div className="model-tester-container">
      <div className="model-tester-card">
        <div className="model-tester-header">
          <h2>Model Inference Tester</h2>
          <p>Test your deployed Hugging Face model with custom inputs</p>
        </div>

        <div className="model-tester-form">
          {/* Model Selection */}
          <div className="form-group">
            <label htmlFor="model-select">Model</label>
            <input
              id="model-select"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., openai-community/gpt2-large"
              className="model-input"
            />
          </div>

          {/* Advanced Settings */}
          <div className="advanced-settings">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="max-length">Max Length</label>
                <input
                  id="max-length"
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(Number(e.target.value))}
                  min="10"
                  max="500"
                  className="small-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="temperature">Temperature</label>
                <input
                  id="temperature"
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  className="small-input"
                />
              </div>
            </div>
          </div>

          {/* Input Text */}
          <div className="form-group">
            <label htmlFor="input-text">Input Text</label>
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your prompt here..."
              rows={4}
              className="text-input"
              disabled={loading}
            />
          </div>

          {/* Test Button */}
          <button
            onClick={handleTestModel}
            disabled={loading || !inputText.trim()}
            className="test-button"
          >
            {loading ? (
              <>
                <Loader2 className="icon spinning" />
                Generating...
              </>
            ) : (
              <>
                <Send className="icon" />
                Test Model
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle className="icon" />
              <div>
                <strong>Error:</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Output Display */}
          {output && !error && (
            <div className="output-section">
              <div className="output-header">
                <CheckCircle2 className="icon success" />
                <h3>Generated Output</h3>
              </div>
              <div className="output-content">
                <pre>{output}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .model-tester-container {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .model-tester-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .model-tester-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
        }

        .model-tester-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
        }

        .model-tester-header p {
          margin: 0;
          opacity: 0.9;
        }

        .model-tester-form {
          padding: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .model-input,
        .text-input,
        .small-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .model-input:focus,
        .text-input:focus,
        .small-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .text-input {
          resize: vertical;
          font-family: 'Courier New', monospace;
        }

        .advanced-settings {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .small-input {
          width: 100%;
        }

        .test-button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .test-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .test-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .icon {
          width: 20px;
          height: 20px;
        }

        .icon.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1.5rem;
          display: flex;
          gap: 1rem;
        }

        .alert-error {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
        }

        .alert strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .output-section {
          margin-top: 2rem;
          border-top: 2px solid #e2e8f0;
          padding-top: 1.5rem;
        }

        .output-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .output-header h3 {
          margin: 0;
          color: #333;
        }

        .icon.success {
          color: #48bb78;
        }

        .output-content {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .output-content pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Courier New', monospace;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #2d3748;
        }
      `}</style>
    </div>
  );
};

export default ModelTester;
