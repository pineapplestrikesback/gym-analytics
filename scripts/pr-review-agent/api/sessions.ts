import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listActiveSessions } from '../lib/agent-store';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const sessions = await listActiveSessions();
    res.json({ sessions });
  } catch (error) {
    console.error('Failed to list sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
}
