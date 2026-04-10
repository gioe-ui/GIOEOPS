ALTER TABLE `operations` ADD `operacaoPreenchida` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `operations` ADD `consumosPreenchidos` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `operations` ADD `observacoesPreenchidas` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `operations` ADD `flaggedForCompletion` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `operations` ADD `flaggedAt` timestamp;