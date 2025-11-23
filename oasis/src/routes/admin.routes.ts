import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import Database from 'better-sqlite3';

export function createAdminRoutes(db: Database.Database) {
  const router = Router();

  // POST /admin/simulate - Simulate friend location updates
  router.post('/simulate', (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId' });
    }

    try {
      // Path to simulate-friends.js script
      const scriptPath = path.join(__dirname, '../../simulate-friends.js');

      console.log(`🧪 [Admin] Starting friend simulation for userId: ${userId}`);
      console.log(`🧪 [Admin] Script path: ${scriptPath}`);

      // Spawn child process to run simulation script
      // Force IPv4 to avoid ECONNREFUSED ::1:3000 error
      const child = spawn('node', [scriptPath, userId], {
        stdio: 'inherit', // Inherit stdio to see logs in main process
        detached: false,
        env: {
          ...process.env,
          API_URL: 'http://127.0.0.1:3000',
          WS_URL: 'ws://127.0.0.1:3000/ws',
        },
      });

      // Handle process errors
      child.on('error', (error) => {
        console.error(`❌ [Admin] Simulation process error:`, error);
      });

      child.on('close', (code) => {
        console.log(`🧪 [Admin] Simulation process exited with code ${code}`);
      });

      res.json({
        started: true,
        userId,
        message: 'Friend simulation started',
      });
    } catch (error) {
      console.error('❌ [Admin] Failed to start simulation:', error);
      res.status(500).json({ error: 'Failed to start simulation' });
    }
  });

  // POST /admin/clear-mock-friends - Remove all mock friends
  router.post('/clear-mock-friends', (req: Request, res: Response) => {
    try {
      console.log('🧹 [Admin] Clearing mock friends...');

      // Delete all users whose userId starts with 'mock-friend-'
      // CASCADE DELETE will automatically remove their locations and friendships
      const result = db.prepare(`
        DELETE FROM users WHERE userId LIKE 'mock-friend-%'
      `).run();

      console.log(`✅ [Admin] Removed ${result.changes} mock friends`);

      res.json({
        success: true,
        removed: result.changes,
        message: `Removed ${result.changes} mock friends and their data`,
      });
    } catch (error) {
      console.error('❌ [Admin] Failed to clear mock friends:', error);
      res.status(500).json({ error: 'Failed to clear mock friends' });
    }
  });

  // POST /admin/reset-database - Clear all data (use with caution!)
  router.post('/reset-database', (req: Request, res: Response) => {
    try {
      console.log('🧹 [Admin] Resetting entire database...');

      // Delete all data from all tables
      db.prepare('DELETE FROM friendships').run();
      db.prepare('DELETE FROM locations').run();
      db.prepare('DELETE FROM users').run();

      console.log('✅ [Admin] Database reset complete');

      res.json({
        success: true,
        message: 'Database reset successfully',
      });
    } catch (error) {
      console.error('❌ [Admin] Failed to reset database:', error);
      res.status(500).json({ error: 'Failed to reset database' });
    }
  });

  return router;
}
