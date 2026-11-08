import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

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

export const contractSandboxes = sqliteTable("contract_sandboxes", {
  id: text().primaryKey().notNull(),
  operatorHash: text("operator_hash").notNull(),
  readerHash: text("reader_hash").notNull(),
  outsiderHash: text("outsider_hash").notNull(),
  expiresAt: integer("expires_at").notNull(),
  bucket: integer().notNull().default(0),
  used: integer().notNull().default(0),
}, (table) => [index("contract_sandboxes_expires_idx").on(table.expiresAt)]);

export const contractChanges = sqliteTable("contract_changes", {
  id: text().primaryKey().notNull(),
  sandboxId: text("sandbox_id").notNull().references(() => contractSandboxes.id, { onDelete: "cascade" }),
  organization: text({ enum: ["aurora", "orbita"] }).notNull(),
  requestKey: text("request_key").notNull(),
  service: text({ enum: ["catalogo", "notificacoes", "cobranca"] }).notNull(),
  releaseWindow: text("release_window", { enum: ["comercial", "noturna"] }).notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  unique("contract_request_unique").on(table.sandboxId, table.organization, table.requestKey),
  check("contract_organization", sql`${table.organization} IN ('aurora','orbita')`),
  check("contract_service", sql`${table.service} IN ('catalogo','notificacoes','cobranca')`),
  check("contract_window", sql`${table.releaseWindow} IN ('comercial','noturna')`),
  check("contract_billing_window", sql`${table.service} <> 'cobranca' OR ${table.releaseWindow} = 'noturna'`),
]);
