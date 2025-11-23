import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import url from 'url';

const app = express();
const PORT = 3000;

// Database path in persistent volume
const DB_PATH = process.env.DB_PATH || '/root/.my-volume/linda.db';

// Middleware
app.use(cors());
app.use(express.json());

// Types
type PrivacyLevel = 'city' | 'realtime';

interface User {
  userId: string;
  name: string;
  nationality?: string;
  gender?: string;
  verified: number;
  privacy_level: PrivacyLevel;
  created_at: string;
  updated_at: string;
}

interface Location {
  userId: string;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  updated_at: string;
}

interface Friendship {
  id: number;
  userId: string;
  friendId: string;
  created_at: string;
}

// WebSocket connection map
const wsConnections = new Map<string, WebSocket>();

// Initialize database
function initDatabase(): Database.Database {
  // Ensure directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      userId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nationality TEXT,
      gender TEXT,
      verified INTEGER DEFAULT 1,
      privacy_level TEXT DEFAULT 'city',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
  `);

  // Create locations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      userId TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      city TEXT,
      country TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_locations_updated ON locations(updated_at);
  `);

  // Create friendships table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      friendId TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
      FOREIGN KEY (friendId) REFERENCES users(userId) ON DELETE CASCADE,
      UNIQUE(userId, friendId)
    );
    CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(userId);
    CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friendId);
  `);

  console.log(`✅ Database initialized at ${DB_PATH}`);
  return db;
}

// Initialize database connection
const db = initDatabase();

// Helper: Get friends' locations with privacy enforcement
function getFriendsLocationsWithPrivacy(userId: string) {
  const stmt = db.prepare(`
    SELECT
      u.userId,
      u.name,
      u.privacy_level,
      l.latitude,
      l.longitude,
      l.city,
      l.country,
      l.updated_at as timestamp
    FROM friendships f
    JOIN users u ON f.friendId = u.userId
    LEFT JOIN locations l ON u.userId = l.userId
    WHERE f.userId = ?
  `);

  const friends = stmt.all(userId) as any[];

  return friends.map((friend) => ({
    userId: friend.userId,
    name: friend.name,
    privacy_level: friend.privacy_level,
    // Apply privacy rules
    latitude: friend.privacy_level === 'realtime' ? friend.latitude : null,
    longitude: friend.privacy_level === 'realtime' ? friend.longitude : null,
    city: friend.city || 'Unknown',
    country: friend.country || 'Unknown',
    timestamp: friend.timestamp || new Date().toISOString(),
  }));
}

// Helper: Broadcast location update to user's friends
function broadcastLocationToFriends(userId: string) {
  // Get user info and location
  const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId) as User | undefined;
  if (!user) return;

  const location = db.prepare('SELECT * FROM locations WHERE userId = ?').get(userId) as Location | undefined;
  if (!location) return;

  // Find all friends of this user
  const friends = db
    .prepare('SELECT friendId FROM friendships WHERE userId = ?')
    .all(userId) as { friendId: string }[];

  // Create location update message with privacy enforcement
  const message = {
    type: 'friend_location',
    userId: user.userId,
    name: user.name,
    privacy_level: user.privacy_level,
    latitude: user.privacy_level === 'realtime' ? location.latitude : null,
    longitude: user.privacy_level === 'realtime' ? location.longitude : null,
    city: location.city || 'Unknown',
    country: location.country || 'Unknown',
    timestamp: location.updated_at,
  };

  // Send to each friend's websocket connection
  friends.forEach(({ friendId }) => {
    const ws = wsConnections.get(friendId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      console.log(`📤 Sent location update to friend ${friendId}`);
    }
  });
}

// Routes

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Linda ROFL Backend',
    version: '1.0.0',
    status: 'running',
    database: DB_PATH,
    connections: wsConnections.size,
  });
});

// POST /users/register - Register user
app.post('/users/register', (req: Request, res: Response) => {
  try {
    const { userId, name, nationality, gender, actionNullifier } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    // Check if user exists
    const existing = db.prepare('SELECT userId FROM users WHERE userId = ?').get(userId);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Optional: Verify actionNullifier via Celo RPC
    // TODO: Implement Self Protocol verification when needed
    if (actionNullifier) {
      console.log('📝 ActionNullifier received:', actionNullifier);
    }

    // Insert user
    db.prepare(`
      INSERT INTO users (userId, name, nationality, gender)
      VALUES (?, ?, ?, ?)
    `).run(userId, name, nationality || null, gender || null);

    // Return user
    const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId) as User;
    res.json({
      userId: user.userId,
      name: user.name,
      nationality: user.nationality,
      gender: user.gender,
      privacy_level: user.privacy_level,
      verified: Boolean(user.verified),
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /users/:userId - Get user profile
app.get('/users/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId) as User | undefined;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const location = db.prepare('SELECT * FROM locations WHERE userId = ?').get(userId) as Location | undefined;

    res.json({
      userId: user.userId,
      name: user.name,
      nationality: user.nationality,
      gender: user.gender,
      privacy_level: user.privacy_level,
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      city: location?.city || '',
      country: location?.country || '',
      timestamp: location?.updated_at || null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /users/:userId/privacy - Update privacy level
app.put('/users/:userId/privacy', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { privacy_level } = req.body;

    if (!privacy_level || !['city', 'realtime'].includes(privacy_level)) {
      return res.status(400).json({ error: 'Invalid privacy_level. Must be "city" or "realtime"' });
    }

    const user = db.prepare('SELECT userId FROM users WHERE userId = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare(`
      UPDATE users
      SET privacy_level = ?, updated_at = datetime('now')
      WHERE userId = ?
    `).run(privacy_level, userId);

    res.json({ success: true, privacy_level });
  } catch (error) {
    console.error('Error updating privacy:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /users/:userId/location - Update location (also broadcasts via WebSocket)
app.post('/users/:userId/location', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { latitude, longitude, city, country } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const user = db.prepare('SELECT userId FROM users WHERE userId = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Upsert location
    db.prepare(`
      INSERT INTO locations (userId, latitude, longitude, city, country)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        latitude = ?,
        longitude = ?,
        city = ?,
        country = ?,
        updated_at = datetime('now')
    `).run(userId, latitude, longitude, city || null, country || null, latitude, longitude, city || null, country || null);

    // Broadcast to friends via WebSocket
    broadcastLocationToFriends(userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /users/:userId/friends - Get friends list with city
app.get('/users/:userId/friends', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const friends = db.prepare(`
      SELECT
        u.userId,
        u.name,
        l.city,
        l.country
      FROM friendships f
      JOIN users u ON f.friendId = u.userId
      LEFT JOIN locations l ON u.userId = l.userId
      WHERE f.userId = ?
    `).all(userId);

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /users/:userId/friends/locations - Get friends' locations (with privacy)
app.get('/users/:userId/friends/locations', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const locations = getFriendsLocationsWithPrivacy(userId);
    res.json(locations);
  } catch (error) {
    console.error('Error fetching friends locations:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /users/:userId/friends - Add friend (bidirectional)
app.post('/users/:userId/friends', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'friendId is required' });
    }

    if (userId === friendId) {
      return res.status(400).json({ error: 'Cannot add yourself as friend' });
    }

    // Check both users exist
    const user = db.prepare('SELECT userId FROM users WHERE userId = ?').get(userId);
    const friend = db.prepare('SELECT userId FROM users WHERE userId = ?').get(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert bidirectional friendship
    const insertStmt = db.prepare('INSERT OR IGNORE INTO friendships (userId, friendId) VALUES (?, ?)');
    insertStmt.run(userId, friendId);
    insertStmt.run(friendId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /users/:userId/friends/:friendId - Remove friend (bidirectional)
app.delete('/users/:userId/friends/:friendId', (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.params;

    // Delete both directions
    db.prepare('DELETE FROM friendships WHERE userId = ? AND friendId = ?').run(userId, friendId);
    db.prepare('DELETE FROM friendships WHERE userId = ? AND friendId = ?').run(friendId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /test/simulate-friend-move - Test endpoint to simulate friend location update
app.post('/test/simulate-friend-move', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user exists
    const user = db.prepare('SELECT userId FROM users WHERE userId = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Random test locations
    const testLocations = [
      { latitude: 40.7128, longitude: -74.006, city: 'New York', country: 'USA' },
      { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
      { latitude: 48.8566, longitude: 2.3522, city: 'Paris', country: 'France' },
      { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
      { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' },
    ];

    const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];

    // Update location
    db.prepare(`
      INSERT INTO locations (userId, latitude, longitude, city, country)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        latitude = ?,
        longitude = ?,
        city = ?,
        country = ?,
        updated_at = datetime('now')
    `).run(
      userId,
      randomLocation.latitude,
      randomLocation.longitude,
      randomLocation.city,
      randomLocation.country,
      randomLocation.latitude,
      randomLocation.longitude,
      randomLocation.city,
      randomLocation.country
    );

    console.log(`🧪 TEST: Updated ${userId} location to ${randomLocation.city}`);

    // Broadcast to friends via WebSocket
    broadcastLocationToFriends(userId);

    res.json({
      success: true,
      userId,
      location: randomLocation,
      message: `${userId} moved to ${randomLocation.city}, ${randomLocation.country}`,
    });
  } catch (error) {
    console.error('Error simulating friend move:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  // Parse userId from query params
  const parsedUrl = url.parse(req.url || '', true);
  const userId = parsedUrl.query.userId as string;

  if (!userId) {
    ws.close(1008, 'userId required');
    return;
  }

  console.log(`🔌 WebSocket connected: ${userId}`);

  // Store connection
  wsConnections.set(userId, ws);

  // Send connected confirmation
  ws.send(JSON.stringify({ type: 'connected', userId }));

  // Send initial sync with friends' locations
  const friendsLocations = getFriendsLocationsWithPrivacy(userId);
  ws.send(JSON.stringify({ type: 'sync', friends: friendsLocations }));

  // Handle incoming messages
  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'location_update':
          // Update location in database
          const { latitude, longitude, city, country } = message;

          if (latitude === undefined || longitude === undefined) {
            ws.send(JSON.stringify({ type: 'error', message: 'latitude and longitude required' }));
            return;
          }

          // Upsert location
          db.prepare(`
            INSERT INTO locations (userId, latitude, longitude, city, country)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(userId) DO UPDATE SET
              latitude = ?,
              longitude = ?,
              city = ?,
              country = ?,
              updated_at = datetime('now')
          `).run(userId, latitude, longitude, city || null, country || null, latitude, longitude, city || null, country || null);

          console.log(`📍 Location updated for ${userId}`);

          // Broadcast to friends
          broadcastLocationToFriends(userId);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log(`⚠️ Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    console.log(`👋 WebSocket disconnected: ${userId}`);
    wsConnections.delete(userId);
  });

  // Handle error
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${userId}:`, error);
    wsConnections.delete(userId);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Linda ROFL Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready at ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  wss.clients.forEach((client) => client.close());
  db.close();
  process.exit(0);
});
