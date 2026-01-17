import Anthropic from '@anthropic-ai/sdk';
import { getSession, updateSessionStatus } from './agent-store';

export interface ReviewFeedback {
  prNumber: number;
  repository: string;
  reviewState: 'approved' | 'changes_requested' | 'commented';
  commentAuthor: string;
  commentBody: string;
  sha: string;
}

export interface ResumeResult {
  success: boolean;
  message: string;
  agentResponse?: string;
}

/**
 * Build a prompt for the agent based on review feedback
 */
function buildReviewPrompt(feedback: ReviewFeedback, contextSummary?: string): string {
  const stateEmoji =
    feedback.reviewState === 'approved'
      ? '✅'
      : feedback.reviewState === 'changes_requested'
        ? '🔄'
        : '💬';

  return `
## PR Review Feedback Received ${stateEmoji}

A reviewer has left feedback on your PR #${feedback.prNumber}.

**Review State:** ${feedback.reviewState}
**Reviewer:** ${feedback.commentAuthor}
**Current SHA:** ${feedback.sha}

### Reviewer's Comment:
${feedback.commentBody}

${contextSummary ? `### Context from your previous session:\n${contextSummary}\n` : ''}

### Your Task:
${
  feedback.reviewState === 'approved'
    ? 'The PR has been approved! No action needed unless there are minor suggestions in the comments.'
    : feedback.reviewState === 'changes_requested'
      ? `Please address the reviewer's feedback:
1. Analyze each point in the review
2. Make the necessary code changes
3. Commit with a clear message referencing the feedback
4. Push the updated commits to the branch`
      : `The reviewer left a comment. Please:
1. Read and understand their feedback
2. If changes are needed, implement them
3. If it's a question, the response will be posted as a PR comment`
}

Please proceed with addressing this feedback.
`.trim();
}

/**
 * Resume an agent session with review feedback
 *
 * Note: This implementation uses the Anthropic Messages API directly.
 * When Claude Agent SDK supports programmatic session resumption,
 * this can be updated to use proper session resumption.
 */
export async function resumeAgentForReview(feedback: ReviewFeedback): Promise<ResumeResult> {
  // Get the stored session
  const session = await getSession(feedback.prNumber, feedback.repository);

  if (!session) {
    return {
      success: false,
      message: `No agent session found for PR #${feedback.prNumber}`,
    };
  }

  // Mark session as processing
  await updateSessionStatus(feedback.prNumber, feedback.repository, 'processing');

  try {
    const anthropic = new Anthropic();

    const prompt = buildReviewPrompt(feedback, session.contextSummary);

    // For now, we use the Messages API to send the review feedback
    // In a full implementation, this would resume the actual agent session
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are a code review assistant helping to address PR feedback.
You have access to the repository: ${feedback.repository}
You are working on branch: ${session.branchName}
Original agent session ID: ${session.agentId}

Your responses should be actionable and specific. When code changes are needed,
describe exactly what changes to make and where.`,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract response text
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Mark session as active again (ready for more feedback)
    await updateSessionStatus(feedback.prNumber, feedback.repository, 'active');

    return {
      success: true,
      message: 'Agent processed review feedback',
      agentResponse: responseText,
    };
  } catch (error) {
    // Reset status on error
    await updateSessionStatus(feedback.prNumber, feedback.repository, 'active');

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to resume agent:', errorMessage);

    return {
      success: false,
      message: `Failed to process review: ${errorMessage}`,
    };
  }
}
