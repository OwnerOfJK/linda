# Testing Guide - Frontend + Backend Integration

## Current Status
- ✅ Backend running with test endpoint
- ✅ REST API with detailed logging
- ✅ WebSocket server ready
- ✅ Frontend integrated with backend
- ✅ Test buttons added for easy testing

## Recent Updates (Latest)
- ✅ Added comprehensive logging to all API calls
- ✅ Friends now fetched from backend (not mock data)
- ✅ DevLogin registers user in backend
- ✅ Added test endpoint: `POST /test/simulate-friend-move`
- ✅ Added flask icon button to simulate friend movement in Settings > Friends tab

---

## Phase 3: Start Frontend

### Terminal 1 - Backend (Already Running)
```bash
cd oasis
npm run dev
# Running at http://localhost:3000
```

### Terminal 2 - Frontend (Start Now)
```bash
cd frontend
npm start
```

Then press:
- `a` for Android emulator
- `i` for iOS simulator
- `w` for web

---

## Phase 4: Test User Registration

### Expected Flow:
1. App opens to sign-in screen
2. Shows userId (UUID generated automatically)
3. Click **"DevLogin"** button (red button at bottom)
4. App navigates to location preference screen

### What to Check:
- ✅ No console errors during navigation
- ✅ userId is stored in localStorage/SecureStore
- ✅ WebSocket attempts to connect (check console logs)

### Expected Console Logs:
```
📡 Connecting to WebSocket: ws://localhost:3000/ws?userId={uuid}
✅ WebSocket connected
🔗 Connected to server: {uuid}
```

---

## Phase 5: Test WebSocket Connection

### Expected Behavior:
1. After DevLogin, UserContext mounts
2. WebSocket connects automatically with userId from storage
3. Server sends `connected` and `sync` messages

### Check Browser/Metro Console:
```javascript
✅ WebSocket initialized for user: {userId}
🔗 WebSocket connected: {userId}
🔄 Initial sync: 0 friends  // (or number of existing friends)
```

### Troubleshooting:
- **"WebSocket connection error"** → Check backend is running
- **"Cannot connect"** → Check `.env.local` has correct WS_URL
- **Android**: Make sure WS_URL is `ws://10.0.2.2:3000/ws` (not localhost)

---

## Phase 6: Test Location Updates & Broadcasting

### Easy Test with UI Button

The easiest way to test real-time updates:

1. **Setup: Create Test Users** (if not exists)
   ```bash
   # Create Alice
   curl -X POST http://localhost:3000/users/register \
     -H "Content-Type: application/json" \
     -d '{"userId":"alice","name":"Alice","nationality":"USA","gender":"female"}'

   # Create Bob
   curl -X POST http://localhost:3000/users/register \
     -H "Content-Type: application/json" \
     -d '{"userId":"bob","name":"Bob","nationality":"UK","gender":"male"}'

   # Make them friends
   curl -X POST http://localhost:3000/users/alice/friends \
     -H "Content-Type: application/json" \
     -d '{"friendId":"bob"}'
   ```

2. **In App: Go to Settings > Friends Tab**
   - You'll see your friends list
   - Each friend has a green flask icon button

3. **Tap the Flask Icon** next to any friend
   - This calls `/test/simulate-friend-move`
   - Backend randomly moves friend to New York, London, Paris, Tokyo, or Sydney
   - Backend broadcasts update via WebSocket
   - Your app receives the update in real-time

4. **Expected Console Logs:**
   ```
   🧪 TEST: Simulating friend move...
   🌐 API POST: http://10.140.213.174:3000/test/simulate-friend-move
   ✅ API POST Response: /test/simulate-friend-move {success: true, ...}
   📍 Friend location update: {friendId}
   ✅ TEST: Friend moved: {result}
   ```

5. **Watch the Map:**
   - Go back to Map screen
   - Friend's marker should update to new location
   - Marker moves automatically (no refresh needed!)

### Full Test Scenario

**Test Two Users Seeing Each Other's Updates:**

1. **Device 1 (or Browser Tab 1):**
   - DevLogin as yourself
   - Go to Settings > Friends
   - Add "alice" and "bob" as friends

2. **Backend: Make Alice/Bob friends with your userId**
   ```bash
   YOUR_USER_ID="paste-your-uuid-here"

   curl -X POST http://localhost:3000/users/alice/friends \
     -H "Content-Type: application/json" \
     -d "{\"friendId\":\"$YOUR_USER_ID\"}"
   ```

3. **In App: Tap Flask Icon** next to Alice
   - Alice moves to random city
   - Check console for WebSocket message

4. **Check Map:**
   - Alice's marker updates
   - No page reload needed

5. **Test Privacy:**
   - Backend: Set Alice to city mode:
     ```bash
     curl -X PUT http://localhost:3000/users/alice/privacy \
       -H "Content-Type: application/json" \
       -d '{"privacy_level":"city"}'
     ```
   - Tap flask icon again
   - You should receive city name but `latitude: null, longitude: null`

## Original Phase 6: Test Location Updates & Broadcasting

### Test Scenario: Two Users (Alice & Bob)

