import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSession } from '../lib/agent-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prNumber, repository, agentId, branchName, contextSummary } = req.body;

    if (!prNumber || !repository || !agentId || !branchName) {
      res.status(400).json({
        error: 'Missing required fields: prNumber, repository, agentId, branchName',
      });
      return;
    }

    const session = await createSession({
      prNumber,
      repository,
      agentId,
      branchName,
      contextSummary,
    });

    console.log(`Registered agent session for PR #${prNumber}: ${agentId}`);
    res.json({ success: true, session });
  } catch (error) {
    console.error('Failed to register session:', error);
    res.status(500).json({ error: 'Failed to register session' });
  }
}
