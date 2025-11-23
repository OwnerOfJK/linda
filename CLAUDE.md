# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Linda is a privacy-focused real-time location tracking app that connects friends worldwide. The project is a monorepo built for ETHGlobal Buenos Aires hackathon, integrating:

- **Self Protocol** for privacy-preserving identity verification
- **Oasis ROFL** (Runtime Off-chain Logic) for confidential computation in a TEE
- **React Native** with Expo for cross-platform mobile development
- **Celo blockchain** for smart contract deployment

**⚠️ MVP-FIRST APPROACH**: This is an MVP project. Keep code simple, minimal, and intuitive. Avoid over-engineering - don't add features/abstractions until they're needed.

## Repository Structure

```
linda/
├── frontend/          # React Native (Expo) mobile app
├── oasis/             # ROFL backend (TypeScript + Express + WebSocket + SQLite)
├── backend/           # Legacy backend (superseded by oasis/)
├── contracts/         # Solidity contracts (Foundry) for Self Protocol
├── CONNECT.md         # Frontend-backend integration guide
└── TESTING.md         # Testing guide with detailed flow
```

## Development Commands

### Frontend (React Native + Expo)

```bash
cd frontend
npm install
npm start          # Start Expo dev server with tunnel
npm run android    # Launch on Android emulator
npm run ios        # Launch on iOS simulator
npm run web        # Launch in web browser
npm run lint       # Run ESLint
```

### Oasis Backend (Primary - ROFL TEE)

```bash
cd oasis
npm install
npm run dev        # Development mode with ts-node
npm run build      # Compile TypeScript
npm start          # Run production build

# Docker (recommended for local development)
docker compose up --build

# Test the API
node test.js
./test-api.sh
node test-websocket.js
```

### Contracts (Foundry + Solidity)

```bash
cd contracts
npm install              # Install Node dependencies
forge install            # Install Solidity dependencies

# Development
forge build              # Compile contracts
forge test               # Run tests
forge fmt                # Format Solidity code
forge coverage           # Generate coverage report

# Linting
npm run lint             # Run Solhint + Prettier check
npm run prettier:write   # Format JSON/MD/YAML files

# Deployment
cp .env.example .env     # Configure environment
./script/deploy-proof-of-human.sh
```

## Architecture

### High-Level Data Flow

```
Mobile App (React Native)
    ↓ HTTPS/WSS
Backend API (Express + WebSocket in ROFL TEE)
    ↓ SQLite (encrypted in TEE)
Privacy-controlled location sharing
    ↓ WebSocket broadcast
Real-time updates to friends
```

### Component Interactions

1. **Authentication**: Self Protocol → Smart Contract → Frontend stores userId
2. **Registration**: Frontend → Oasis Backend → SQLite (creates user)
3. **Location Updates**: Frontend → WebSocket → Backend → Broadcast to friends
4. **Privacy Enforcement**: Backend checks user's `privacy_level` before broadcasting
5. **Friend Management**: REST API (add/remove) → Frontend refetches via GET

## Key Integration Points

### Frontend ↔ Backend Communication

**Environment Configuration** (`frontend/.env.local`):
```env
EXPO_PUBLIC_API_URL=http://localhost:3000        # REST API
EXPO_PUBLIC_WS_URL=ws://localhost:3000/ws        # WebSocket
```

**Platform-specific URLs**:
- iOS Simulator: `http://localhost:3000`
- Android Emulator: `http://10.0.2.2:3000`
- Physical Device: Use ngrok or local network IP

**Service Layer** (`frontend/services/`):
- All backend calls go through service functions
- WebSocket managed by `websocket.service.ts`
- REST API calls in `auth.service.ts`, `user.service.ts`, `location.service.ts`

### Backend Architecture

**Database Schema** (SQLite in `/root/.my-volume/linda.db`):
```sql
users (userId, name, nationality, gender, verified, privacy_level, created_at, updated_at)
locations (userId, latitude, longitude, city, country, updated_at)
friendships (id, userId, friendId, created_at)
```

**Privacy Levels**:
- `realtime`: Share exact GPS coordinates
- `city`: Share only city/country (latitude/longitude = null)

**WebSocket Protocol**:
- Connection: `ws://backend/ws?userId={userId}`
- Client→Server: `location_update`, `ping`
- Server→Client: `friend_location`, `sync`, `connected`, `pong`

**REST Endpoints**:
- `POST /users/register` - Register new user
- `GET /users/:userId` - Get user profile
- `PUT /users/:userId/privacy` - Update privacy level
- `POST /users/:userId/location` - Update location
- `GET /users/:userId/friends` - List friends
- `GET /users/:userId/friends/locations` - Get friends' locations (privacy-aware)
- `POST /users/:userId/friends` - Add friend (bidirectional)
- `DELETE /users/:userId/friends/:friendId` - Remove friend

### Smart Contracts

