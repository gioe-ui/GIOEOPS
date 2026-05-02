ALTER TABLE `evaluations` ADD `updatedBy` text;--> statement-breakpoint
ALTER TABLE `evaluations` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;