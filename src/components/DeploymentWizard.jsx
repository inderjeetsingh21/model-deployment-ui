// src/components/DeploymentWizard.jsx
// Updated with async deployment and progress tracking

import { useState } from 'react';
import { uploadModel, deployModel } from '../services/api';
import DeploymentProgress from './DeploymentProgress';

function DeploymentWizard() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Configure, 3: Progress
  const [file, setFile] = useState(null);
  const [modelName, setModelName] = useState('');
  const [config, setConfig] = useState({
    port: 8001,
    workers: 4,
    apiType: 'REST',
    target: 'Local Process',
    framework: 'pytorch',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deploymentId, setDeploymentId] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill model name from filename
      if (!modelName) {
        const name = selectedFile.name.replace(/\.(pth|pt)$/, '');
        setModelName(name);
      }
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!modelName) {
      setError('Please enter a model name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await uploadModel(file, modelName);
      console.log('Upload result:', result);
      setUploadSuccess(true);
      setStep(2); // Move to configuration step
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(`Upload failed: ${errorMsg}`);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!modelName) {
      setError('Please enter a model name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Deploy configuration
      const deployConfig = {
        model_name: modelName,
        api_type: config.apiType,
        port: parseInt(config.port),
        workers: parseInt(config.workers),
        target: config.target,
        framework: config.framework,
        dependencies: [],
      };

      console.log('Deploying with config:', deployConfig);

      // Start deployment (returns immediately)
      const result = await deployModel(deployConfig);
      
      console.log('Deploy initiated:', result);
      
      // Store deployment ID and move to progress step
      setDeploymentId(result.deployment_id);
      setStep(3);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(`Deployment failed: ${errorMsg}`);
      console.error('Deploy error:', err);
      
      if (err.response?.status === 422) {
        console.error('Validation error details:', err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeploymentComplete = (data) => {
    console.log('Deployment completed:', data);
    // You can add success notification here
    alert(`Deployment successful! Model is running on port ${data.port}`);
  };

  const handleDeploymentError = (error) => {
    console.error('Deployment failed:', error);
    setError(`Deployment failed: ${error}`);
  };

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setModelName('');
    setUploadSuccess(false);
    setDeploymentId(null);
    setError(null);
  };

  // Step 1: Upload
  if (step === 1) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Deploy AI Model</h2>
        <p style={styles.subtitle}>Step 1: Upload Model File</p>

        {error && (
          <div style={styles.errorAlert}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Model File (.pth or .pt)</label>
            <input
              type="file"
              accept=".pth,.pt"
              onChange={handleFileChange}
              disabled={loading}
              style={styles.fileInput}
            />
            {file && (
              <div style={styles.fileInfo}>
                ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Model Name</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="my_model"
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button
              onClick={handleUpload}
              disabled={loading || !file || !modelName}
              style={styles.primaryButton}
            >
              {loading ? 'Uploading...' : 'Upload & Continue'}
            </button>
            
            <button
              onClick={() => setStep(2)}
              style={styles.secondaryButton}
            >
              Skip Upload (Use Existing)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Configure
  if (step === 2) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Deploy AI Model</h2>
        <p style={styles.subtitle}>Step 2: Configure Deployment</p>

        {error && (
          <div style={styles.errorAlert}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {uploadSuccess && (
          <div style={styles.successAlert}>
            ✓ Model uploaded successfully!
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Model Name</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="my_model"
              disabled={loading}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Port</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: e.target.value })}
              min="8001"
              max="9000"
              disabled={loading}
              style={styles.input}
            />
            <small style={styles.hint}>Port for the model server (8001-9000)</small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Workers</label>
            <input
              type="number"
              value={config.workers}
              onChange={(e) => setConfig({ ...config, workers: e.target.value })}
              min="1"
              max="8"
              disabled={loading}
              style={styles.input}
            />
            <small style={styles.hint}>Number of worker processes (1-8)</small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>API Type</label>
            <select
              value={config.apiType}
              onChange={(e) => setConfig({ ...config, apiType: e.target.value })}
              disabled={loading}
              style={styles.select}
            >
              <option value="REST">REST</option>
              <option value="GraphQL">GraphQL</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Framework</label>
            <select
              value={config.framework}
              onChange={(e) => setConfig({ ...config, framework: e.target.value })}
              disabled={loading}
              style={styles.select}
            >
              <option value="pytorch">PyTorch</option>
              <option value="tensorflow">TensorFlow</option>
            </select>
          </div>

          <div style={styles.buttonGroup}>
            <button
              onClick={() => setStep(1)}
              style={styles.secondaryButton}
            >
              ← Back
            </button>
            
            <button
              onClick={handleDeploy}
              disabled={loading || !modelName}
              style={styles.primaryButton}
            >
              {loading ? 'Starting Deployment...' : 'Deploy Model →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Progress
  if (step === 3 && deploymentId) {
    return (
      <div style={styles.container}>
        <DeploymentProgress
          deploymentId={deploymentId}
          onComplete={handleDeploymentComplete}
          onError={handleDeploymentError}
        />
        
        <div style={styles.buttonGroup}>
          <button onClick={resetWizard} style={styles.secondaryButton}>
            Deploy Another Model
          </button>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '40px auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  title: {
    fontSize: '28px',
    marginBottom: '8px',
    color: '#212529',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6c757d',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#495057',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '16px',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    border: '2px dashed #ced4da',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  fileInfo: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    fontSize: '14px',
  },
  hint: {
    display: 'block',
    marginTop: '4px',
    fontSize: '14px',
    color: '#6c757d',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  primaryButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  errorAlert: {
    padding: '12px 16px',
    marginBottom: '20px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    color: '#721c24',
  },
  successAlert: {
    padding: '12px 16px',
    marginBottom: '20px',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    color: '#155724',
  },
};

export default DeploymentWizard;
