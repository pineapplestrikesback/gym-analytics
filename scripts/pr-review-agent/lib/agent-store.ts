import { kv } from '@vercel/kv';

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
  await kv.set(key, session);

  // Also add to active sessions list for listing
  await kv.sadd('pr-sessions:active', key);

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
  return await kv.get<AgentSession>(key);
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
  const session = await kv.get<AgentSession>(key);

  if (session) {
    session.status = status;
    session.updatedAt = new Date().toISOString();
    await kv.set(key, session);

    // Remove from active list if completed
    if (status === 'completed') {
      await kv.srem('pr-sessions:active', key);
    }
  }
}

/**
 * List all active sessions
 */
export async function listActiveSessions(): Promise<AgentSession[]> {
  const keys = await kv.smembers('pr-sessions:active');
  const sessions: AgentSession[] = [];

  for (const key of keys) {
    const session = await kv.get<AgentSession>(key as string);
    if (session && session.status !== 'completed') {
      sessions.push(session);
    }
  }

  return sessions;
}

/**
 * Delete a session
 */
export async function deleteSession(prNumber: number, repository: string): Promise<void> {
  const key = sessionKey(prNumber, repository);
  await kv.del(key);
  await kv.srem('pr-sessions:active', key);
}