#### Setup:
1. **Backend: Create Test Users**
   ```bash
   # Alice (realtime sharing)
   curl -X POST http://localhost:3000/users/register \
     -H "Content-Type: application/json" \
     -d '{"userId":"alice","name":"Alice Johnson","nationality":"USA","gender":"female"}'

   # Bob (city-level sharing)
   curl -X POST http://localhost:3000/users/register \
     -H "Content-Type: application/json" \
     -d '{"userId":"bob","name":"Bob Smith","nationality":"UK","gender":"male"}'

   # Make them friends (bidirectional)
   curl -X POST http://localhost:3000/users/alice/friends \
     -H "Content-Type: application/json" \
     -d '{"friendId":"bob"}'

   # Set Bob's privacy to city
   curl -X PUT http://localhost:3000/users/bob/privacy \
     -H "Content-Type: application/json" \
     -d '{"privacy_level":"city"}'
   ```

#### Test Steps:

**Step 1: Connect Alice via WebSocket**
- Open app in first browser/emulator
- DevLogin with userId = "alice"
- Check console: WebSocket connected
- Check console: Sync message received with Bob as friend

**Step 2: Update Alice's Location (Realtime Mode)**
```javascript
// In app, Alice goes to location preference screen
// Or manually test via console:
const { setUserLocation } = useUser();
setUserLocation(40.7128, -74.0060, "New York", "USA");
```

Expected:
- Alice's location stored in backend
- Bob receives WebSocket message with Alice's exact coordinates

**Step 3: Connect Bob via WebSocket**
- Open app in second browser/emulator (or use wscat)
- DevLogin with userId = "bob"
- Check console: Sync shows Alice's location (realtime, with coordinates)

**Step 4: Update Bob's Location (City Mode)**
```javascript
// Bob updates location
setUserLocation(51.5074, -0.1278, "London", "UK");
```

Expected:
- Bob's location stored in backend
- Alice receives WebSocket message with Bob's city ONLY:
  ```json
  {
    "type": "friend_location",
    "userId": "bob",
    "name": "Bob Smith",
    "privacy_level": "city",
    "latitude": null,
    "longitude": null,
    "city": "London",
    "country": "UK"
  }
  ```

**Step 5: Test Privacy Toggle**
- Bob switches to "realtime" in settings
- Bob updates location again
- Alice now receives Bob's exact coordinates

---

## Testing Checklist

### ✅ Backend Tests
- [x] Backend starts without errors
- [x] REST API endpoints respond correctly
- [x] User registration works
- [x] Friend relationships are bidirectional
- [x] Privacy levels stored correctly
- [x] WebSocket server accepts connections

### ⏳ Frontend Tests
- [ ] Frontend compiles without errors
- [ ] App starts and shows sign-in screen
- [ ] DevLogin navigates to app
- [ ] WebSocket connects automatically
- [ ] Console shows connection logs

### ⏳ Integration Tests
- [ ] User registration via app creates backend user
- [ ] WebSocket receives `connected` message
- [ ] WebSocket receives `sync` with friends list
- [ ] Location updates send via WebSocket
- [ ] Friends receive real-time location updates
- [ ] Privacy enforcement works (city vs realtime)
- [ ] Map shows friend markers correctly
- [ ] Settings page updates privacy level

### ⏳ Privacy Tests
- [ ] City mode hides exact coordinates (latitude/longitude = null)
- [ ] Realtime mode shares exact coordinates
- [ ] Switching privacy level updates immediately
- [ ] Friends see updated privacy enforcement

---

## Manual WebSocket Testing (Alternative)

If you want to test WebSocket without the app:

```bash
# Install wscat
npm install -g wscat

# Connect as Alice
wscat -c 'ws://localhost:3000/ws?userId=alice'

# You'll receive:
# {"type":"connected","userId":"alice"}
# {"type":"sync","friends":[...]}

# Send location update:
{"type":"location_update","latitude":40.7128,"longitude":-74.0060,"city":"New York","country":"USA"}

# In another terminal, connect as Bob:
wscat -c 'ws://localhost:3000/ws?userId=bob'

# Bob will receive Alice's location update via WebSocket
```

---

## Common Issues & Solutions

### Issue: "WebSocket connection error"
**Cause**: Backend not running or wrong URL
**Fix**:
1. Check backend: `curl http://localhost:3000/`
2. Check `.env.local` has `EXPO_PUBLIC_WS_URL=ws://localhost:3000/ws`
3. For Android emulator: Use `ws://10.0.2.2:3000/ws`

### Issue: "Network request failed" on Android
**Cause**: Android emulator can't reach localhost
**Fix**: Update `.env.local`:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
EXPO_PUBLIC_WS_URL=ws://10.0.2.2:3000/ws
```

### Issue: Friends list shows mock data
**Cause**: REST API not called yet, using hardcoded MOCK_FRIENDS
**Fix**: This is expected on first load. Once WebSocket syncs, real friends replace mocks.

### Issue: Location updates not broadcasting
**Cause**: WebSocket not connected
**Fix**:
1. Check console for "WebSocket connected" log
2. Verify userId is set in UserContext
3. Check backend logs for connection

### Issue: Privacy not enforced
**Cause**: Backend privacy logic issue
**Fix**: Check backend logs when location update is sent

---

## Next Steps After Testing

1. **Add real location tracking** - Integrate `expo-location` to get device GPS
2. **Improve error handling** - Show toast messages on network errors
3. **Add loading states** - Show spinners during API calls
4. **Handle offline mode** - Queue updates when WebSocket disconnected
5. **Add friend requests** - Currently friends are added directly
6. **Deploy backend to ROFL** - Move from localhost to production TEE

---

## Debug Mode

To see all WebSocket messages:

```typescript
// Add to websocket.service.ts handleMessage()
console.log('📨 Raw WebSocket message:', data);
```

To see all API calls:

```typescript
// Add to api.ts
console.log('🌐 API Call:', endpoint, data);
```
