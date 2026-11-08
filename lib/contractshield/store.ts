import { changesLimit, requestLimit, sandboxLifetime, type Actor, type ChangeInput } from "./contract.ts";

type Organization = "aurora" | "orbita";
export type Scope = { id: string; organization: Organization; actor: Actor; expiresAt: number };
export type StoredChange = ChangeInput & { id: string; createdAt: number };
const columns = "id, service, release_window AS releaseWindow, created_at AS createdAt";
const scopeWhere = "sandbox_id = ? AND organization = ?";

export function contractStore(db: D1Database) {
  return {
    async open(id: string, hashes: Record<Actor, string>, now: number, expires: number) {
      const [, created] = await db.batch([
        db.prepare("DELETE FROM contract_sandboxes WHERE expires_at <= ?").bind(now),
        db.prepare(`
          INSERT INTO contract_sandboxes (id, operator_hash, reader_hash, outsider_hash, expires_at)
          SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM contract_sandboxes) < 200
        `).bind(id, hashes.operador, hashes.leitor, hashes.externo, expires),
      ]);
      return created.meta.changes === 1;
    },

    async authorize(id: string, hash: string, now: number): Promise<Scope | null> {
      const row = await db.prepare(`
        SELECT CASE ? WHEN operator_hash THEN 'operador' WHEN reader_hash THEN 'leitor'
          WHEN outsider_hash THEN 'externo' END AS actor, expires_at AS expiresAt
        FROM contract_sandboxes WHERE id = ? AND expires_at > ?
      `).bind(hash, id, now).first<{ actor: Actor | null; expiresAt: number }>();
      if (!row?.actor) return null;
      return { id, actor: row.actor, expiresAt: row.expiresAt, organization: row.actor === "externo" ? "orbita" : "aurora" };
    },

    async consume(scope: Scope, now: number) {
      const bucket = Math.floor((now + sandboxLifetime - scope.expiresAt) / 60_000);
      const result = await db.prepare(`
        UPDATE contract_sandboxes SET used = CASE WHEN bucket = ? THEN used + 1 ELSE 1 END, bucket = ?
        WHERE id = ? AND expires_at > ? AND (bucket <> ? OR used < ?)
      `).bind(bucket, bucket, scope.id, now, bucket, requestLimit).run();
      return result.meta.changes === 1;
    },

    async read(scope: Scope, id: string) {
      return db.prepare(`SELECT ${columns} FROM contract_changes WHERE ${scopeWhere} AND id = ?`)
        .bind(scope.id, scope.organization, id).first<StoredChange>();
    },

    async list(scope: Scope) {
      const { results } = await db.prepare(`
        SELECT ${columns} FROM contract_changes WHERE ${scopeWhere} ORDER BY created_at DESC, id LIMIT ?
      `).bind(scope.id, scope.organization, changesLimit).all<StoredChange>();
      return results;
    },

    async create(scope: Scope, key: string, input: ChangeInput, now: number) {
      const row = await db.prepare(`
        INSERT INTO contract_changes (id, sandbox_id, organization, request_key, service, release_window, created_at)
        SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM contract_sandboxes WHERE id = ? AND expires_at > ?)
          AND (SELECT COUNT(*) FROM contract_changes WHERE ${scopeWhere}) < ?
        ON CONFLICT (sandbox_id, organization, request_key) DO NOTHING
        RETURNING ${columns}
      `).bind(crypto.randomUUID(), scope.id, scope.organization, key, input.service, input.releaseWindow, now,
        scope.id, now, scope.id, scope.organization, changesLimit).first<StoredChange>();
      if (row) return { row, created: true };
      const replay = await db.prepare(`SELECT ${columns} FROM contract_changes WHERE ${scopeWhere} AND request_key = ?`)
        .bind(scope.id, scope.organization, key).first<StoredChange>();
      return { row: replay, created: false };
    },
  };
}

export type ContractStore = ReturnType<typeof contractStore>;
