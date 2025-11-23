/**
 * Mock Friends Simulator for Linda Demo
 *
 * Creates 10 mock friends that update their locations every 5 seconds.
 * Perfect for demos and testing real-time location updates.
 *
 * Usage:
 *   node simulate-friends.js <your-userId>
 *
 * Example:
 *   node simulate-friends.js 681be344-5808-4717-8e31-d590ca96e783
 */

const WebSocket = require('ws');
const fetch = require('node-fetch');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws';
const UPDATE_INTERVAL = 5000; // 5 seconds

// Mock friends data with starting locations
const MOCK_FRIENDS = [
  {
    userId: 'mock-friend-1',
    name: 'Alice Chen',
    nationality: 'USA',
    city: 'New York',
    country: 'USA',
    lat: 40.7128,
    lon: -74.0060,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-2',
    name: 'Bob Smith',
    nationality: 'UK',
    city: 'London',
    country: 'UK',
    lat: 51.5074,
    lon: -0.1278,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-3',
    name: 'Carlos Rodriguez',
    nationality: 'Argentina',
    city: 'Buenos Aires',
    country: 'Argentina',
    lat: -34.6037,
    lon: -58.3816,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-4',
    name: 'Diana Park',
    nationality: 'Japan',
    city: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lon: 139.6503,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-5',
    name: 'Emma Wilson',
    nationality: 'France',
    city: 'Paris',
    country: 'France',
    lat: 48.8566,
    lon: 2.3522,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-6',
    name: 'Frank Mueller',
    nationality: 'Germany',
    city: 'Berlin',
    country: 'Germany',
    lat: 52.5200,
    lon: 13.4050,
    privacy_level: 'city',
  },
  {
    userId: 'mock-friend-7',
    name: 'Grace Lee',
    nationality: 'Australia',
    city: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lon: 151.2093,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-8',
    name: 'Hassan Ahmed',
    nationality: 'Singapore',
    city: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-9',
    name: 'Isla Martinez',
    nationality: 'Spain',
    city: 'Madrid',
    country: 'Spain',
    lat: 40.4168,
    lon: -3.7038,
    privacy_level: 'city',
  },
  {
    userId: 'mock-friend-10',
    name: 'Jack Thompson',
    nationality: 'Canada',
    city: 'Toronto',
    country: 'Canada',
    lat: 43.6532,
    lon: -79.3832,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-11',
    name: 'Kenji Tanaka',
    nationality: 'Japan',
    city: 'Tokyo',
    country: 'Japan',
    lat: 35.6895,
    lon: 139.6917,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-12',
    name: 'Liam O\'Brien',
    nationality: 'Ireland',
    city: 'Dublin',
    country: 'Ireland',
    lat: 53.3498,
    lon: -6.2603,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-13',
    name: 'Maria Santos',
    nationality: 'Brazil',
    city: 'São Paulo',
    country: 'Brazil',
    lat: -23.5505,
    lon: -46.6333,
    privacy_level: 'city',
  },
  {
    userId: 'mock-friend-14',
    name: 'Noah Anderson',
    nationality: 'USA',
    city: 'San Francisco',
    country: 'USA',
    lat: 37.7749,
    lon: -122.4194,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-15',
    name: 'Olivia Kim',
    nationality: 'South Korea',
    city: 'Seoul',
    country: 'South Korea',
    lat: 37.5665,
    lon: 126.9780,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-16',
    name: 'Pablo Gomez',
    nationality: 'Mexico',
    city: 'Mexico City',
    country: 'Mexico',
    lat: 19.4326,
    lon: -99.1332,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-17',
    name: 'Quinn Davis',
    nationality: 'USA',
    city: 'Los Angeles',
    country: 'USA',
    lat: 34.0522,
    lon: -118.2437,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-18',
    name: 'Raj Patel',
    nationality: 'India',
    city: 'Mumbai',
    country: 'India',
    lat: 19.0760,
    lon: 72.8777,
    privacy_level: 'city',
  },
  {
    userId: 'mock-friend-19',
    name: 'Sofia Rossi',
    nationality: 'Italy',
    city: 'Rome',
    country: 'Italy',
    lat: 41.9028,
    lon: 12.4964,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-20',
    name: 'Thomas Nguyen',
    nationality: 'Vietnam',
    city: 'Ho Chi Minh City',
    country: 'Vietnam',
    lat: 10.8231,
    lon: 106.6297,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-21',
    name: 'Uma Sharma',
    nationality: 'India',
    city: 'Delhi',
    country: 'India',
    lat: 28.7041,
    lon: 77.1025,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-22',
    name: 'Victor Petrov',
    nationality: 'Russia',
    city: 'Moscow',
    country: 'Russia',
    lat: 55.7558,
    lon: 37.6173,
    privacy_level: 'city',
  },
  {
    userId: 'mock-friend-23',
    name: 'Wendy Chang',
    nationality: 'Taiwan',
    city: 'Taipei',
    country: 'Taiwan',
    lat: 25.0330,
    lon: 121.5654,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-24',
    name: 'Xavier Dubois',
    nationality: 'France',
    city: 'Paris',
    country: 'France',
    lat: 48.8606,
    lon: 2.3376,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-25',
    name: 'Yuki Sato',
    nationality: 'Japan',
    city: 'Osaka',
    country: 'Japan',
    lat: 34.6937,
    lon: 135.5023,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-26',
    name: 'Zara Ali',
    nationality: 'UAE',
    city: 'Dubai',
    country: 'UAE',
    lat: 25.2048,
    lon: 55.2708,
    privacy_level: 'city',
  },
  {
    userId: 'mock-friend-27',
    name: 'Alex Johnson',
    nationality: 'USA',
    city: 'Chicago',
    country: 'USA',
    lat: 41.8781,
    lon: -87.6298,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-28',
    name: 'Bella Zhang',
    nationality: 'China',
    city: 'Beijing',
    country: 'China',
    lat: 39.9042,
    lon: 116.4074,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-29',
    name: 'Chloe Brown',
    nationality: 'Australia',
    city: 'Melbourne',
    country: 'Australia',
    lat: -37.8136,
    lon: 144.9631,
    privacy_level: 'realtime',
  },
  {
    userId: 'mock-friend-30',
    name: 'Daniel Cohen',
    nationality: 'Israel',
    city: 'Tel Aviv',
    country: 'Israel',
    lat: 32.0853,
    lon: 34.7818,
    privacy_level: 'realtime',
  },
];

