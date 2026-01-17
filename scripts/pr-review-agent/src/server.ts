import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from 'dotenv';
import { resumeAgentForReview, ReviewFeedback } from './resume-agent.js';
import { getAgentStore } from './agent-store.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3847;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

// Middleware to capture raw body for signature verification
app.use(
  express.json({
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as Request & { rawBody: Buffer }).rawBody = buf;
    },
  })
);

/**
 * Verify GitHub webhook signature
 */
function verifySignature(req: Request): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('WEBHOOK_SECRET not configured - skipping signature verification');
    return true; // Allow in development
  }

  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    return false;
  }

  const rawBody = (req as Request & { rawBody: Buffer }).rawBody;
  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * List active sessions (for debugging)
 */
app.get('/sessions', (_req: Request, res: Response) => {
  try {
    const store = getAgentStore();
    const sessions = store.listActiveSessions();
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

/**
 * Register a new agent session
 * Called by the orchestrator when an agent pushes to a PR
 */
app.post('/register', (req: Request, res: Response) => {
  try {
    const { prNumber, repository, agentId, branchName, contextSummary } = req.body;

    if (!prNumber || !repository || !agentId || !branchName) {
      res.status(400).json({
        error: 'Missing required fields: prNumber, repository, agentId, branchName',
      });
      return;
    }

    const store = getAgentStore();
    const session = store.createSession({
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
});

/**
 * Main PR review webhook endpoint
 * Receives events from GitHub Actions workflow
 */
app.post('/pr-review', async (req: Request, res: Response) => {
  // Verify webhook signature
  if (!verifySignature(req)) {
    console.error('Invalid webhook signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  try {
    const { event, pr_number, review_state, comment_author, comment_body, repository, sha } =
      req.body;

    console.log(`Received ${event} for PR #${pr_number} in ${repository}`);
    console.log(`Review state: ${review_state}, Author: ${comment_author}`);

    // Check if we have a session for this PR
    const store = getAgentStore();
    const session = store.getSession(pr_number, repository);

    if (!session) {
      console.log(`No agent session found for PR #${pr_number}`);
      res.json({
        success: false,
        message: 'No agent session for this PR',
      });
      return;
    }

    // Build feedback object
    const feedback: ReviewFeedback = {
      prNumber: pr_number,
      repository,
      reviewState: review_state,
      commentAuthor: comment_author,
      commentBody: comment_body,
      sha,
    };

    // Resume the agent
    const result = await resumeAgentForReview(feedback);

    console.log(`Agent response: ${result.success ? 'success' : 'failed'}`);
    res.json(result);
  } catch (error) {
    console.error('Error processing PR review:', error);
    res.status(500).json({
      error: 'Failed to process PR review',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Mark a session as completed
 */
app.post('/complete', (req: Request, res: Response) => {
  try {
    const { prNumber, repository } = req.body;

    if (!prNumber || !repository) {
      res.status(400).json({ error: 'Missing prNumber or repository' });
      return;
    }

    const store = getAgentStore();
    store.updateStatus(prNumber, repository, 'completed');

    console.log(`Marked session for PR #${prNumber} as completed`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

/**
 * Error handling middleware
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`PR Review Agent Handler listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Webhook endpoint: POST http://localhost:${PORT}/pr-review`);
  console.log(`Register endpoint: POST http://localhost:${PORT}/register`);
});

export { app };
