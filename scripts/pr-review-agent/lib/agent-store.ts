import { Redis } from '@upstash/redis';

// Initialize Redis client - Upstash auto-reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export interface AgentSession {
  id: string;
  prNumber: number;
  repository: string;
  agentId: string;
  branchName: string;
  contextSummary?: string;
  status: 'active' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a unique session key for KV storage
 */
function sessionKey(prNumber: number, repository: string): string {
  return `pr-session:${repository}:${prNumber}`;
}

/**
 * Create a new agent session
 */
export async function createSession(data: {
  prNumber: number;
  repository: string;
  agentId: string;
  branchName: string;
  contextSummary?: string;
}): Promise<AgentSession> {
  const now = new Date().toISOString();
  const session: AgentSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    prNumber: data.prNumber,
    repository: data.repository,
    agentId: data.agentId,
    branchName: data.branchName,
    contextSummary: data.contextSummary,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const key = sessionKey(data.prNumber, data.repository);
  await redis.set(key, JSON.stringify(session));

  // Also add to active sessions list for listing
  await redis.sadd('pr-sessions:active', key);

  return session;
}

/**
 * Get a session by PR number and repository
 */
export async function getSession(
  prNumber: number,
  repository: string
): Promise<AgentSession | null> {
  const key = sessionKey(prNumber, repository);
  const data = await redis.get<string>(key);
  if (!data) return null;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  prNumber: number,
  repository: string,
  status: AgentSession['status']
): Promise<void> {
  const key = sessionKey(prNumber, repository);
  const session = await getSession(prNumber, repository);

  if (session) {
    session.status = status;
    session.updatedAt = new Date().toISOString();
    await redis.set(key, JSON.stringify(session));

    // Remove from active list if completed
    if (status === 'completed') {
      await redis.srem('pr-sessions:active', key);
    }
  }
}

/**
 * List all active sessions
 */
export async function listActiveSessions(): Promise<AgentSession[]> {
  const keys = await redis.smembers('pr-sessions:active');
  const sessions: AgentSession[] = [];

  for (const key of keys) {
    const data = await redis.get<string>(key as string);
    if (data) {
      const session = typeof data === 'string' ? JSON.parse(data) : data;
      if (session.status !== 'completed') {
        sessions.push(session);
      }
    }
  }

  return sessions;
}

/**
 * Delete a session
 */
export async function deleteSession(prNumber: number, repository: string): Promise<void> {
  const key = sessionKey(prNumber, repository);
  await redis.del(key);
  await redis.srem('pr-sessions:active', key);
}