// Track WebSocket connections
const wsConnections = new Map();
const friendLocations = new Map();

/**
 * Register a mock friend via the API
 */
async function registerFriend(friend) {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: friend.userId,
        name: friend.name,
        nationality: friend.nationality,
      }),
    });

    if (response.ok) {
      console.log(`✅ Registered ${friend.name} (${friend.userId})`);
    } else if (response.status === 400) {
      const data = await response.json();
      if (data.error === 'User already exists') {
        console.log(`ℹ️  ${friend.name} already exists`);
      } else {
        console.warn(`⚠️  Failed to register ${friend.name}:`, data.error);
      }
    } else {
      console.warn(`⚠️  Failed to register ${friend.name}: HTTP ${response.status}`);
    }

    // Update privacy level if different from default
    if (friend.privacy_level && friend.privacy_level !== 'city') {
      await fetch(`${API_URL}/users/${friend.userId}/privacy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy_level: friend.privacy_level }),
      });
    }
  } catch (error) {
    console.error(`❌ Error registering ${friend.name}:`, error.message);
  }
}

/**
 * Create friendship between main user and mock friend
 */
async function createFriendship(mainUserId, friendId) {
  try {
    const response = await fetch(`${API_URL}/users/${mainUserId}/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId }),
    });

    if (response.ok) {
      console.log(`✅ Created friendship: ${mainUserId} ↔ ${friendId}`);
    } else {
      const data = await response.json();
      console.warn(`⚠️  Failed to create friendship:`, data.error);
    }
  } catch (error) {
    console.error(`❌ Error creating friendship:`, error.message);
  }
}

/**
 * Connect mock friend to WebSocket
 */
