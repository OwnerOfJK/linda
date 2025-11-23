#!/usr/bin/env node

/**
 * Linda Backend - WebSocket Test Script
 * Tests WebSocket connection, location updates, and real-time broadcasting
 */

const WebSocket = require('ws');

const BASE_URL = 'ws://localhost:3000/ws';
const TIMEOUT = 5000;

let aliceWs, bobWs;
let testsPassed = 0;
let testsFailed = 0;

function log(emoji, message) {
  console.log(`${emoji}  ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test1_ConnectAlice() {
  return new Promise((resolve, reject) => {
    log('1️⃣ ', 'Testing Alice WebSocket connection...');

    aliceWs = new WebSocket(`${BASE_URL}?userId=alice`);

    aliceWs.on('open', () => {
      log('✅', 'Alice connected to WebSocket');
    });

    aliceWs.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'connected') {
        log('✅', `Received connected message for: ${message.userId}`);
        testsPassed++;
        resolve();
      } else if (message.type === 'sync') {
        log('📦', `Received sync with ${message.friends.length} friends`);
      }
    });

    aliceWs.on('error', (error) => {
      log('❌', `Alice connection error: ${error.message}`);
      testsFailed++;
      reject(error);
    });

    setTimeout(() => reject(new Error('Timeout')), TIMEOUT);
  });
}

async function test2_ConnectBob() {
  return new Promise((resolve, reject) => {
    log('\n2️⃣ ', 'Testing Bob WebSocket connection...');

    bobWs = new WebSocket(`${BASE_URL}?userId=bob`);

    bobWs.on('open', () => {
      log('✅', 'Bob connected to WebSocket');
    });

    bobWs.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'connected') {
        log('✅', `Received connected message for: ${message.userId}`);
        testsPassed++;
        resolve();
      } else if (message.type === 'sync') {
        log('📦', `Received sync with ${message.friends.length} friends`);
      }
    });

    bobWs.on('error', (error) => {
      log('❌', `Bob connection error: ${error.message}`);
      testsFailed++;
      reject(error);
    });

    setTimeout(() => reject(new Error('Timeout')), TIMEOUT);
  });
}

async function test3_PingPong() {
  return new Promise((resolve, reject) => {
    log('\n3️⃣ ', 'Testing ping/pong...');

    const listener = (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'pong') {
        log('✅', 'Received pong response');
        aliceWs.off('message', listener);
        testsPassed++;
        resolve();
      }
    };

    aliceWs.on('message', listener);
    aliceWs.send(JSON.stringify({ type: 'ping' }));

    setTimeout(() => {
      aliceWs.off('message', listener);
      reject(new Error('Timeout'));
    }, TIMEOUT);
  });
}

async function test4_LocationUpdateBroadcast() {
  return new Promise((resolve, reject) => {
    log('\n4️⃣ ', 'Testing location update broadcast...');

    // Bob should receive Alice's location update
    const listener = (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'friend_location' && message.userId === 'alice') {
        log('✅', `Bob received Alice's location update`);
        log('📍', `  Location: ${message.city}, ${message.country}`);
        log('🔒', `  Privacy: ${message.privacy_level}`);
        log('📊', `  Coords: lat=${message.latitude}, lon=${message.longitude}`);

        bobWs.off('message', listener);
        testsPassed++;
        resolve();
      }
    };

    bobWs.on('message', listener);

    // Alice sends location update
    const locationUpdate = {
      type: 'location_update',
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'USA'
    };

    log('📤', 'Alice sending location update...');
    aliceWs.send(JSON.stringify(locationUpdate));

    setTimeout(() => {
      bobWs.off('message', listener);
      testsFailed++;
      reject(new Error('Bob did not receive location update'));
    }, TIMEOUT);
  });
}

async function test5_PrivacyEnforcement() {
  return new Promise((resolve, reject) => {
    log('\n5️⃣ ', 'Testing privacy enforcement (city-level)...');

    // First, update Bob's privacy to city-level via REST API
    const http = require('http');
    const postData = JSON.stringify({ privacy_level: 'city' });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/users/bob/privacy',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      log('✅', `Updated Bob's privacy to city-level`);

      // Now Bob sends location update
      const listener = (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'friend_location' && message.userId === 'bob') {
          log('✅', `Alice received Bob's location update with privacy enforcement`);
          log('📍', `  Location: ${message.city}, ${message.country}`);
          log('🔒', `  Privacy: ${message.privacy_level}`);
          log('📊', `  Coords: lat=${message.latitude}, lon=${message.longitude}`);

          // Verify privacy enforcement
          if (message.privacy_level === 'city' && message.latitude === null && message.longitude === null) {
            log('✅', 'Privacy enforcement working! Coordinates are null for city-level');
            testsPassed++;
            aliceWs.off('message', listener);
            resolve();
          } else {
            log('❌', 'Privacy enforcement failed! Coordinates should be null');
            testsFailed++;
            aliceWs.off('message', listener);
            reject(new Error('Privacy enforcement failed'));
          }
        }
      };

      aliceWs.on('message', listener);

      // Bob sends location update
      setTimeout(() => {
        const locationUpdate = {
          type: 'location_update',
          latitude: 51.5074,
          longitude: -0.1278,
          city: 'London',
          country: 'UK'
        };

        log('📤', 'Bob sending location update with city-level privacy...');
        bobWs.send(JSON.stringify(locationUpdate));
      }, 500);

      setTimeout(() => {
        aliceWs.off('message', listener);
        testsFailed++;
        reject(new Error('Timeout waiting for privacy enforcement test'));
      }, TIMEOUT);
    });

    req.on('error', (error) => {
      log('❌', `Error updating privacy: ${error.message}`);
      testsFailed++;
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function cleanup() {
  log('\n🧹', 'Cleaning up connections...');
  if (aliceWs && aliceWs.readyState === WebSocket.OPEN) {
    aliceWs.close();
  }
  if (bobWs && bobWs.readyState === WebSocket.OPEN) {
    bobWs.close();
  }
  await sleep(500);
}

async function runTests() {
  console.log('🧪 Testing Linda Backend WebSocket');
  console.log('===================================\n');

  try {
    await test1_ConnectAlice();
    await sleep(500);

    await test2_ConnectBob();
    await sleep(500);

    await test3_PingPong();
    await sleep(500);

    await test4_LocationUpdateBroadcast();
    await sleep(500);

    await test5_PrivacyEnforcement();
    await sleep(500);

    await cleanup();

    console.log('\n===================================');
    console.log(`✅ Tests passed: ${testsPassed}`);
    console.log(`❌ Tests failed: ${testsFailed}`);

    if (testsFailed === 0) {
      console.log('\n🎉 All WebSocket tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    testsFailed++;
    await cleanup();
    console.log(`\n✅ Tests passed: ${testsPassed}`);
    console.log(`❌ Tests failed: ${testsFailed}`);
    process.exit(1);
  }
}

// Run tests
runTests();
