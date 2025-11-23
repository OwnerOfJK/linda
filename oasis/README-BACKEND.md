# Linda ROFL Backend

Privacy-focused location sharing backend running in Oasis ROFL (Trusted Execution Environment).

## Features

✅ **Complete REST API** - User management, friends, privacy controls
✅ **Real-time WebSocket** - Live location updates with privacy enforcement
✅ **SQLite Database** - Persistent storage with encryption (in ROFL)
✅ **Privacy Enforcement** - City-level or real-time sharing
✅ **Bidirectional Friendships** - Automatic two-way relationships
✅ **Docker Ready** - Local development and ROFL deployment

---

## Quick Start

### 1. Install Dependencies

```bash
cd oasis
npm install
```

### 2. Run Locally (Development)

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### 3. Run with Docker

```bash
docker compose up --build
```

### 4. Test the API

```bash
chmod +x test-api.sh
./test-api.sh
```

---

## API Endpoints

### User Management

**Register User**
```http
POST /users/register
Content-Type: application/json

{
  "userId": "alice",
  "name": "Alice Johnson",
  "nationality": "USA",
  "gender": "female",
  "actionNullifier": "optional-self-protocol-nullifier"
}
```

**Get User Profile**
```http
GET /users/:userId
```

**Update Privacy Level**
```http
PUT /users/:userId/privacy
Content-Type: application/json

{
  "privacy_level": "city" | "realtime"
}
```

### Location

**Update Location** (also broadcasts to friends via WebSocket)
```http
POST /users/:userId/location
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "city": "New York",
  "country": "USA"
}
```

**Get Friends' Locations** (with privacy enforcement)
```http
GET /users/:userId/friends/locations
```

### Friends

**Get Friends List**
```http
GET /users/:userId/friends
```

**Add Friend** (bidirectional)
```http
POST /users/:userId/friends
Content-Type: application/json

{
  "friendId": "bob"
}
```

**Remove Friend** (bidirectional)
```http
DELETE /users/:userId/friends/:friendId
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws?userId=alice');
```

### Client → Server Messages

**Location Update:**
```json
{
  "type": "location_update",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "city": "New York",
  "country": "USA"
}
```

**Heartbeat:**
```json
{
  "type": "ping"
}
```

### Server → Client Messages

**Connected:**
```json
{
  "type": "connected",
  "userId": "alice"
}
```

**Initial Sync:**
```json
{
  "type": "sync",
  "friends": [
    {
      "userId": "bob",
      "name": "Bob Smith",
      "privacy_level": "realtime",
      "latitude": 51.5074,
      "longitude": -0.1278,
      "city": "London",
      "country": "UK",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**Friend Location Update:**
```json
{
  "type": "friend_location",
  "userId": "bob",
  "name": "Bob Smith",
  "privacy_level": "city",
  "latitude": null,
  "longitude": null,
  "city": "London",
  "country": "UK",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Pong:**
```json
{
  "type": "pong"
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  userId TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nationality TEXT,
  gender TEXT,
  verified INTEGER DEFAULT 1,
  privacy_level TEXT DEFAULT 'city',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Locations Table
```sql
CREATE TABLE locations (
  userId TEXT PRIMARY KEY,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  city TEXT,
  country TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
);
```

### Friendships Table
```sql
CREATE TABLE friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  friendId TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  FOREIGN KEY (friendId) REFERENCES users(userId) ON DELETE CASCADE,
  UNIQUE(userId, friendId)
);
```

---

## Privacy Enforcement

Privacy levels are enforced both in REST API and WebSocket:

**City Mode (`privacy_level: 'city'`)**
- Friends see only city and country
- `latitude` and `longitude` are set to `null`

**Real-time Mode (`privacy_level: 'realtime'`)**
- Friends see exact GPS coordinates
- All fields are populated

Privacy enforcement happens at:
1. `GET /users/:userId/friends/locations` endpoint
2. WebSocket `sync` message (initial connection)
3. WebSocket `friend_location` broadcasts

---

## Testing WebSocket

### Using wscat

Install wscat:
```bash
npm install -g wscat
```

Connect:
```bash
wscat -c 'ws://localhost:3000/ws?userId=alice'
```

Send location update:
```json
{"type":"location_update","latitude":40.7128,"longitude":-74.0060,"city":"New York","country":"USA"}
```

Send ping:
```json
{"type":"ping"}
```

---

## Environment Variables

- `DB_PATH` - Database file path (default: `/root/.my-volume/linda.db`)
- `PORT` - Server port (default: `3000`)

---

## ROFL Deployment

Deploy to Oasis testnet:

```bash
oasis rofl deploy
```

Configuration is in `rofl.yaml`:
- Platform: TDX (Trusted Execution Environment)
- Memory: 2GB
- CPUs: 2
- Storage: 5GB persistent disk

---

## Development

**Build:**
```bash
npm run build
```

**Start (production):**
```bash
npm start
```

**Development mode:**
```bash
npm run dev
```

---

## Architecture

```
React Native App
      ↓
   REST API + WebSocket
      ↓
  Express Server
      ↓
SQLite Database (encrypted in ROFL)
```

**Key Features:**
- In-memory WebSocket connection map for real-time broadcasts
- Privacy enforcement at query level
- Bidirectional friendship management
- Atomic location updates with friend notifications

---

## Security

In ROFL deployment:
- ✅ Encrypted database inside TEE
- ✅ Verifiable code via attestation
- ✅ Tamper-evident execution
- ✅ aTLS for client connections

For MVP:
- Simple userId-based WebSocket auth
- No session tokens (Self Protocol handles identity)
- actionNullifier verification placeholder (implement when needed)

---

## Next Steps

1. **Test locally** with Docker
2. **Connect frontend** (uncomment service calls)
3. **Deploy to ROFL testnet**
4. **Add Self Protocol verification** for actionNullifier
5. **Implement proper WebSocket auth** with tokens

---

## Support

For issues or questions, see:
- Main docs: `CLAUDE.md`
- Test script: `test-api.sh`
- Docker setup: `compose.yaml`
