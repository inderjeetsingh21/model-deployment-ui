import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Rocket } from 'lucide-react';
import ModelSelection from './ModelSelection';
import HardwareConfig from './HardwareConfig';
import DependencyManager from './DependencyManager';
import DeploymentConfig from './DeploymentConfig';
import DeploymentSummary from './DeploymentSummary';
import DeploymentProgress from './DeploymentProgress';
import deploymentAPI from '../services/api';

const DeploymentWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentId, setDeploymentId] = useState(null);
  const [config, setConfig] = useState({
    // Model defaults
    modelSource: 'huggingface',
    modelType: 'nlp',
    deploymentName: 'my-model',
    
    // Hardware defaults
    hardware: 'cpu',
    memoryAllocation: '8',
    precision: 'fp16',
    batchSize: '1',
    
    // Dependency defaults
    autoDetectDeps: true,
    pythonVersion: '3.10',
    additionalDeps: [],
    
    // Deployment defaults
    apiType: 'rest',
    apiPort: '8001',
    workers: '4',
    timeout: '30',
    deploymentTarget: 'docker',
    enableMetrics: true,
    enableLogging: true,
    enableHealthCheck: true,
    logLevel: 'INFO',
  });

  const steps = [
    { number: 1, name: 'Model', component: ModelSelection },
    { number: 2, name: 'Hardware', component: HardwareConfig },
    { number: 3, name: 'Dependencies', component: DependencyManager },
    { number: 4, name: 'Deployment', component: DeploymentConfig },
    { number: 5, name: 'Summary', component: DeploymentSummary },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      const result = await deploymentAPI.startDeployment(config);
      setDeploymentId(result.deployment_id);
    } catch (error) {
      console.error('Deployment error:', error);
      alert(`Deployment failed: ${error.message}`);
      setIsDeploying(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return config.modelSource && config.modelType && config.deploymentName &&
               (config.modelSource !== 'huggingface' || config.modelId) &&
               (config.modelSource !== 'local' || config.modelPath);
      case 2:
        return config.hardware && config.memoryAllocation && config.precision;
      case 3:
        return config.pythonVersion;
      case 4:
        return config.apiType && config.apiPort && config.deploymentTarget;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  if (isDeploying) {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>Model Deployment Interface</h1>
            <p>Automated model deployment in progress</p>
          </div>
          <div className="wizard-container">
            <DeploymentProgress config={config} deploymentId={deploymentId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Model Deployment Interface</h1>
          <p>Automated PyTorch Model Deployment Platform</p>
        </div>

        <div className="wizard-container">
          <div className="progress-bar">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`progress-step ${
                  currentStep >= step.number ? 'active' : ''
                } ${currentStep > step.number ? 'completed' : ''}`}
              >
                <div className="step-number">{step.number}</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {step.name}
                </div>
              </div>
            ))}
          </div>

          {CurrentStepComponent && (
            <CurrentStepComponent config={config} setConfig={setConfig} />
          )}

          <div className="button-group">
            <button
              className="btn btn-secondary"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={handleDeploy}
                disabled={!isStepValid()}
              >
                <Rocket size={20} />
                Deploy Model
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentWizard;
