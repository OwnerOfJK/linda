import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Database path in persistent volume
const DB_PATH = '/root/.my-volume/linda.db';

// Middleware
app.use(express.json());

// Types
interface User {
  userId: string;
  name: string;
  nationality?: string;
  gender?: string;
  verified: boolean;
  created_at: string;
}

interface UserCreate {
  userId: string;
  name: string;
  nationality?: string;
  gender?: string;
}

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
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  console.log(`✅ Database initialized at ${DB_PATH}`);
  return db;
}

// Initialize database connection
const db = initDatabase();

// Routes

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Linda ROFL Backend',
    version: '0.1.0',
    status: 'running',
    database: DB_PATH,
  });
});

// Register user
app.post('/users/register', (req: Request, res: Response) => {
  try {
    const userData: UserCreate = req.body;

    // Validate required fields
    if (!userData.userId || !userData.name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT userId FROM users WHERE userId = ?').get(userData.userId);

    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Insert new user
    const stmt = db.prepare(`
      INSERT INTO users (userId, name, nationality, gender)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(userData.userId, userData.name, userData.nationality || null, userData.gender || null);

    // Fetch created user
    const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(userData.userId) as User;

    res.json({
      userId: user.userId,
      name: user.name,
      nationality: user.nationality,
      gender: user.gender,
      verified: Boolean(user.verified),
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get user by ID
app.get('/users/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId) as User | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.userId,
      name: user.name,
      nationality: user.nationality,
      gender: user.gender,
      verified: Boolean(user.verified),
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// List all users
app.get('/users', (req: Request, res: Response) => {
  try {
    const users = db
      .prepare('SELECT userId, name, nationality, created_at FROM users')
      .all() as User[];

    res.json({
      count: users.length,
      users: users.map((user) => ({
        userId: user.userId,
        name: user.name,
        nationality: user.nationality,
        created_at: user.created_at,
      })),
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Linda ROFL Backend running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  db.close();
  process.exit(0);
});

