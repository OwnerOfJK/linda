# Connecting Frontend to Backend

This document outlines the step-by-step action plan for connecting the React Native frontend to the Oasis ROFL backend.

## Status

- **Backend**: ✅ Fully operational (REST + WebSocket tested)
- **Frontend**: ✅ Types refactored to match backend
- **Services**: ✅ All REST API calls activated
- **WebSocket**: ✅ Integrated in UserContext and FriendsContext
- **Configuration**: ✅ `.env.local` and `config.ts` configured
- **Integration**: ✅ **COMPLETE** - Ready for testing

## ✅ Completed Integration Steps

### Phase 1: Environment Configuration
- ✅ `.env.local` already exists with API_URL and WS_URL
- ✅ `constants/config.ts` already configured to read from environment

### Phase 2: REST API Activation
- ✅ `auth.service.ts` - `registerUser()` activated
- ✅ `location.service.ts` - `getFriendsLocations()` activated
- ✅ `user.service.ts` - All functions already activated (`getProfile`, `updatePrivacy`, `getFriends`, `addFriend`, `removeFriend`)

### Phase 3: WebSocket Integration
- ✅ `UserContext.tsx` - WebSocket initialization added with userId from storage
- ✅ `UserContext.tsx` - Event listeners for connected/disconnected/error added
- ✅ `UserContext.tsx` - `setUserLocation` already sends via WebSocket
- ✅ `FriendsContext.tsx` - WebSocket listeners already configured (`onFriendLocation`, `onSync`)
- ✅ `websocket.service.ts` - Already has reconnection logic with exponential backoff

## Next: Testing the Integration

The integration is complete. You can now test the full flow.

---

## Prerequisites

### Backend Running

```bash
cd oasis
npm run dev
```

Server should be running at `http://localhost:3000`

Verify with:
```bash
curl http://localhost:3000/
```

### Frontend Setup

```bash
cd frontend
npm install
```

---

## Action Plan

### Phase 1: Environment Configuration

**File**: `frontend/.env.local` (create if missing)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000/ws
```

**Why**: Centralized API endpoint configuration

**Changes needed**:
1. Create `.env.local` file in `frontend/` directory
2. Add both REST and WebSocket URLs
3. Update `frontend/constants/config.ts` to read from environment:
   ```typescript
   export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
   export const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000/ws';
   ```

---

### Phase 2: Activate REST API Calls

**Current state**: Service files have placeholder/commented API calls

**Files to update**:

#### 2.1 `frontend/services/api.ts`

**Changes**:
- Update `BASE_URL` to use config constant
- Ensure axios instance is configured correctly
- Add error handling for network failures

**Expected result**:
```typescript
import { API_URL } from '@/constants/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### 2.2 `frontend/services/user.service.ts`

**Changes**:
- Activate `registerUser()` - POST `/users/register`
- Activate `getUser()` - GET `/users/:userId`
- Activate `updatePrivacy()` - PUT `/users/:userId/privacy`

**Test points**:
- Registration creates user in backend database
- Privacy update reflects in user profile
- User profile fetch returns correct data

#### 2.3 `frontend/services/friends.service.ts`

**Changes**:
- Activate `getFriends()` - GET `/users/:userId/friends`
- Activate `getFriendsLocations()` - GET `/users/:userId/friends/locations`
- Activate `addFriend()` - POST `/users/:userId/friends`
- Activate `removeFriend()` - DELETE `/users/:userId/friends/:friendId`

**Test points**:
- Friends list fetches correctly
- Friend locations include privacy enforcement
- Add/remove operations are bidirectional

---

### Phase 3: WebSocket Integration

**Current state**: `websocket.service.ts` exists but not initialized

#### 3.1 Initialize WebSocket Service

**File**: `frontend/services/websocket.service.ts`

**Changes**:
- Update WebSocket URL to use config constant
- Add reconnection logic (exponential backoff)
- Add connection state management

**Connection URL format**:
```typescript
const wsUrl = `${WS_URL}?userId=${userId}`;
```

#### 3.2 Connect WebSocket in UserContext

**File**: `frontend/context/UserContext.tsx`

**Changes needed**:

```typescript
import { websocketService } from '@/services/websocket.service';

useEffect(() => {
  if (userId) {
    // Connect WebSocket
    websocketService.connect(userId).catch((error) => {
      console.error('WebSocket connection failed:', error);
    });

    // Setup listeners
    websocketService.onConnected((data) => {
      console.log('WebSocket connected:', data.userId);
    });

    websocketService.onDisconnected(() => {
      console.log('WebSocket disconnected');
    });

    websocketService.onError((error) => {
      console.error('WebSocket error:', error);
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }
}, [userId]);
```

