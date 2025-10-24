#!/usr/bin/env python3
"""
Test script for API server
Verifies all endpoints are working correctly
"""
import requests
import json
import time
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_TIMEOUT = 5

def test_health():
    """Test health endpoint"""
    print("\n🔍 Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=TEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   Status: {data['status']}")
            print(f"   Deployments: {data['deployments']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False


def test_system_info():
    """Test system info endpoint"""
    print("\n🔍 Testing /api/system/info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/system/info", timeout=TEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print("✅ System info retrieved")
            print(f"   CPU: {data['cpu_percent']}%")
            print(f"   Memory: {data['memory_used_gb']}GB / {data['memory_total_gb']}GB")
            print(f"   Disk: {data['disk_percent']}%")
            return True
        else:
            print(f"❌ System info failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ System info error: {e}")
        return False


def test_list_deployments():
    """Test list deployments endpoint"""
    print("\n🔍 Testing /api/deployments endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/deployments", timeout=TEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print("✅ Deployments listed")
            print(f"   Active deployments: {data['count']}")
            if data['deployments']:
                for dep in data['deployments']:
                    print(f"   - {dep['model_name']} (ID: {dep['deployment_id']}, Port: {dep['port']})")
            return True
        else:
            print(f"❌ List deployments failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ List deployments error: {e}")
        return False


def test_deploy_model():
    """Test model deployment"""
    print("\n🔍 Testing /api/deploy endpoint...")
    try:
        payload = {
            "model_name": "test_model",
            "api_type": "REST",
            "port": 8001,
            "workers": 2,
            "target": "Local Process",
            "framework": "pytorch",
            "dependencies": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/deploy",
            json=payload,
            timeout=TEST_TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Deployment started")
            print(f"   Deployment ID: {data['deployment_id']}")
            print(f"   Port: {data['port']}")
            print(f"   Status: {data['status']}")
            print(f"   Endpoint: {data['endpoint']}")
            
            # Wait for server to start
            print("\n⏳ Waiting for model server to start...")
            time.sleep(5)
            
            # Test the deployed model
            test_deployed_model(data['port'], data['deployment_id'])
            
            return data['deployment_id']
        else:
            print(f"❌ Deployment failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Deployment error: {e}")
        return None


def test_deployed_model(port, deployment_id):
    """Test the deployed model endpoints"""
    print(f"\n🔍 Testing deployed model on port {port}...")
    model_url = f"http://localhost:{port}"
    
    try:
        # Test health
        response = requests.get(f"{model_url}/health", timeout=TEST_TIMEOUT)
        if response.status_code == 200:
            print("✅ Model health check passed")
        
        # Test prediction
        response = requests.post(
            f"{model_url}/predict",
            json={"data": [[1.0, 2.0, 3.0, 4.0]]},
            timeout=TEST_TIMEOUT
        )
        if response.status_code == 200:
            data = response.json()
            print("✅ Prediction endpoint works")
            print(f"   Inference time: {data.get('inference_time_ms', 'N/A')} ms")
        
        # Test model info
        response = requests.get(f"{model_url}/model/info", timeout=TEST_TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print("✅ Model info retrieved")
            print(f"   Model: {data['name']}")
            print(f"   Device: {data['device']}")
        
    except Exception as e:
        print(f"⚠️  Some model endpoints failed: {e}")


def test_stop_deployment(deployment_id):
    """Test stopping a deployment"""
    if not deployment_id:
        print("\n⏭️  Skipping stop test (no deployment ID)")
        return True
    
    print(f"\n🔍 Testing stop deployment for ID: {deployment_id}...")
    try:
        response = requests.delete(
            f"{BASE_URL}/api/deployments/{deployment_id}",
            timeout=TEST_TIMEOUT
        )
        
        if response.status_code == 200:
            print("✅ Deployment stopped successfully")
            return True
        else:
            print(f"❌ Stop deployment failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Stop deployment error: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("🧪 Starting API Server Tests")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print("=" * 60)
    
    results = {
        "health": False,
        "system_info": False,
        "list_deployments": False,
        "deploy": False,
        "stop": False
    }
    
    # Run tests
    results["health"] = test_health()
    results["system_info"] = test_system_info()
    results["list_deployments"] = test_list_deployments()
    
    deployment_id = test_deploy_model()
    results["deploy"] = deployment_id is not None
    
    if deployment_id:
        results["stop"] = test_stop_deployment(deployment_id)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_status in results.items():
        status = "✅ PASSED" if passed_status else "❌ FAILED"
        print(f"{test_name.ljust(20)}: {status}")
    
    print("=" * 60)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the output above.")
    
    print("=" * 60)
    
    return passed == total


if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n❌ Test suite error: {e}")
        exit(1)
