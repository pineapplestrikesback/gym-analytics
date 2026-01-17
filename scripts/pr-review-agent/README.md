# PR Review Agent Handler (Vercel)

Serverless webhook handler that resumes Claude agent sessions when PR review comments are posted.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PR Review Agent Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Agent pushes PR ──────────────────────────────────────────┐ │
│                                                               │ │
│  2. Register session ◄────────────────────────────────────────┤ │
│     POST /api/register { prNumber, agentId, branchName }      │ │
│                                                               │ │
│  3. Reviewer comments on PR                                   │ │
│                    │                                          │ │
│                    ▼                                          │ │
│  4. GitHub Action triggers ──► Vercel Function                │ │
│                                     │                         │ │
│                                     ▼                         │ │
│  5. Look up agent session from Vercel KV                      │ │
│                                     │                         │ │
│                                     ▼                         │ │
│  6. Resume Claude agent with review context                   │ │
│                                     │                         │ │
│                                     ▼                         │ │
│  7. Agent fixes code & pushes ◄─────┘                         │ │
│                                                               │ │
└───────────────────────────────────────────────────────────────┘
```

## Quick Start (5 minutes)

### 1. Deploy to Vercel

```bash
cd scripts/pr-review-agent
npm install
npx vercel
```

Follow the prompts to link to your Vercel account and create a new project.

### 2. Add Vercel KV Store

1. Go to your Vercel dashboard → Your Project → Storage
2. Click "Create Database" → Select "KV"
3. Name it `pr-review-sessions` and create
4. It auto-links to your project (environment variables set automatically)

### 3. Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `WEBHOOK_SECRET` | Generate with `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

### 4. Configure GitHub Repository

In your GitHub repo → Settings → Secrets and Variables → Actions:

| Secret | Value |
|--------|-------|
| `PR_REVIEW_WEBHOOK_URL` | Your Vercel URL (e.g., `https://pr-review-agent.vercel.app`) |
| `PR_REVIEW_WEBHOOK_SECRET` | Same value as `WEBHOOK_SECRET` above |

### 5. Deploy to Production

```bash
npx vercel --prod
```

Done! The webhook handler is now live.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/register` | POST | Register a new agent session |
| `/api/pr-review` | POST | Main webhook (called by GitHub Action) |
| `/api/sessions` | GET | List active sessions |
| `/api/complete` | POST | Mark session as completed |

### Register a Session

When your Claude agent creates a PR, register the session:

```bash
curl -X POST https://your-app.vercel.app/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "prNumber": 42,
    "repository": "owner/repo",
    "agentId": "agent-abc-123",
    "branchName": "claude/feature-xyz",
    "contextSummary": "Implemented new volume calculator"
  }'
```

## Local Development

```bash
# Install dependencies
npm install

# Run locally (requires Vercel CLI login)
npm run dev
```

For local dev with KV, you can either:
- Link to your Vercel project: `npx vercel link`
- Or use a local `.env` file with KV credentials from Vercel dashboard

## How the GitHub Action Works

The workflow in `.github/workflows/pr-review-dispatch.yml`:

1. Triggers on `pull_request_review` and `issue_comment` events
2. Extracts PR number, review state, and comment body
3. POSTs to your Vercel webhook endpoint
4. Your handler looks up the agent session and resumes it

## Costs

- **Vercel**: Free tier includes 100GB bandwidth, 100k function invocations/month
- **Vercel KV**: Free tier includes 30k requests/month, 256MB storage
- **Anthropic API**: Pay per token (the resumed agent makes API calls)

For most projects, this runs entirely on free tiers.

## Troubleshooting

**"No agent session found"**
- Ensure the session was registered before the review came in
- Check the PR number and repository match exactly

**"Invalid signature"**
- Verify `WEBHOOK_SECRET` matches `PR_REVIEW_WEBHOOK_SECRET` in GitHub

**KV connection errors**
- Make sure KV store is linked in Vercel dashboard
- Check that environment variables are set for the correct environment (Production/Preview)

**Agent not responding**
- Check `ANTHROPIC_API_KEY` is valid
- View function logs in Vercel dashboard

## Security Notes

1. **Webhook signature verification** - Prevents unauthorized webhook calls
2. **Environment variables** - Never commit secrets; use Vercel's env var system
3. **KV access** - Vercel KV tokens are automatically scoped to your project
