const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// In-memory storage simulating TEE (Trusted Execution Environment)
const users = new Map();

// Helper function to parse JSON request body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
};

// Helper function to apply privacy filtering to location
const applyPrivacyFilter = (location, privacyLevel) => {
  if (!location || !Array.isArray(location) || location.length < 2) {
    return null;
  }

  switch (privacyLevel) {
    case 1: // Exact coordinates
      return location;
    case 2: // City level (round to 1 decimal place)
      return [Math.round(location[0] * 10) / 10, Math.round(location[1] * 10) / 10];
    case 3: // Country level (round to integer)
      return [Math.round(location[0]), Math.round(location[1])];
    default:
      return location;
  }
};

const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      msg: 'hello from backend',
      timestamp: new Date().toISOString(),
      version: '0.1.0'
    }));
  }

  // API: Create User
  if (req.url === '/api/createUser' && req.method === 'POST') {
    try {
      const { userId, name, location, privacyLevel } = await parseBody(req);

      if (!userId || !name || !location || privacyLevel === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing required fields: userId, name, location, privacyLevel' }));
      }

      if (users.has(userId)) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'User already exists' }));
      }

      users.set(userId, {
        userId,
        name,
        location,
        privacyLevel,
        friends: []
      });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, userId }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
  }

  // API: Verify User
  if (req.url.startsWith('/api/verify/') && req.method === 'GET') {
    const userId = req.url.split('/')[3];

    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing userId' }));
    }

    const exists = users.has(userId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ exists, userId }));
  }

  // API: Update User Location
  if (req.url === '/api/updateUserLocation' && req.method === 'POST') {
    try {
      const { userId, location } = await parseBody(req);

      if (!userId || !location) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing required fields: userId, location' }));
      }

      const user = users.get(userId);
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'User not found' }));
      }

      user.location = location;
      users.set(userId, user);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, location }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
  }

  // API: Add Friend
  if (req.url === '/api/addFriend' && req.method === 'POST') {
    try {
      const { userId, friendId } = await parseBody(req);

      if (!userId || !friendId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing required fields: userId, friendId' }));
      }

      const user = users.get(userId);
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'User not found' }));
      }

      if (!users.has(friendId)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Friend not found' }));
      }

      if (!user.friends.includes(friendId)) {
        user.friends.push(friendId);
        users.set(userId, user);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, friends: user.friends }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
  }

  // API: Remove Friend
  if (req.url === '/api/removeFriend' && req.method === 'POST') {
    try {
      const { userId, friendId } = await parseBody(req);

      if (!userId || !friendId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing required fields: userId, friendId' }));
      }

      const user = users.get(userId);
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'User not found' }));
      }

      user.friends = user.friends.filter(id => id !== friendId);
      users.set(userId, user);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, friends: user.friends }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
  }

  // API: Look Friend Location
  if (req.url.startsWith('/api/lookFriendLocation/') && req.method === 'GET') {
    const friendId = req.url.split('/')[3];

    if (!friendId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing friendId' }));
    }

    const friend = users.get(friendId);
    if (!friend) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Friend not found' }));
    }

    const filteredLocation = applyPrivacyFilter(friend.location, friend.privacyLevel);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      friendId,
      name: friend.name,
      location: filteredLocation,
      privacyLevel: friend.privacyLevel
    }));
  }

  // API: Change Privacy Level
  if (req.url === '/api/changePrivacyLevel' && req.method === 'POST') {
    try {
      const { userId, privacyLevel } = await parseBody(req);

      if (!userId || privacyLevel === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing required fields: userId, privacyLevel' }));
      }

      if (![1, 2, 3].includes(privacyLevel)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid privacyLevel. Must be 1, 2, or 3' }));
      }

      const user = users.get(userId);
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'User not found' }));
      }

      user.privacyLevel = privacyLevel;
      users.set(userId, user);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, privacyLevel }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
  }

  // API: Read User
  if (req.url.startsWith('/api/readUser/') && req.method === 'GET') {
    const userId = req.url.split('/')[3];

    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing userId' }));
    }

    const user = users.get(userId);
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'User not found' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      userId: user.userId,
      name: user.name,
      location: user.location,
      privacyLevel: user.privacyLevel,
      friends: user.friends
    }));
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Available endpoints:`);
  console.log(`  - GET  /health`);
  console.log(`  - GET  /`);
  console.log(`  - POST /api/createUser`);
  console.log(`  - GET  /api/verify/:userId`);
  console.log(`  - POST /api/updateUserLocation`);
  console.log(`  - POST /api/addFriend`);
  console.log(`  - POST /api/removeFriend`);
  console.log(`  - GET  /api/lookFriendLocation/:friendId`);
  console.log(`  - POST /api/changePrivacyLevel`);
  console.log(`  - GET  /api/readUser/:userId`);
});
