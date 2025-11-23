import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';

export function createAdminRoutes() {
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
      const child = spawn('node', [scriptPath, userId], {
        stdio: 'inherit', // Inherit stdio to see logs in main process
        detached: false,
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

  return router;
}
