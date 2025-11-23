#!/usr/bin/env node

/**
 * Test script for Linda ROFL Backend - User Registration POC
 * 
 * Tests:
 * 1. Service health check
 * 2. Register a new user
 * 3. Retrieve the user
 * 4. List all users
 */

const API_URL = 'http://localhost:3000';

// Helper function to make requests
async function makeRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

// Generate a random UUID
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function runTests() {
  console.log('🧪 Starting Linda ROFL Backend Tests\n');

  try {
    // Test 1: Check service health
    console.log('1️⃣  Testing service health...');
    const { status: healthStatus, data: healthData } = await makeRequest('GET', '/');
    
    if (healthStatus === 200) {
      console.log('✅ Service is running');
      console.log(`   Version: ${healthData.version}`);
      console.log(`   Database: ${healthData.database}\n`);
    } else {
      console.log('❌ Service health check failed\n');
      return;
    }

    // Test 2: Register a new user
    console.log('2️⃣  Registering new user...');
    const userId = uuid();
    const userData = {
      userId,
      name: 'Juan Larraya',
      nationality: 'Argentina',
      gender: 'male',
    };

    const { status: registerStatus, data: registerData } = await makeRequest(
      'POST',
      '/users/register',
      userData
    );

    if (registerStatus === 200) {
      console.log('✅ User registered successfully');
      console.log(`   User ID: ${registerData.userId}`);
      console.log(`   Name: ${registerData.name}`);
      console.log(`   Nationality: ${registerData.nationality}`);
      console.log(`   Verified: ${registerData.verified}`);
      console.log(`   Created: ${registerData.created_at}\n`);
    } else {
      console.log('❌ User registration failed');
      console.log(`   Error: ${registerData.error}\n`);
      return;
    }

    // Test 3: Retrieve the user
    console.log('3️⃣  Retrieving user...');
    const { status: getUserStatus, data: getUserData } = await makeRequest(
      'GET',
      `/users/${userId}`
    );

    if (getUserStatus === 200) {
      console.log('✅ User retrieved successfully');
      console.log(`   User ID: ${getUserData.userId}`);
      console.log(`   Name: ${getUserData.name}`);
      console.log(`   Match: ${getUserData.userId === userId ? '✓' : '✗'}\n`);
    } else {
      console.log('❌ User retrieval failed');
      console.log(`   Error: ${getUserData.error}\n`);
      return;
    }

    // Test 4: List all users
    console.log('4️⃣  Listing all users...');
    const { status: listStatus, data: listData } = await makeRequest('GET', '/users');

    if (listStatus === 200) {
      console.log('✅ Users listed successfully');
      console.log(`   Total users: ${listData.count}`);
      listData.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.userId.slice(0, 8)}...)`);
      });
      console.log();
    } else {
      console.log('❌ User listing failed');
      console.log(`   Error: ${listData.error}\n`);
      return;
    }

    // Test 5: Try to register duplicate user
    console.log('5️⃣  Testing duplicate user prevention...');
    const { status: dupStatus, data: dupData } = await makeRequest(
      'POST',
      '/users/register',
      userData
    );

    if (dupStatus === 400) {
      console.log('✅ Duplicate user correctly rejected');
      console.log(`   Error: ${dupData.error}\n`);
    } else {
      console.log('❌ Duplicate user was not rejected\n');
    }

    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run tests
runTests();
