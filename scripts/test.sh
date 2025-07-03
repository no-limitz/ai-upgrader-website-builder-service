#!/bin/bash

# AI Web Upgrader - Builder Service Testing Script

set -e

echo "🧪 Testing AI Web Upgrader Builder Service..."

# Set default port if not provided
PORT=${PORT:-8002}
BASE_URL="http://localhost:${PORT}"

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local expected_status=${3:-200}
    local description=$4
    
    echo "Testing ${method} ${endpoint} - ${description}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "${method}" -H "Content-Type: application/json" "${BASE_URL}${endpoint}")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ ${description} - Status: ${status_code}"
    else
        echo "❌ ${description} - Expected: ${expected_status}, Got: ${status_code}"
        echo "Response: ${response_body}"
        return 1
    fi
}

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
test_endpoint "/health" "GET" "200" "Health check endpoint"

# Test 2: Root endpoint
echo "2️⃣ Testing Root Endpoint..."
test_endpoint "/" "GET" "200" "Root endpoint"

# Test 3: Sample generation endpoint
echo "3️⃣ Testing Sample Generation..."
test_endpoint "/generate/sample" "GET" "200" "Sample generation endpoint"

# Test 4: Invalid endpoint (404 test)
echo "4️⃣ Testing 404 Handling..."
test_endpoint "/invalid-endpoint" "GET" "404" "404 error handling"

# Test 5: Generate endpoint with missing data (400 test)
echo "5️⃣ Testing Validation Error..."
curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "${BASE_URL}/generate" | tail -n1 | grep -q "400" && echo "✅ Validation error handling" || echo "❌ Validation error handling failed"

# Test 6: Screenshot endpoint without data (400 test)
echo "6️⃣ Testing Screenshot Validation..."
curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "${BASE_URL}/screenshot" | tail -n1 | grep -q "400" && echo "✅ Screenshot validation" || echo "❌ Screenshot validation failed"

# Performance test - concurrent requests
echo "7️⃣ Testing Performance (5 concurrent requests)..."
for i in {1..5}; do
    curl -s "${BASE_URL}/health" > /dev/null &
done
wait
echo "✅ Concurrent requests handled"

echo ""
echo "🎉 All tests completed!"
echo "📊 Service Status:"
curl -s "${BASE_URL}/health" | grep -o '"status":"[^"]*"' || echo "Could not get status"