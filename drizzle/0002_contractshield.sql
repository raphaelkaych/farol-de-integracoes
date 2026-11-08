CREATE TABLE `contract_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`sandbox_id` text NOT NULL,
	`organization` text NOT NULL,
	`request_key` text NOT NULL,
	`service` text NOT NULL,
	`release_window` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`sandbox_id`) REFERENCES `contract_sandboxes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "contract_organization" CHECK("contract_changes"."organization" IN ('aurora','orbita')),
	CONSTRAINT "contract_service" CHECK("contract_changes"."service" IN ('catalogo','notificacoes','cobranca')),
	CONSTRAINT "contract_window" CHECK("contract_changes"."release_window" IN ('comercial','noturna')),
	CONSTRAINT "contract_billing_window" CHECK("contract_changes"."service" <> 'cobranca' OR "contract_changes"."release_window" = 'noturna')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contract_request_unique` ON `contract_changes` (`sandbox_id`,`organization`,`request_key`);--> statement-breakpoint
CREATE TABLE `contract_sandboxes` (
	`id` text PRIMARY KEY NOT NULL,
	`operator_hash` text NOT NULL,
	`reader_hash` text NOT NULL,
	`outsider_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`bucket` integer DEFAULT 0 NOT NULL,
	`used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contract_sandboxes_expires_idx` ON `contract_sandboxes` (`expires_at`);