**ProofOfHuman.sol** extends `SelfVerificationRoot`:
- Privacy-preserving identity verification via Self Protocol
- Age verification (18+)
- Country restriction enforcement
- Deployed on Celo Sepolia (testnet) and Celo Mainnet

**Deployment Networks**:
- Celo Sepolia: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74` (Hub)
- Celo Mainnet: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF` (Hub)

## Testing Integration

### Full Stack Testing Flow

1. **Start Backend**:
   ```bash
   cd oasis
   docker compose up
   # or npm run dev
   ```

2. **Verify Backend**:
   ```bash
   curl http://localhost:3000/
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   # Press 'a' for Android, 'i' for iOS
   ```

4. **Test User Flow**:
   - Click "DevLogin" (bypasses Self Protocol for testing)
   - App navigates to location preference screen
   - WebSocket auto-connects (check console logs)
   - Go to Settings > Friends > Tap flask icon to simulate friend movement

5. **Verify Real-time Updates**:
   - Backend broadcasts location update via WebSocket
   - Frontend receives `friend_location` message
   - Map marker updates automatically (no refresh needed)

### Testing Scripts

**Backend API**: `oasis/test-api.sh`
**WebSocket**: `oasis/test-websocket.js`
**Comprehensive**: `oasis/test.js` (includes all endpoints)

## Important Implementation Details

### Frontend Context Hierarchy

```
SessionProvider (authentication)
  └─ UserProvider (user location + privacy)
       └─ FriendsProvider (friends list + WebSocket)
```

**Contexts**:
- `SessionProvider` (`components/ctx.tsx`): Auth state, route guards
- `UserProvider` (`context/UserContext.tsx`): User location, privacy level, WebSocket init
- `FriendsProvider` (`context/FriendsContext.tsx`): Friends list, WebSocket listeners

### Frontend Routing (Expo Router)

- **Protected Routes**: `app/(app)/*` require authentication
- **Public Routes**: `app/sign-in.tsx` only accessible when logged out
- **Route Guards**: Automatic redirects based on session state

### Backend Privacy Enforcement

```typescript
// Example: Broadcasting location update
if (user.privacy_level === 'city') {
  // Send city/country only, no coordinates
  broadcast({ userId, city, country, latitude: null, longitude: null });
} else {
  // Send full coordinates
  broadcast({ userId, latitude, longitude, city, country });
}
```

### ROFL Deployment

**Configuration** (`oasis/rofl.yaml`):
```yaml
name: linda-backend
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
```

**Deploy to ROFL**:
```bash
cd oasis
oasis rofl deploy
```

## Security & Privacy Model

### TEE Guarantees (Oasis ROFL)
- Encrypted database (SQLite encrypted at rest in TEE)
- Confidential computation (code runs inside trusted execution environment)
- Verifiable code via remote attestation
- Tamper-evident execution

### Privacy Controls
- Friend-only location sharing
- Per-user privacy level (city vs realtime)
- No location history (only current location stored)
- Privacy enforcement happens 100% inside TEE

### Authentication (MVP - Simplified)
- Self Protocol identity verification during registration
- `userId` stored locally in frontend (SecureStore on native, localStorage on web)
- WebSocket auth via `userId` query parameter
- Bidirectional friendships (both users must add each other)

## Common Troubleshooting

### "Network request failed" on Android
**Issue**: Android emulator can't reach `localhost`
**Fix**: Use `http://10.0.2.2:3000` in `.env.local`

### WebSocket disconnects immediately
**Issue**: Missing or invalid `userId` in connection URL
**Fix**: Ensure `userId` is set before calling `websocketService.connect(userId)`

### Friends not updating in real-time
**Issue**: WebSocket listeners not configured
**Fix**: Verify `websocketService.onFriendLocation()` is called in `FriendsContext`

### Backend database not persisting
**Issue**: Docker volume not mounted
**Fix**: Verify `compose.yaml` has volume mount: `/root/.my-volume`

### Self Protocol verification failing
**Issue**: Wrong hub address or network
**Fix**: Check `.env` has correct `IDENTITY_VERIFICATION_HUB_ADDRESS` for network

## MVP Development Guidelines

1. **Keep it simple**: Build the most basic version first
2. **Inline first**: Write code inline, extract to functions/components only when duplicated 2-3 times
3. **Avoid premature abstraction**: Don't create utilities until you need them multiple times
4. **Tailwind over StyleSheet**: Use `className` with Tailwind classes in React Native
5. **Flat over nested**: Prefer flat structures and simple code
6. **Question complexity**: If something feels over-engineered, it probably is

## Documentation References

- Frontend: `frontend/CLAUDE.md` - Detailed React Native architecture
- Backend: `oasis/CLAUDE.md` - ROFL backend architecture
- Integration: `CONNECT.md` - Frontend-backend connection guide
- Testing: `TESTING.md` - End-to-end testing procedures
- Contracts: `contracts/README.md` - Smart contract deployment
