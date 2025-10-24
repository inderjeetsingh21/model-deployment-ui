import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DeploymentWizard from './components/DeploymentWizard'
import ModelTester from './components/ModelTester'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<DeploymentWizard />} />
          <Route path="/test/:deploymentId" element={<ModelTester />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
