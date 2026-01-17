# PR Review Agent Handler

Automated webhook handler that resumes Claude agent sessions when PR review comments are posted.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PR Review Agent Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Agent pushes PR ──────────────────────────────────────────┐ │
│                                                               │ │
│  2. Register session ◄────────────────────────────────────────┤ │
│     POST /register { prNumber, agentId, branchName }          │ │
│                                                               │ │
│  3. Reviewer comments on PR                                   │ │
│                    │                                          │ │
│                    ▼                                          │ │
│  4. GitHub Action triggers ──► Webhook Handler                │ │
│                                     │                         │ │
│                                     ▼                         │ │
│  5. Look up agent session from SQLite store                   │ │
│                                     │                         │ │
│                                     ▼                         │ │
│  6. Resume Claude agent with review context                   │ │
│                                     │                         │ │
│                                     ▼                         │ │
│  7. Agent fixes code & pushes ◄─────┘                         │ │
│                                                               │ │
└───────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Install Dependencies

```bash
cd scripts/pr-review-agent
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

Required variables:
- `WEBHOOK_SECRET` - Shared secret for GitHub webhook verification
- `ANTHROPIC_API_KEY` - Your Anthropic API key

### 3. Configure GitHub Secrets

In your GitHub repository settings, add these secrets:
- `PR_REVIEW_WEBHOOK_URL` - URL where your handler is running (e.g., `https://your-server.com`)
- `PR_REVIEW_WEBHOOK_SECRET` - Same value as `WEBHOOK_SECRET` in your .env

### 4. Run the Handler

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## API Endpoints

### `GET /health`
Health check endpoint.

### `POST /register`
Register a new agent session when an agent creates a PR.

```json
{
  "prNumber": 123,
  "repository": "owner/repo",
  "agentId": "agent-session-id",
  "branchName": "feature/my-branch",
  "contextSummary": "Optional summary of what the agent was working on"
}
```

### `POST /pr-review`
Main webhook endpoint. Called by GitHub Actions when review comments are posted.

### `GET /sessions`
List all active agent sessions (for debugging).

### `POST /complete`
Mark a session as completed (e.g., when PR is merged).

```json
{
  "prNumber": 123,
  "repository": "owner/repo"
}
```

## Deployment Options

### Option 1: Railway/Render/Fly.io
Deploy as a simple Node.js service. Set environment variables in the platform dashboard.

### Option 2: Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3847
CMD ["node", "dist/server.js"]
```

### Option 3: Self-hosted
Run on any server with Node.js 22+. Use PM2 or systemd for process management.

## Integrating with Your Agent Workflow

When your Claude agent creates a PR, register the session:

```typescript
// After agent pushes to PR
await fetch('http://localhost:3847/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prNumber: 42,
    repository: 'pineapplestrikesback/gym-analytics',
    agentId: 'agent-abc-123',
    branchName: 'claude/feature-xyz',
    contextSummary: 'Implemented new volume calculator'
  })
});
```

## Claude Agent SDK Integration

The current implementation uses the Anthropic Messages API directly. When the Claude Agent SDK supports programmatic session resumption, update `resume-agent.ts` to use:

```typescript
import { Agent } from '@anthropic-ai/claude-code';

const agent = await Agent.resume(session.agent_id);
await agent.sendMessage(reviewFeedbackPrompt);
```

## Security Considerations

1. **Webhook Signature** - Always verify the `X-Hub-Signature-256` header
2. **API Key** - Store `ANTHROPIC_API_KEY` securely, never commit
3. **Network** - Use HTTPS in production
4. **Rate Limiting** - Consider adding rate limiting for production use

## Troubleshooting

**"No agent session found"**
- Ensure the session was registered before the review came in
- Check the PR number and repository match exactly

**"Invalid signature"**
- Verify `WEBHOOK_SECRET` matches `PR_REVIEW_WEBHOOK_SECRET` in GitHub

**Agent not responding**
- Check `ANTHROPIC_API_KEY` is valid
- Review server logs for API errors
