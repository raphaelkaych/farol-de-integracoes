CREATE TABLE `farol_actions` (
	`run_id` text NOT NULL,
	`seq` integer NOT NULL,
	`action` text NOT NULL,
	PRIMARY KEY(`run_id`, `seq`),
	FOREIGN KEY (`run_id`) REFERENCES `farol_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "farol_actions_seq" CHECK("farol_actions"."seq" BETWEEN 1 AND 32),
	CONSTRAINT "farol_actions_action" CHECK("farol_actions"."action" IN ('enviar-1042','enviar-1047','enviar-1051','rodada','recuperar','reprocessar'))
);
--> statement-breakpoint
CREATE TABLE `farol_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`secret_hash` text NOT NULL,
	`scenario` text NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT "farol_runs_scenario" CHECK("farol_runs"."scenario" IN ('instavel','indisponivel'))
);
--> statement-breakpoint
CREATE INDEX `farol_runs_expires_at_idx` ON `farol_runs` (`expires_at`);