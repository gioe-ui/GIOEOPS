CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` int NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`whatsappLink` text NOT NULL,
	`sent` tinyint NOT NULL DEFAULT 0,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
