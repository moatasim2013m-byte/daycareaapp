#!/usr/bin/env python3
"""
Backend Smoke Tests for Frontend Integration
Tests basic API availability and auth endpoints without modification.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Load frontend environment to get backend URL
def load_frontend_env():
    """Load REACT_APP_BACKEND_URL from frontend/.env"""
    env_path = "/app/frontend/.env"
    backend_url = None
    
    try:
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    backend_url = line.split('=')[1].strip()
                    break
    except Exception as e:
        print(f"❌ Error reading frontend .env file: {e}")
        return None
    
    return backend_url

# Test Configuration
BASE_URL = load_frontend_env()
if not BASE_URL:
    print("❌ Could not load REACT_APP_BACKEND_URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"
TIMEOUT = 30

print(f"🔍 Testing Backend API at: {API_BASE}")
print(f"⏰ Test started at: {datetime.now().isoformat()}")
print("-" * 60)

def make_request(method, endpoint, **kwargs):
    """Make HTTP request with error handling"""
    url = f"{API_BASE}{endpoint}"
    try:
        response = requests.request(method, url, timeout=TIMEOUT, **kwargs)
        return response, None
    except requests.exceptions.RequestException as e:
        return None, str(e)

def test_health_endpoints():
    """Test health and root API endpoints"""
    print("🩺 Testing Health Endpoints...")
    
    # Test root API endpoint
    print("  Testing /api/ endpoint...")
    response, error = make_request("GET", "/")
    if error:
        print(f"    ❌ Connection error: {error}")
        return False
    
    if response.status_code == 200:
        data = response.json()
        print(f"    ✅ API root accessible: {data.get('message', 'OK')}")
    else:
        print(f"    ❌ API root failed: {response.status_code}")
        return False
    
    # Test health endpoint
    print("  Testing /api/health endpoint...")
    response, error = make_request("GET", "/health")
    if error:
        print(f"    ❌ Health endpoint error: {error}")
        return False
    
    if response.status_code == 200:
        data = response.json()
        db_status = data.get('database', 'unknown')
        print(f"    ✅ Health endpoint OK - Database: {db_status}")
        
        if db_status == "disconnected":
            print(f"    ⚠️  Warning: Database is disconnected")
    else:
        print(f"    ❌ Health endpoint failed: {response.status_code}")
        return False
    
    return True

def test_auth_endpoints():
    """Test auth endpoints availability (without creating real users)"""
    print("🔐 Testing Auth Endpoints Availability...")
    
    # Test auth endpoints structure - just check they respond appropriately
    auth_endpoints = [
        ("/auth/register", "POST"),
        ("/auth/login", "POST"), 
        ("/auth/me", "GET")
    ]
    
    all_accessible = True
    
    for endpoint, method in auth_endpoints:
        print(f"  Testing {method} {endpoint}...")
        response, error = make_request(method, endpoint, 
                                     json={} if method == "POST" else None)
        
        if error:
            print(f"    ❌ Connection error: {error}")
            all_accessible = False
            continue
        
        # For auth endpoints, we expect 400/401/422 for invalid requests, not 500
        if response.status_code in [400, 401, 422, 403]:
            print(f"    ✅ Endpoint accessible (returns {response.status_code} as expected)")
        elif response.status_code == 500:
            print(f"    ❌ Server error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"       Error: {error_data}")
            except:
                print(f"       Response: {response.text[:200]}")
            all_accessible = False
        else:
            print(f"    ⚠️  Unexpected status: {response.status_code}")
    
    return all_accessible

def test_cors_headers():
    """Test CORS configuration"""
    print("🌐 Testing CORS Configuration...")
    
    response, error = make_request("OPTIONS", "/health")
    if error:
        print(f"    ❌ CORS preflight error: {error}")
        return False
    
    cors_headers = response.headers.get('Access-Control-Allow-Origin', '')
    if cors_headers:
        print(f"    ✅ CORS enabled: {cors_headers}")
        return True
    else:
        print(f"    ⚠️  CORS headers not found in preflight response")
        return False

def run_smoke_tests():
    """Run all smoke tests"""
    results = {
        "health_endpoints": False,
        "auth_endpoints": False, 
        "cors": False
    }
    
    # Health checks
    results["health_endpoints"] = test_health_endpoints()
    print()
    
    # Auth endpoint availability
    results["auth_endpoints"] = test_auth_endpoints()
    print()
    
    # CORS configuration
    results["cors"] = test_cors_headers()
    print()
    
    # Summary
    print("=" * 60)
    print("📊 SMOKE TEST SUMMARY:")
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\n🎯 Overall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("✅ Backend smoke tests PASSED - Ready for frontend integration")
        return True
    else:
        print("❌ Backend smoke tests FAILED - Issues need resolution")
        return False

if __name__ == "__main__":
    success = run_smoke_tests()
    sys.exit(0 if success else 1)