import React, { useState } from 'react'
import ModelSelection from './ModelSelection'
import HardwareConfig from './HardwareConfig'
import DependencyManager from './DependencyManager'
import DeploymentConfig from './DeploymentConfig'
import DeploymentSummary from './DeploymentSummary'
import DeploymentProgress from './DeploymentProgress'

const STEPS = [
  { id: 1, name: 'Model', component: ModelSelection },
  { id: 2, name: 'Hardware', component: HardwareConfig },
  { id: 3, name: 'Dependencies', component: DependencyManager },
  { id: 4, name: 'Deployment', component: DeploymentConfig },
  { id: 5, name: 'Summary', component: DeploymentSummary }
]

export default function DeploymentWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentData, setDeploymentData] = useState({
    model: {
      model_id: '',
      model_source: 'huggingface'
    },
    model_type: 'nlp',
    deployment_name: '',
    hardware: {
      device: 'auto',
      gpu_memory: null,
      cpu_threads: null
    },
    dependencies: {
      packages: []
    }
  })

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDataUpdate = (stepData) => {
    setDeploymentData({ ...deploymentData, ...stepData })
  }

  const handleDeploy = () => {
    setIsDeploying(true)
  }

  const handleDeploymentComplete = () => {
    setIsDeploying(false)
    setCurrentStep(1)
    // Reset data
    setDeploymentData({
      model: {
        model_id: '',
        model_source: 'huggingface'
      },
      model_type: 'nlp',
      deployment_name: '',
      hardware: {
        device: 'auto',
        gpu_memory: null,
        cpu_threads: null
      },
      dependencies: {
        packages: []
      }
    })
  }

  if (isDeploying) {
    return <DeploymentProgress 
      deploymentData={deploymentData} 
      onComplete={handleDeploymentComplete}
      onCancel={() => setIsDeploying(false)}
    />
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component

  return (
    <div className="deployment-wizard">
      {/* Header */}
      <header className="wizard-header">
        <h1>Automated PyTorch Model Deployment Platform</h1>
      </header>

      {/* Progress Steps */}
      <div className="wizard-steps">
        <div className="steps-container">
          {STEPS.map((step, index) => (
            <div key={step.id} className="step-wrapper">
              <div className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
                <div className="step-circle">
                  <span>{step.id}</span>
                </div>
                <div className="step-label">{step.name}</div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`step-connector ${currentStep > step.id ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="wizard-content">
        <CurrentStepComponent 
          data={deploymentData} 
          onUpdate={handleDataUpdate}
          onNext={handleNext}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-navigation">
        <button 
          className="btn-secondary"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Previous
        </button>
        
        {currentStep < STEPS.length ? (
          <button 
            className="btn-primary"
            onClick={handleNext}
            disabled={!deploymentData.model.model_id || !deploymentData.deployment_name}
          >
            Next
          </button>
        ) : (
          <button 
            className="btn-primary"
            onClick={handleDeploy}
            disabled={!deploymentData.model.model_id || !deploymentData.deployment_name}
          >
            Deploy
          </button>
        )}
      </div>
    </div>
  )
}
