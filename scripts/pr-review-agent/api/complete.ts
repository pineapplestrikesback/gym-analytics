import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateSessionStatus } from '../lib/agent-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prNumber, repository } = req.body;

    if (!prNumber || !repository) {
      res.status(400).json({ error: 'Missing prNumber or repository' });
      return;
    }

    await updateSessionStatus(prNumber, repository, 'completed');

    console.log(`Marked session for PR #${prNumber} as completed`);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to complete session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
}
