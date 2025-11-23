# Linda ROFL Backend - User Registration POC

Basic proof of concept for Linda backend running in ROFL with SQLite.

## Features

- ✅ TypeScript + Express
- ✅ SQLite database in persistent volume
- ✅ User registration
- ✅ User retrieval
- ✅ RESTful API

## Quick Start

### 1. Build and Run with Docker Compose

```bash
cd backend
docker compose up --build
```

The backend will be available at `http://localhost:3000`.

### 2. Test the API

In another terminal:

```bash
# Run the test script
node test.js
```

Expected output:
```
🧪 Starting Linda ROFL Backend Tests

1️⃣  Testing service health...
✅ Service is running
   Version: 0.1.0
   Database: /root/.my-volume/linda.db

2️⃣  Registering new user...
✅ User registered successfully
   User ID: 123e4567-e89b-12d3-a456-426614174000
   Name: Juan Larraya
   Nationality: Argentina
   Verified: true
   Created: 2024-01-15 10:30:45

3️⃣  Retrieving user...
✅ User retrieved successfully
   User ID: 123e4567-e89b-12d3-a456-426614174000
   Name: Juan Larraya
   Match: ✓

4️⃣  Listing all users...
✅ Users listed successfully
   Total users: 1
   1. Juan Larraya (123e4567...)

5️⃣  Testing duplicate user prevention...
✅ Duplicate user correctly rejected
   Error: User already exists

🎉 All tests completed successfully!
```

### 3. Manual API Testing

```bash
# Check service status
curl http://localhost:3000/

# Register a user
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "name": "Test User",
    "nationality": "Argentina",
    "gender": "male"
  }'

# Get user
curl http://localhost:3000/users/test-user-123

# List all users
curl http://localhost:3000/users
```

## API Endpoints

### GET /
Health check and service info

### POST /users/register
Register a new user

**Body:**
```json
{
  "userId": "string (required)",
  "name": "string (required)",
  "nationality": "string (optional)",
  "gender": "string (optional)"
}
```

**Response:**
```json
{
  "userId": "string",
  "name": "string",
  "nationality": "string | null",
  "gender": "string | null",
  "verified": true,
  "created_at": "ISO timestamp"
}
```

### GET /users/:userId
Get user by ID

### GET /users
List all users

## Database

SQLite database stored at `/root/.my-volume/linda.db`

**Schema:**
```sql
CREATE TABLE users (
  userId TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nationality TEXT,
  gender TEXT,
  verified INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Run in dev mode with ts-node
npm run dev
```

### Build TypeScript

```bash
npm run build
npm start
```

## Next Steps

- [ ] Add location endpoints
- [ ] Add friendship management
- [ ] Add WebSocket support for real-time updates
- [ ] Add Self Protocol verification
- [ ] Add proper error handling
- [ ] Add input validation

## ROFL Deployment

This backend is designed to run in Oasis ROFL. The Docker compose configuration includes:
- Persistent volume for SQLite (`/root/.my-volume`)
- ROFL appd socket mount (`/run/rofl-appd.sock`)
- Port exposure for HTTP access

To deploy to ROFL testnet, update `rofl.yaml` and follow the [Oasis ROFL deployment guide](https://docs.oasis.io/build/rofl).
