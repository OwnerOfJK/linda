import Database from 'better-sqlite3';
import type { User, PrivacyLevel } from '../types';

export class UserService {
  constructor(private db: Database.Database) {}

  /**
   * Register a new user
   */
  registerUser(
    userId: string,
    name: string,
    nationality?: string,
    gender?: string
  ): User {
    // Check if user exists
    const existing = this.db
      .prepare('SELECT userId FROM users WHERE userId = ?')
      .get(userId);
    if (existing) {
      throw new Error('User already exists');
    }

    // Insert user
    this.db
      .prepare(
        `
      INSERT INTO users (userId, name, nationality, gender)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(userId, name, nationality || null, gender || null);

    return this.getUser(userId)!;
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): User | null {
    const user = this.db
      .prepare('SELECT * FROM users WHERE userId = ?')
      .get(userId) as User | undefined;
    return user || null;
  }

  /**
   * Update user's privacy level
   */
  updatePrivacyLevel(userId: string, privacyLevel: PrivacyLevel): void {
    const user = this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    this.db
      .prepare(
        `
      UPDATE users
      SET privacy_level = ?, updated_at = datetime('now')
      WHERE userId = ?
    `
      )
      .run(privacyLevel, userId);
  }

  /**
   * Check if user exists
   */
  userExists(userId: string): boolean {
    const user = this.db
      .prepare('SELECT userId FROM users WHERE userId = ?')
      .get(userId);
    return !!user;
  }
}
