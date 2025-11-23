import express from 'express';
import http from 'http';
import cors from 'cors';
import { initDatabase } from './config/database';
import { PORT } from './config/constants';
import { UserService } from './services/user.service';
import { LocationService } from './services/location.service';
import { FriendshipService } from './services/friendship.service';
import { setupWebSocket } from './websocket';
import { createRoutes } from './routes';

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
const db = initDatabase();

// Initialize services
const userService = new UserService(db);
const locationService = new LocationService(db);
const friendshipService = new FriendshipService(db);

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
const wsManager = setupWebSocket(server, locationService, friendshipService);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Linda ROFL Backend',
    version: '1.0.0',
    status: 'running',
    connections: wsManager.getSize(),
  });
});

// Setup routes
app.use('/', createRoutes(userService, locationService, friendshipService, wsManager, db));

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Linda ROFL Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready at ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  db.close();
  process.exit(0);
});