function connectFriend(friend) {
  return new Promise((resolve, reject) => {
    const wsUrl = `${WS_URL}?userId=${friend.userId}`;
    console.log(`🔌 Connecting ${friend.name} to WebSocket...`);

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log(`✅ ${friend.name} connected to WebSocket`);
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'connected') {
        wsConnections.set(friend.userId, ws);
        friendLocations.set(friend.userId, { lat: friend.lat, lon: friend.lon });
        resolve();
      }
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for ${friend.name}:`, error.message);
      reject(error);
    });

    ws.on('close', () => {
      console.log(`🔌 ${friend.name} disconnected`);
      wsConnections.delete(friend.userId);
    });
  });
}

/**
 * Generate a random movement (small delta for realistic movement)
 */
function getRandomMovement() {
  // Move approximately 10-100 meters (roughly 0.0001 to 0.001 degrees)
  const delta = 0.0001 + Math.random() * 0.0009;
  const direction = Math.random() < 0.5 ? 1 : -1;
  return delta * direction;
}

/**
 * Send location update for a friend
 */
function sendLocationUpdate(friend) {
  const ws = wsConnections.get(friend.userId);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn(`⚠️  ${friend.name} WebSocket not connected`);
    return;
  }

  // Get current location or use starting location
  let location = friendLocations.get(friend.userId);
  if (!location) {
    location = { lat: friend.lat, lon: friend.lon };
  }

  // Add random movement to simulate walking/driving
  location.lat += getRandomMovement();
  location.lon += getRandomMovement();

  // Update stored location
  friendLocations.set(friend.userId, location);

  // Send location update
  const message = {
    type: 'location_update',
    latitude: location.lat,
    longitude: location.lon,
    city: friend.city,
    country: friend.country,
  };

  try {
    ws.send(JSON.stringify(message));
    console.log(`📍 ${friend.name} → (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}) in ${friend.city}`);
  } catch (error) {
    console.error(`❌ Failed to send location for ${friend.name}:`, error.message);
  }
}

/**
 * Main simulation loop
 */
async function main() {
  const mainUserId = process.argv[2];

  if (!mainUserId) {
    console.error('❌ Error: Please provide your userId as an argument');
    console.error('Usage: node simulate-friends.js <your-userId>');
    console.error('Example: node simulate-friends.js 681be344-5808-4717-8e31-d590ca96e783');
    process.exit(1);
  }

  console.log('🚀 Starting Mock Friends Simulator');
  console.log(`📱 Main User ID: ${mainUserId}`);
  console.log(`🌍 Mock Friends: ${MOCK_FRIENDS.length}`);
  console.log(`⏱️  Update Interval: ${UPDATE_INTERVAL}ms\n`);

  // Step 1: Register all mock friends
  console.log('📝 Registering mock friends...');
  for (const friend of MOCK_FRIENDS) {
    await registerFriend(friend);
  }
  console.log('');

  // Step 2: Create friendships
  console.log('🤝 Creating friendships...');
  for (const friend of MOCK_FRIENDS) {
    await createFriendship(mainUserId, friend.userId);
  }
  console.log('');

  // Step 3: Connect all friends to WebSocket
  console.log('🔌 Connecting to WebSocket...');
  const connections = MOCK_FRIENDS.map((friend) => connectFriend(friend));
  await Promise.all(connections);
  console.log('');

  // Step 4: Start sending location updates
  console.log('📍 Starting location updates (every 5 seconds)...\n');

  setInterval(() => {
    console.log(`\n⏰ ${new Date().toISOString()} - Sending location updates...`);
    MOCK_FRIENDS.forEach((friend) => sendLocationUpdate(friend));
  }, UPDATE_INTERVAL);

  // Send initial location update immediately
  console.log(`⏰ ${new Date().toISOString()} - Sending initial location updates...`);
  MOCK_FRIENDS.forEach((friend) => sendLocationUpdate(friend));

  console.log('\n✅ Simulation running! Press Ctrl+C to stop.\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  wsConnections.forEach((ws) => ws.close());
  process.exit(0);
});

// Run the simulation
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
