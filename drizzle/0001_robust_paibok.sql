CREATE TABLE `peerlock_guest_sessions` (
	`id` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_seen_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `peerlock_guest_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `peerlock_room_memberships` (
	`id` varchar(36) NOT NULL,
	`room_id` varchar(36) NOT NULL,
	`session_id` varchar(64) NOT NULL,
	`display_name` varchar(64) NOT NULL,
	`display_color` varchar(16) NOT NULL,
	`status` enum('pending','approved','declined','expired') NOT NULL,
	`request_expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_seen_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `peerlock_room_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `peerlock_membership_room_session_unique` UNIQUE(`room_id`,`session_id`)
);
--> statement-breakpoint
CREATE TABLE `peerlock_rooms` (
	`id` varchar(36) NOT NULL,
	`code` varchar(8) NOT NULL,
	`owner_session_id` varchar(64) NOT NULL,
	`password_salt` varchar(64),
	`password_hash` varchar(128),
	`transport_secret` varchar(128) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_activity_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `peerlock_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `peerlock_rooms_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE INDEX `peerlock_membership_room_status_idx` ON `peerlock_room_memberships` (`room_id`,`status`);--> statement-breakpoint
CREATE INDEX `peerlock_rooms_active_idx` ON `peerlock_rooms` (`last_activity_at`);