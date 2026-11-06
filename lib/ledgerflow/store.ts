import type { Audit, Ledger, Role, View } from "./model.ts";

export interface SessionKey { id: string; hash: string; now: number }
export interface LedgerStore {
  open(key: SessionKey, role: Role, ledger: Ledger): Promise<boolean>;
  get(key: SessionKey): Promise<View | null>;
  write(key: SessionKey, revision: number, ledger: Ledger, action: string, detail: string): Promise<boolean>;
}

type Row = { payload: string; role: Role; revision: number; history: string };
const lifetime = 2 * 60 * 60 * 1000;

export function ledgerStore(db: D1Database): LedgerStore {
  return {
    async open(key, role, ledger) {
      const [, created] = await db.batch([
        db.prepare("DELETE FROM ledger_sessions WHERE expires_at <= ?").bind(key.now),
        db.prepare(`
          INSERT INTO ledger_sessions (id, secret_hash, role, expires_at, payload)
          SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM ledger_sessions) < 400
        `).bind(key.id, key.hash, role, key.now + lifetime, JSON.stringify(ledger)),
      ]);
      return created.meta.changes === 1;
    },

    async get(key) {
      const row = await db.prepare(`
        SELECT s.payload, s.role, s.revision,
          (SELECT json_group_array(json_object('revision', rev, 'action', action, 'detail', detail, 'at', recorded_at))
           FROM (SELECT * FROM ledger_audit WHERE session_id = s.id ORDER BY rev DESC LIMIT 12)) AS history
        FROM ledger_sessions s WHERE s.id = ? AND s.secret_hash = ? AND s.expires_at > ?
      `).bind(key.id, key.hash, key.now).first<Row>();
      if (!row) return null;
      return { ...JSON.parse(row.payload) as Ledger, role: row.role, revision: row.revision, audit: JSON.parse(row.history) as Audit[] };
    },

    async write(key, revision, ledger, action, detail) {
      const nonce = crypto.randomUUID();
      const [changed] = await db.batch([
        db.prepare(`
          UPDATE ledger_sessions SET payload = ?, revision = revision + 1, nonce = ?
          WHERE id = ? AND secret_hash = ? AND expires_at > ? AND role = 'analista' AND revision = ?
        `).bind(JSON.stringify(ledger), nonce, key.id, key.hash, key.now, revision),
        db.prepare(`
          INSERT INTO ledger_audit (session_id, rev, action, detail, recorded_at)
          SELECT id, revision, ?, ?, ? FROM ledger_sessions WHERE id = ? AND nonce = ?
        `).bind(action, detail, key.now, key.id, nonce),
      ]);
      return changed.meta.changes === 1;
    },
  };
}
