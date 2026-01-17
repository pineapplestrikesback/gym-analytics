import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getSession } from '../lib/agent-store';
import { resumeAgentForReview, ReviewFeedback } from '../lib/resume-agent';

/**
 * Verify GitHub webhook signature
 */
function verifySignature(req: VercelRequest): boolean {
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret) {
    console.warn('WEBHOOK_SECRET not configured - skipping signature verification');
    return true; // Allow in development
  }

  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    return false;
  }

  const body = JSON.stringify(req.body);
  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

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
    const session = await getSession(pr_number, repository);

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
}