**When**: Connect immediately after user login/registration

#### 3.3 Connect WebSocket in FriendsContext

**File**: `frontend/context/FriendsContext.tsx`

**Changes needed**:

```typescript
import { websocketService } from '@/services/websocket.service';

useEffect(() => {
  // Listen for friend location updates
  websocketService.onFriendLocation((friend) => {
    setFriends((prev) =>
      prev.map((f) => (f.userId === friend.userId ? { ...f, ...friend } : f))
    );
  });

  // Listen for initial sync
  websocketService.onSync((friendsData) => {
    setFriends(friendsData as User[]);
  });
}, []);
```

**Expected behavior**:
- Initial sync loads all friends' current locations
- Real-time updates when friends move
- Privacy enforcement (city vs realtime) applied automatically

#### 3.4 Send Location Updates via WebSocket

**File**: `frontend/context/UserContext.tsx`

**Changes needed in `setUserLocation` function**:

```typescript
const setUserLocation = useCallback((
  lat: number,
  lon: number,
  city?: string,
  country?: string
) => {
  setLatitude(lat);
  setLongitude(lon);
  if (city) setCity(city);
  if (country) setCountry(country);

  // Send via WebSocket if connected
  if (websocketService.isConnected()) {
    websocketService.sendLocationUpdate(lat, lon, city, country);
  } else {
    console.warn('WebSocket not connected, location update not sent');
  }
}, []);
```

**When**: Called whenever device location changes (from location tracking service)

---

### Phase 4: Testing Integration

#### 4.1 Backend Health Check

**Test**: REST API is responding

```bash
curl http://localhost:3000/
# Expected: {"service":"Linda ROFL Backend","status":"running",...}
```

#### 4.2 User Registration Flow

**Test**: Register new user from frontend

**Steps**:
1. Open app
2. Enter user details (name, nationality, gender)
3. Submit registration
4. Verify user appears in backend database

**Backend verification**:
```bash
# Check database
sqlite3 /root/.my-volume/linda.db "SELECT * FROM users;"
```

#### 4.3 WebSocket Connection

**Test**: WebSocket connects successfully

**Steps**:
1. User logs in
2. Check console for "WebSocket connected: {userId}"
3. Verify connection appears in backend logs

**Backend verification**:
```bash
# Backend should log:
# 🔌 WebSocket connected: {userId}
```

#### 4.4 Location Broadcasting

**Test**: Location updates propagate to friends

**Setup**:
- Register two users: Alice and Bob
- Make them friends via REST API
- Connect both via WebSocket

**Steps**:
1. Alice updates location (New York)
2. Bob should receive update via WebSocket
3. Check Bob's friends list shows Alice's new location

**Expected WebSocket message** (received by Bob):
```json
{
  "type": "friend_location",
  "userId": "alice",
  "name": "Alice Johnson",
  "privacy_level": "realtime",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "city": "New York",
  "country": "USA",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 4.5 Privacy Enforcement

**Test**: City-level privacy hides coordinates

**Setup**:
- Bob sets privacy to "city"
- Bob updates location (London)

**Expected**: Alice receives:
```json
{
  "type": "friend_location",
  "userId": "bob",
  "privacy_level": "city",
  "latitude": null,
  "longitude": null,
  "city": "London",
  "country": "UK"
}
```

**Map behavior**:
- Alice's map shows Bob's marker in London
- But no exact coordinates (fallback to city center)

---

## Phase 5: Error Handling

### 5.1 Network Failures

**Scenarios to handle**:
- Backend server down
- Network connection lost
- WebSocket disconnect

**Implementation**:

```typescript
// In websocket.service.ts
private reconnect() {
  if (this.reconnectAttempts < this.maxReconnectAttempts) {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.currentUserId);
    }, delay);
  }
}
```

**User feedback**:
- Show "Connecting..." indicator
- Show "Offline" mode when connection fails
- Auto-reconnect when network returns

### 5.2 REST API Errors

**Common errors**:
- 404 User not found
- 400 Invalid data
- 500 Database error

**Implementation**:

```typescript
// In api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      // Handle user not found
    } else if (error.response?.status === 400) {
      // Handle validation error
    }
    return Promise.reject(error);
  }
);
```

---

## Phase 6: Mobile-Specific Considerations

### 6.1 Android Network Security

**File**: `frontend/android/app/src/main/AndroidManifest.xml`

**Add**:
```xml
<application
  android:usesCleartextTraffic="true"
  ...>
