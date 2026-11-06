import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const runs = sqliteTable("farol_runs", {
  id: text().primaryKey().notNull(),
  secretHash: text("secret_hash").notNull(),
  scenario: text({ enum: ["instavel", "indisponivel"] }).notNull(),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [
  index("farol_runs_expires_at_idx").on(table.expiresAt),
  check("farol_runs_scenario", sql`${table.scenario} IN ('instavel','indisponivel')`),
]);

export const journal = sqliteTable("farol_actions", {
  runId: text("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
  seq: integer().notNull(),
  action: text().notNull(),
}, (table) => [
  primaryKey({ columns: [table.runId, table.seq] }),
  check("farol_actions_seq", sql`${table.seq} BETWEEN 1 AND 32`),
  check("farol_actions_action", sql`${table.action} IN ('enviar-1042','enviar-1047','enviar-1051','rodada','recuperar','reprocessar')`),
]);

export const ledgerSessions = sqliteTable("ledger_sessions", {
  id: text().primaryKey().notNull(),
  secretHash: text("secret_hash").notNull(),
  role: text({ enum: ["analista", "leitor"] }).notNull(),
  expiresAt: integer("expires_at").notNull(),
  payload: text().notNull(),
  revision: integer().notNull().default(0),
  nonce: text(),
}, (table) => [
  index("ledger_sessions_expires_idx").on(table.expiresAt),
  check("ledger_sessions_role", sql`${table.role} IN ('analista','leitor')`),
  check("ledger_sessions_revision", sql`${table.revision} BETWEEN 0 AND 60`),
  check("ledger_sessions_payload", sql`json_valid(${table.payload})`),
]);

export const ledgerAudit = sqliteTable("ledger_audit", {
  sessionId: text("session_id").notNull().references(() => ledgerSessions.id, { onDelete: "cascade" }),
  rev: integer().notNull(),
  action: text().notNull(),
  detail: text().notNull(),
  recordedAt: integer("recorded_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.sessionId, table.rev] }),
]);
