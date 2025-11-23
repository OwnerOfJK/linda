import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || '/root/.my-volume/linda.db';

export function initDatabase(): Database.Database {
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

export { DB_PATH };
