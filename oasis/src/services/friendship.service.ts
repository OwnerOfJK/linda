import Database from 'better-sqlite3';

export class FriendshipService {
  constructor(private db: Database.Database) {}

  /**
   * Add bidirectional friendship
   */
  addFriend(userId: string, friendId: string): void {
    if (userId === friendId) {
      throw new Error('Cannot add yourself as friend');
    }

    const insertStmt = this.db.prepare(
      'INSERT OR IGNORE INTO friendships (userId, friendId) VALUES (?, ?)'
    );
    insertStmt.run(userId, friendId);
    insertStmt.run(friendId, userId);
  }

  /**
   * Remove bidirectional friendship
   */
  removeFriend(userId: string, friendId: string): void {
    this.db
      .prepare('DELETE FROM friendships WHERE userId = ? AND friendId = ?')
      .run(userId, friendId);
    this.db
      .prepare('DELETE FROM friendships WHERE userId = ? AND friendId = ?')
      .run(friendId, userId);
  }

  /**
   * Get all friend IDs for a user
   */
  getFriendIds(userId: string): string[] {
    const friends = this.db
      .prepare('SELECT friendId FROM friendships WHERE userId = ?')
      .all(userId) as { friendId: string }[];

    return friends.map((f) => f.friendId);
  }

  /**
   * Get friends list with city info
   */
  getFriendsWithLocation(userId: string): any[] {
    return this.db
      .prepare(
        `
      SELECT
        u.userId,
        u.name,
        l.city,
        l.country
      FROM friendships f
      JOIN users u ON f.friendId = u.userId
      LEFT JOIN locations l ON u.userId = l.userId
      WHERE f.userId = ?
    `
      )
      .all(userId);
  }
}
