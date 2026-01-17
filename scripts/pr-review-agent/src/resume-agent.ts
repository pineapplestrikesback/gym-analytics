import Anthropic from '@anthropic-ai/sdk';
import { AgentSession, getAgentStore } from './agent-store.js';

export interface ReviewFeedback {
  prNumber: number;
  repository: string;
  reviewState: 'approved' | 'changes_requested' | 'commented' | 'comment';
  commentAuthor: string;
  commentBody: string;
  sha: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  newAgentId?: string;
}

/**
 * Resume an agent session to handle PR review feedback
 */
export async function resumeAgentForReview(
  feedback: ReviewFeedback
): Promise<AgentResponse> {
  const store = getAgentStore();
  const session = store.getSession(feedback.prNumber, feedback.repository);

  if (!session) {
    return {
      success: false,
      message: `No agent session found for PR #${feedback.prNumber} in ${feedback.repository}`,
    };
  }

  if (session.status !== 'active') {
    return {
      success: false,
      message: `Agent session for PR #${feedback.prNumber} is ${session.status}, not active`,
    };
  }

  try {
    const response = await invokeClaudeAgent(session, feedback);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    store.updateStatus(feedback.prNumber, feedback.repository, 'failed');
    return {
      success: false,
      message: `Failed to resume agent: ${errorMessage}`,
    };
  }
}

/**
 * Invoke Claude Agent SDK to continue the session
 *
 * NOTE: This uses the Anthropic SDK directly. For full Claude Code agent resumption,
 * you would use the Claude Agent SDK (claude-code) programmatically.
 *
 * This implementation provides a foundation - you may need to adapt based on
 * the exact Claude Agent SDK API when it becomes available for programmatic use.
 */
async function invokeClaudeAgent(
  session: AgentSession,
  feedback: ReviewFeedback
): Promise<AgentResponse> {
  const client = new Anthropic();

  // Build the prompt for the agent
  const prompt = buildReviewPrompt(session, feedback);

  // For now, we use the Messages API directly
  // In production, you would use the Claude Agent SDK's resume functionality
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: buildSystemPrompt(session),
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text response
  const textContent = message.content.find((block) => block.type === 'text');
  const responseText = textContent?.type === 'text' ? textContent.text : '';

  // Update session
  const store = getAgentStore();
  store.updateContextSummary(
    feedback.prNumber,
    feedback.repository,
    `Last review feedback from ${feedback.commentAuthor}: ${feedback.commentBody.substring(0, 200)}`
  );

  return {
    success: true,
    message: responseText,
    newAgentId: session.agent_id, // Same session continues
  };
}

function buildSystemPrompt(session: AgentSession): string {
  return `You are a coding agent that previously worked on PR changes for branch "${session.branch_name}".
Your previous context: ${session.context_summary || 'Initial PR work'}

You have access to the repository and can make code changes to address review feedback.
When making changes:
1. Understand the feedback completely
2. Make minimal, focused changes to address the feedback
3. Commit and push your changes
4. Explain what you changed and why

Repository: ${session.repository}
PR Number: ${session.pr_number}`;
}

function buildReviewPrompt(session: AgentSession, feedback: ReviewFeedback): string {
  const reviewTypeText = {
    approved: 'approved your PR',
    changes_requested: 'requested changes on your PR',
    commented: 'left a comment on your PR',
    comment: 'commented on your PR',
  }[feedback.reviewState];

  return `## PR Review Feedback

**${feedback.commentAuthor}** ${reviewTypeText}:

---
${feedback.commentBody}
---

${feedback.reviewState === 'changes_requested'
  ? `Please address the requested changes. Make the necessary code modifications, commit them, and push to the branch "${session.branch_name}".`
  : feedback.reviewState === 'approved'
  ? 'The PR has been approved! No action needed unless there are specific comments to address.'
  : 'Please review the comment and determine if any changes are needed. If so, make the changes and push.'}

After making any changes, provide a summary of what you did.`;
}

/**
 * Register a new agent session when an agent pushes to a PR
 * Call this when the original agent creates/pushes to a PR
 */
export function registerAgentSession(
  prNumber: number,
  repository: string,
  agentId: string,
  branchName: string,
  contextSummary?: string
): AgentSession {
  const store = getAgentStore();
  return store.createSession({
    prNumber,
    repository,
    agentId,
    branchName,
    contextSummary,
  });
}