```

**Why**: Allows HTTP connections to localhost during development

### 6.2 iOS App Transport Security

**File**: `frontend/ios/linda/Info.plist`

**Add**:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

**Why**: Allows WebSocket connections during development

### 6.3 Background Location Updates

**Consider**:
- iOS/Android require background permissions
- Battery optimization considerations
- WebSocket may disconnect when app backgrounds

**Solution**: Implement reconnection on app resume

```typescript
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    websocketService.reconnect();
  }
});
```

---

## Troubleshooting

### Issue 1: "Network request failed"

**Cause**: Backend not running or wrong URL

**Fix**:
1. Verify backend is running: `curl http://localhost:3000/`
2. Check `.env.local` has correct URL
3. For Android emulator, use `10.0.2.2:3000` instead of `localhost:3000`
4. For iOS simulator, `localhost:3000` should work

### Issue 2: WebSocket disconnects immediately

**Cause**: Missing userId in connection URL

**Fix**:
```typescript
// Ensure userId is set before connecting
if (!userId) {
  console.error('Cannot connect WebSocket: userId not set');
  return;
}
websocketService.connect(userId);
```

### Issue 3: Friend locations not updating

**Cause**: WebSocket listeners not set up

**Fix**:
1. Verify `websocketService.onFriendLocation()` is called
2. Check FriendsContext has WebSocket listeners in useEffect
3. Verify friends list is populated (check initial sync)

### Issue 4: Privacy level not applied

**Cause**: Backend privacy enforcement not working

**Fix**:
1. Verify user's `privacy_level` in database
2. Check backend logs for privacy enforcement
3. Test with REST endpoint: `GET /users/:userId/friends/locations`

---

## Execution Checklist

- [ ] Phase 1: Create `.env.local` with API URLs
- [ ] Phase 1: Update `constants/config.ts` to read from env
- [ ] Phase 2: Activate REST API calls in `user.service.ts`
- [ ] Phase 2: Activate REST API calls in `friends.service.ts`
- [ ] Phase 2: Test user registration via frontend
- [ ] Phase 3: Add WebSocket initialization in `UserContext.tsx`
- [ ] Phase 3: Add WebSocket listeners in `FriendsContext.tsx`
- [ ] Phase 3: Update `setUserLocation` to send via WebSocket
- [ ] Phase 4: Test WebSocket connection
- [ ] Phase 4: Test location broadcasting between two users
- [ ] Phase 4: Test privacy enforcement (city vs realtime)
- [ ] Phase 5: Add error handling for network failures
- [ ] Phase 5: Add WebSocket reconnection logic
- [ ] Phase 6: Configure Android/iOS network permissions
- [ ] Phase 6: Test on physical device (not just simulator)

---

## Expected Timeline

**Phase 1**: 15 minutes (environment setup)
**Phase 2**: 30 minutes (activate REST APIs)
**Phase 3**: 45 minutes (WebSocket integration)
**Phase 4**: 30 minutes (testing)
**Phase 5**: 30 minutes (error handling)
**Phase 6**: 20 minutes (mobile config)

**Total**: ~3 hours for full integration

---

## Success Criteria

1. **User Registration**: User can register from app and appears in backend database
2. **Friend Management**: User can add/remove friends via frontend
3. **Location Sharing**: Location updates propagate in real-time via WebSocket
4. **Privacy Enforcement**: City-level privacy hides exact coordinates
5. **Map Display**: Friends appear on map with correct locations
6. **Reconnection**: App reconnects after network interruption
7. **Error Handling**: Graceful degradation when backend unavailable

---

## Next Steps After Integration

1. **Deploy Backend to Oasis ROFL**: Use `oasis rofl deploy`
2. **Update Frontend URLs**: Point to production ROFL endpoint
3. **Add Self Protocol Verification**: Implement actionNullifier checks
4. **Implement Proper Auth**: Add session tokens instead of simple userId
5. **Enable aTLS**: Secure WebSocket connections in production
6. **Performance Testing**: Test with multiple concurrent users
7. **Production Build**: Create release builds for iOS/Android

---

  ## Option 1: Setup ngrok (Recommended - 2 minutes)

  Ngrok is free and easy:

  # 1. Sign up at ngrok.com (takes 1 minute)
  # Visit: https://dashboard.ngrok.com/signup

  # 2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

  # 3. Set authtoken:
  ngrok config add-authtoken YOUR_TOKEN_HERE

  # 4. Start tunnel:
  ngrok http 3000

  Then you'll see output like:
  Forwarding  https://1234-abc-def.ngrok-free.app -> http://localhost:3000

  Copy the HTTPS URL and update frontend/.env.local:
  EXPO_PUBLIC_API_URL=https://1234-abc-def.ngrok-free.app
  EXPO_PUBLIC_WS_URL=wss://1234-abc-def.ngrok-free.app/ws

  Restart Expo!