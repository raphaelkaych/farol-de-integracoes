import type { Action, Scenario } from "./model.ts";

export interface Run {
  id: string;
  scenario: Scenario;
  journal: Action[];
}
export interface NewRun {
  id: string;
  secretHash: string;
  scenario: Scenario;
  expiresAt: number;
}
export interface RunStore {
  create(run: NewRun, now: number): Promise<boolean>;
  get(id: string, secretHash: string, now: number): Promise<Run | null>;
  append(id: string, secretHash: string, now: number, version: number, action: Action): Promise<boolean>;
}

type JournalRow = { id: string; scenario: Scenario; action: Action | null };

export function d1RunStore(db: D1Database): RunStore {
  return {
    async create(run, now) {
      const [, insert] = await db.batch([
        db.prepare("DELETE FROM farol_runs WHERE expires_at <= ?").bind(now),
        db.prepare(`
          INSERT INTO farol_runs (id, secret_hash, scenario, expires_at)
          SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM farol_runs) < 800
        `).bind(run.id, run.secretHash, run.scenario, run.expiresAt),
      ]);
      return insert.meta.changes === 1;
    },

    async get(id, secretHash, now) {
      const { results } = await db.prepare(`
        SELECT r.id, r.scenario, a.action
        FROM farol_runs r LEFT JOIN farol_actions a ON a.run_id = r.id
        WHERE r.id = ? AND r.secret_hash = ? AND r.expires_at > ?
        ORDER BY a.seq
      `).bind(id, secretHash, now).all<JournalRow>();
      if (!results.length) return null;
      return {
        id: results[0].id,
        scenario: results[0].scenario,
        journal: results.flatMap((row) => row.action ? [row.action] : []),
      };
    },

    async append(id, secretHash, now, version, action) {
      const result = await db.prepare(`
        INSERT INTO farol_actions (run_id, seq, action)
        SELECT r.id, ?, ? FROM farol_runs r
        WHERE r.id = ? AND r.secret_hash = ? AND r.expires_at > ?
          AND (SELECT COALESCE(MAX(seq), 0) FROM farol_actions WHERE run_id = r.id) = ?
        ON CONFLICT (run_id, seq) DO NOTHING
      `).bind(version + 1, action, id, secretHash, now, version).run();
      return result.meta.changes === 1;
    },
  };
}
