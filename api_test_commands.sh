#!/bin/bash

# Base URL
BASE_URL="http://localhost:5000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "API Testing Script"
echo "================="

# Token Retrieval Instructions
echo -e "\n${BLUE}How to Get Your Token:${NC}"
echo "1. Open your browser and go to http://localhost:3000"
echo "2. Log in with Google"
echo "3. Open Developer Tools (F12 or right-click -> Inspect)"
echo "4. Go to Application tab -> Local Storage -> http://localhost:3000"
echo "5. Find the 'token' key and copy its value"
echo "6. Set it as an environment variable:"
echo "   export TOKEN='your_copied_token'"
echo "7. Or replace 'YOUR_TOKEN_HERE' in the commands below"

# Test 1: Google Auth
echo -e "\n${GREEN}Testing Google Auth${NC}"
curl -X GET "${BASE_URL}/auth/google"

# Test 2: Get Usage Status
echo -e "\n${GREEN}Testing Get Usage Status${NC}"
curl -X GET "${BASE_URL}/analysis/usage/status" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test 3: Upload Image
echo -e "\n${GREEN}Testing Image Upload${NC}"
curl -X POST "${BASE_URL}/upload" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@/path/to/your/image.jpg"

# Test 4: Get User's Images
echo -e "\n${GREEN}Testing Get User's Images${NC}"
curl -X GET "${BASE_URL}/upload/my-images" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test 5: Delete Image
echo -e "\n${GREEN}Testing Delete Image${NC}"
curl -X DELETE "${BASE_URL}/upload/IMAGE_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test 6: Get Analysis Results
echo -e "\n${GREEN}Testing Get Analysis Results${NC}"
curl -X GET "${BASE_URL}/analysis/IMAGE_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test 7: Analyze Image
echo -e "\n${GREEN}Testing Analyze Image${NC}"
curl -X POST "${BASE_URL}/analysis/analyze/IMAGE_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test 8: Get Analysis History
echo -e "\n${GREEN}Testing Get Analysis History${NC}"
curl -X GET "${BASE_URL}/analysis/history" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Usage Instructions
echo -e "\n${GREEN}Usage Instructions:${NC}"
echo "1. Get your token using the instructions above"
echo "2. Replace YOUR_TOKEN_HERE with your actual JWT token"
echo "3. Replace IMAGE_ID_HERE with actual image IDs"
echo "4. Update the image path in the upload test"
echo "5. Make sure the backend server is running on localhost:5000"
echo "6. Run the script with: bash api_test_commands.sh"

# Example of how to use the token
echo -e "\n${GREEN}Example with token:${NC}"
echo "export TOKEN='your_jwt_token_here'"
echo "curl -X GET \"${BASE_URL}/analysis/usage/status\" -H \"Authorization: Bearer \$TOKEN\""

# Quick test with token
echo -e "\n${GREEN}Quick Test (if token is set):${NC}"
if [ -n "$TOKEN" ]; then
    echo "Testing with token: ${TOKEN:0:10}..."
    curl -X GET "${BASE_URL}/analysis/usage/status" \
        -H "Authorization: Bearer $TOKEN"
else
    echo "No token found in environment. Please set TOKEN environment variable first."
fi 