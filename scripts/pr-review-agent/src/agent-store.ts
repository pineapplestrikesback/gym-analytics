import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AgentSession {
  pr_number: number;
  repository: string;
  agent_id: string;
  branch_name: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'failed';
  context_summary: string | null;
}

export interface CreateSessionParams {
  prNumber: number;
  repository: string;
  agentId: string;
  branchName: string;
  contextSummary?: string;
}

export class AgentStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || path.join(__dirname, '../data/agent-sessions.db');

    // Ensure data directory exists
    const dataDir = path.dirname(resolvedPath);
    import('fs').then(fs => {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    });

    this.db = new Database(resolvedPath);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pr_number INTEGER NOT NULL,
        repository TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        branch_name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'failed')),
        context_summary TEXT,
        UNIQUE(pr_number, repository)
      );

      CREATE INDEX IF NOT EXISTS idx_pr_repo ON agent_sessions(pr_number, repository);
      CREATE INDEX IF NOT EXISTS idx_agent_id ON agent_sessions(agent_id);
    `);
  }

  /**
   * Create or update an agent session for a PR
   */
  createSession(params: CreateSessionParams): AgentSession {
    const { prNumber, repository, agentId, branchName, contextSummary } = params;

    const stmt = this.db.prepare(`
      INSERT INTO agent_sessions (pr_number, repository, agent_id, branch_name, context_summary)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(pr_number, repository) DO UPDATE SET
        agent_id = excluded.agent_id,
        updated_at = CURRENT_TIMESTAMP,
        status = 'active',
        context_summary = COALESCE(excluded.context_summary, context_summary)
      RETURNING *
    `);

    return stmt.get(prNumber, repository, agentId, branchName, contextSummary ?? null) as AgentSession;
  }

  /**
   * Get the agent session for a specific PR
   */
  getSession(prNumber: number, repository: string): AgentSession | null {
    const stmt = this.db.prepare(`
      SELECT * FROM agent_sessions
      WHERE pr_number = ? AND repository = ?
    `);

    return stmt.get(prNumber, repository) as AgentSession | null;
  }

  /**
   * Get session by agent ID
   */
  getSessionByAgentId(agentId: string): AgentSession | null {
    const stmt = this.db.prepare(`
      SELECT * FROM agent_sessions WHERE agent_id = ?
    `);

    return stmt.get(agentId) as AgentSession | null;
  }

  /**
   * Update session status
   */
  updateStatus(prNumber: number, repository: string, status: AgentSession['status']): void {
    const stmt = this.db.prepare(`
      UPDATE agent_sessions
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE pr_number = ? AND repository = ?
    `);

    stmt.run(status, prNumber, repository);
  }

  /**
   * Update context summary (for long sessions)
   */
  updateContextSummary(prNumber: number, repository: string, summary: string): void {
    const stmt = this.db.prepare(`
      UPDATE agent_sessions
      SET context_summary = ?, updated_at = CURRENT_TIMESTAMP
      WHERE pr_number = ? AND repository = ?
    `);

    stmt.run(summary, prNumber, repository);
  }

  /**
   * List all active sessions
   */
  listActiveSessions(): AgentSession[] {
    const stmt = this.db.prepare(`
      SELECT * FROM agent_sessions WHERE status = 'active'
      ORDER BY updated_at DESC
    `);

    return stmt.all() as AgentSession[];
  }

  /**
   * Delete old completed sessions (cleanup)
   */
  cleanupOldSessions(daysOld: number = 30): number {
    const stmt = this.db.prepare(`
      DELETE FROM agent_sessions
      WHERE status IN ('completed', 'failed')
      AND updated_at < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(daysOld);
    return result.changes;
  }

  close(): void {
    this.db.close();
  }
}

// Export singleton instance for convenience
let storeInstance: AgentStore | null = null;

export function getAgentStore(dbPath?: string): AgentStore {
  if (!storeInstance) {
    storeInstance = new AgentStore(dbPath);
  }
  return storeInstance;
}
