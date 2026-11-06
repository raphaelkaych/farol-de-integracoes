CREATE TABLE `ledger_audit` (
	`session_id` text NOT NULL,
	`rev` integer NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`recorded_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `rev`),
	FOREIGN KEY (`session_id`) REFERENCES `ledger_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ledger_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`secret_hash` text NOT NULL,
	`role` text NOT NULL,
	`expires_at` integer NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`nonce` text,
	CONSTRAINT "ledger_sessions_role" CHECK("ledger_sessions"."role" IN ('analista','leitor')),
	CONSTRAINT "ledger_sessions_revision" CHECK("ledger_sessions"."revision" BETWEEN 0 AND 60),
	CONSTRAINT "ledger_sessions_payload" CHECK(json_valid("ledger_sessions"."payload"))
);
--> statement-breakpoint
CREATE INDEX `ledger_sessions_expires_idx` ON `ledger_sessions` (`expires_at`);