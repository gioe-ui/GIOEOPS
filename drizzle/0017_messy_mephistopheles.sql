CREATE TABLE `suspects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`nome` varchar(255),
	`dataNascimento` varchar(20),
	`nacionalidade` varchar(100),
	`nif` varchar(20),
	`cc` varchar(20),
	`morada` text,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suspects_id` PRIMARY KEY(`id`)
);
