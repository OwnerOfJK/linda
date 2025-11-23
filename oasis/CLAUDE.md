# Linda Backend – ROFL Architecture Guide

## MVP Principles

**This is an MVP (Minimum Viable Product) implementation. When working on this backend:**

- Keep code simple, minimal, and intuitive
- Avoid over-engineering - don't add features/abstractions until they're needed
- Prefer simple solutions over complex ones
- Focus on core functionality: real-time location sharing with privacy controls
- Authentication kept simple for MVP: store userId locally, no session/token management

---

## Overview

Linda's backend runs inside an Oasis ROFL (Runtime Off-chain Logic) container — a Trusted Execution Environment (TEE) that provides:

- Privacy: Data encrypted inside the TEE
- Verifiability: Remote attestation proves exact code running in the TEE
- Security: Cryptographic guarantees about data integrity
- Persistence: Encrypted storage that survives container restarts

---

## Architecture

    React Native Frontend (Mobile App)
            ↓ HTTPS/WebSocket
    Oasis Network (Public Gateway)
            ↓ aTLS (Attested TLS)
    ROFL Container (TEE)
        ├─ Node.js/TypeScript Backend
        ├─ Express + WebSocket Server
        ├─ SQLite Database (Encrypted)
        └─ Oasis Sapphire Integration (Optional)

---

## Technology Stack

- Runtime: Node.js 18+ (TypeScript)
- Web Framework: Express.js
- Real-time: WebSockets (ws library)
- Database: SQLite (better-sqlite3)
- Storage: ROFL persistent volume (/root/.my-volume)
- Network: Oasis ROFL network with aTLS

---

# Database Schema

## 1. Users Table

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

    CREATE INDEX idx_users_verified ON users(verified);

---

## 2. Locations Table

    CREATE TABLE locations (
      userId TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      city TEXT,
      country TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );

    CREATE INDEX idx_locations_updated ON locations(updated_at);

---

## 3. Friendships Table

    CREATE TABLE friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      friendId TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
      FOREIGN KEY (friendId) REFERENCES users(userId) ON DELETE CASCADE,
      UNIQUE(userId, friendId)
    );

    CREATE INDEX idx_friendships_user ON friendships(userId);
    CREATE INDEX idx_friendships_friend ON friendships(friendId);

---

# REST API

## POST /users/register
Registers a new user.

Body:
    { userId, name, nationality, gender, actionNullifier? }

Optional: verify actionNullifier via Celo RPC for Self Protocol identity verification.

---

## GET /users/:userId  
Returns profile.

---

## PUT /users/:userId/privacy
Update privacy level.

Body:
    { "privacy_level": "city" | "realtime" }

---

## GET /users/:userId/friends
Returns all friends with their basic info and city.

Response:
    [{ userId, name, city, country }]

---

## POST /users/:userId/location
Updates a user's location and broadcasts via WebSocket.

Body:  
    { latitude, longitude, city?, country? }

---

## GET /users/:userId/friends/locations  
Returns all friends’ locations (respecting privacy).

---

## POST /users/:userId/friends  
Create a bidirectional friendship.

Body:  
    { friendId }

---

## DELETE /users/:userId/friends/:friendId  
Remove friendship.

---

# WebSocket API

Connection:  
    wss://linda/ws?userId={userId}

---

## Client → Server Messages

Location update:

    {
      type: "location_update",
      latitude: number,
      longitude: number,
      city?: string,
      country?: string
    }

Heartbeat:

    { type: "ping" }

---

## Server → Client Messages

Friend location update:

    {
      type: "friend_location",
      userId: string,
      name: string,
      latitude: number | null,
      longitude: number | null,
      city: string,
      country: string,
      privacy_level: "city" | "realtime",
      timestamp: string
    }

Initial sync:

    {
      type: "sync",
      friends: [...]
    }

Connected:

    { type: "connected", userId }

Pong:

    { type: "pong" }

---

# Core Functionality

## 1. User Registration Flow

1. Frontend gets actionNullifier + userId from Self Protocol  
2. Backend optionally verifies actionNullifier  
3. Backend inserts the user  
4. Returns user object  

---

## 2. Real-Time Location Broadcasting

Flow:

1. User sends location_update  
2. ROFL updates SQLite  
3. ROFL finds all friends of user  
4. Applies privacy rules  
5. Broadcasts location to each friend’s WebSocket connection  

---

## 3. Privacy Enforcement

    if (privacy_level === "city"):
        → send city/country only
    else:
        → send full coordinates

---

## 4. Friend Management

- Adding a friend creates 2 rows (bidirectional) via REST API
- Removing deletes both rows via REST API
- Friend management is REST-only (not real-time via WebSocket)
- After add/remove, frontend refetches friend list via GET /users/:userId/friends

---

## 5. Connection Management

Connections stored as:  
    Map<userId, WebSocket>

On connect:
- authenticate user  
- send initial sync  
- store connection  

On disconnect:
- remove connection  
- location kept in DB  

---

# Data Flow Examples

## Example: User A Moves

1. A sends location_update  
2. DB updates  
3. System finds A's friends  
4. Applies privacy  
5. Broadcasts update  
6. Friends' apps update  

---

## Example: User B switches to city-only

1. PUT /users/B/privacy  
2. DB updates  
3. New updates show city-only data  

---

## Example: User C adds D

1. POST /users/C/friends
2. DB inserts bidirectional links
3. Frontend refetches friend list via GET /users/C/friends
4. They now share real-time locations via WebSocket

---

# Security & Privacy Guarantees

TEE guarantees:

- Encrypted database  
- Confidential computation  
- Verifiable code via attestation  
- Tamper-evident execution  

Privacy model:

- Friend-only location sharing  
- Per-user privacy level  
- No location history (only current)  
- Enforced 100% inside TEE  

Authentication (MVP - Simple Approach):

- Self Protocol identity verification during registration
- Action-nullifier included in registration (optional verification)
- userId stored locally in frontend (no session/token management for MVP)
- WebSocket authentication via userId query parameter (simple for MVP)
- Double-confirmed friendships (bidirectional)

---

# Deployment

## Docker compose (dev)

    services:
      backend:
        build: .
        platform: linux/amd64
        volumes:
          - my-volume:/root/.my-volume
          - /run/rofl-appd.sock:/run/rofl-appd.sock
        ports:
          - "3000:3000"
        environment:
          - NODE_ENV=production

    volumes:
      my-volume:

---

## ROFL Deployment (production)

    name: linda-backend
    version: 1.0.0
    tee: tdx
    kind: container
    resources:
      memory: 2048
      cpus: 2
      storage:
        kind: disk-persistent
        size: 5000
    artifacts:
      container:
        compose: compose.yaml
    deployments:
      testnet:
        network: testnet
        paratime: sapphire

Deploy:

    oasis rofl deploy

---

# Performance Considerations

- Indexes for all relationships  
- Persistent SQLite connection  
- Broadcast map via in-memory Map  
- Recommended update interval: 10–30s  
- Movement threshold recommended: >100m  

---

# Testing

Local:

    docker compose up  
    npm test  
    wscat ws://localhost:3000/ws?userId=test

Integration:
- Mock Self Protocol  
- WS multi-client tests  
- Privacy enforcement tests  
- Friendship workflows  

ROFL testnet:
- Deploy  
- Verify attestation  
- Restart container to verify persistence  