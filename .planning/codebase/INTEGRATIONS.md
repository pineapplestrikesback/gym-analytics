# External Integrations

**Analysis Date:** 2026-01-18

## APIs & External Services

**Hevy Workout Tracking API:**

- Purpose: Import workout data from Hevy app
- SDK/Client: Custom client in `src/core/parsers/hevy-api.ts`
- Base URL: `https://api.hevyapp.com/v1`
- Auth: API key stored per-profile in `hevyApiKey` field
- Endpoints used:
  - `GET /workouts` - Full sync (paginated)
  - `GET /workouts/events` - Incremental sync since timestamp
- Implementation: `src/db/hooks/useHevySync.ts`

**Vercel Analytics:**

- Purpose: Production analytics and usage tracking
- SDK: `@vercel/analytics/react` (v1.6.1)
- Implementation: `<Analytics />` component in `src/App.tsx`
- Configuration: Automatic (no env vars required)

**Google Fonts:**

- Purpose: Typography (Outfit font family)
- CDN: `fonts.googleapis.com`, `fonts.gstatic.com`
- Caching: Workbox CacheFirst strategy with 1-year TTL
- Configuration: Preconnect links in `index.html`

## Data Storage

**Database:**

- Type: IndexedDB (browser-native)
- Wrapper: Dexie.js
- Database name: `ScientificMuscleDB`
- Schema: `src/db/schema.ts`
- Tables:
  - `profiles` - User profiles with settings
  - `workouts` - Workout sessions with sets
  - `unmappedExercises` - Exercises needing mapping
  - `exerciseMappings` - User exercise mappings
  - `defaultExerciseOverrides` - Custom muscle values
  - `defaultNameMappingOverrides` - Custom name mappings

**File Storage:**

- Local filesystem only (CSV file upload for import)
- No cloud storage integration

**Caching:**

- Service Worker via Workbox (PWA)
- TanStack Query in-memory cache for API responses

## Authentication & Identity

**Auth Provider:**

- None (local-first app)
- User profiles stored locally in IndexedDB
- Hevy API key stored per-profile (user-provided)

## Monitoring & Observability

**Error Tracking:**

- None (no Sentry/LogRocket integration)

**Analytics:**

- Vercel Analytics for page views and web vitals

**Logs:**

- Browser console only
- `console.warn` and `console.error` allowed per ESLint config

## CI/CD & Deployment

**Hosting:**

- Vercel (static PWA deployment)
- No backend required

**CI Pipeline:**

- GitHub Actions

**Workflows (`.github/workflows/`):**

1. `auto-pr-review.yml` - Claude Code automated PR review
   - Triggers: PR opened/synchronized, @claude mentions
   - Uses: `anthropics/claude-code-action@v1`
   - Requires: `CLAUDE_CODE_OAUTH_TOKEN` secret

2. `pr-review-dispatch.yml` - PR review agent webhook dispatch
   - Triggers: PR reviews, review comments, issue comments
   - Dispatches to: `PR_REVIEW_WEBHOOK_URL` (optional)
   - Requires: `PR_REVIEW_WEBHOOK_SECRET` secret

## Environment Configuration

**Required env vars:**

- None (local-first app)

**Optional secrets (GitHub Actions):**

- `CLAUDE_CODE_OAUTH_TOKEN` - For automated PR reviews
- `PR_REVIEW_WEBHOOK_URL` - For PR review agent dispatch
- `PR_REVIEW_WEBHOOK_SECRET` - For webhook HMAC verification

**User-provided credentials:**

- Hevy API Key - Stored per-profile in IndexedDB
- Entered via Settings page UI

## Webhooks & Callbacks

**Incoming:**

- None (static PWA, no server endpoints)

**Outgoing:**

- GitHub Actions can dispatch to `PR_REVIEW_WEBHOOK_URL` for PR review agent integration

## Data Import/Export

**CSV Import:**

- Hevy export format supported
- Parser: `src/core/parsers/csv-parser.ts`
- Strong format: Detected but not implemented

**API Import:**

- Hevy API sync via `useHevySync` hook
- Supports full sync and incremental sync

**Export:**

- Not implemented

## Third-Party Libraries with External Dependencies

**react-body-highlighter:**

- Purpose: Anatomical body diagrams
- External deps: None (SVG-based)

**recharts:**

- Purpose: Charts and graphs
- External deps: None (SVG-based)

**lucide-react:**

- Purpose: Icon library
- External deps: None (inline SVG)

---

_Integration audit: 2026-01-18_
