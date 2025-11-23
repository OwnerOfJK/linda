#!/bin/bash

# Linda Backend API Test Script
# Tests all REST endpoints and WebSocket functionality

BASE_URL="http://localhost:3000"

echo "🧪 Testing Linda Backend API"
echo "=============================="
echo ""

# Test 1: Root endpoint
echo "1️⃣  Testing root endpoint..."
curl -s "$BASE_URL/" | jq '.'
echo ""

# Test 2: Register users
echo "2️⃣  Registering users..."
echo "Registering Alice..."
curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{"userId":"alice","name":"Alice Johnson","nationality":"USA","gender":"female"}' | jq '.'

echo "Registering Bob..."
curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{"userId":"bob","name":"Bob Smith","nationality":"UK","gender":"male"}' | jq '.'
echo ""

# Test 3: Get user profile
echo "3️⃣  Getting Alice's profile..."
curl -s "$BASE_URL/users/alice" | jq '.'
echo ""

# Test 4: Update privacy level
echo "4️⃣  Updating Alice's privacy to realtime..."
curl -s -X PUT "$BASE_URL/users/alice/privacy" \
  -H "Content-Type: application/json" \
  -d '{"privacy_level":"realtime"}' | jq '.'
echo ""

# Test 5: Update location
echo "5️⃣  Updating Alice's location..."
curl -s -X POST "$BASE_URL/users/alice/location" \
  -H "Content-Type: application/json" \
  -d '{"latitude":40.7128,"longitude":-74.0060,"city":"New York","country":"USA"}' | jq '.'
echo ""

# Test 6: Add friend
echo "6️⃣  Making Alice and Bob friends..."
curl -s -X POST "$BASE_URL/users/alice/friends" \
  -H "Content-Type: application/json" \
  -d '{"friendId":"bob"}' | jq '.'
echo ""

# Test 7: Get friends list
echo "7️⃣  Getting Alice's friends..."
curl -s "$BASE_URL/users/alice/friends" | jq '.'
echo ""

# Test 8: Get friends' locations
echo "8️⃣  Getting Alice's friends locations..."
curl -s "$BASE_URL/users/alice/friends/locations" | jq '.'
echo ""

# Test 9: Update Bob's location
echo "9️⃣  Updating Bob's location..."
curl -s -X POST "$BASE_URL/users/bob/location" \
  -H "Content-Type: application/json" \
  -d '{"latitude":51.5074,"longitude":-0.1278,"city":"London","country":"UK"}' | jq '.'
echo ""

echo "✅ REST API tests complete!"
echo ""
echo "🔌 To test WebSocket, use:"
echo "   wscat -c 'ws://localhost:3000/ws?userId=alice'"
echo ""
echo "Then send location updates:"
echo '  {"type":"location_update","latitude":40.7128,"longitude":-74.0060,"city":"New York","country":"USA"}'
echo ""
