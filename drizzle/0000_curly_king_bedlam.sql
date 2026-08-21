CREATE TYPE "public"."room_membership_status" AS ENUM('pending', 'approved', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "peerlock_guest_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peerlock_room_memberships" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"room_id" varchar(36) NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"display_name" varchar(64) NOT NULL,
	"display_color" varchar(16) NOT NULL,
	"status" "room_membership_status" NOT NULL,
	"request_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peerlock_rooms" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"owner_session_id" varchar(64) NOT NULL,
	"password_salt" varchar(64),
	"password_hash" varchar(128),
	"transport_secret" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "peerlock_membership_room_session_unique" ON "peerlock_room_memberships" USING btree ("room_id","session_id");--> statement-breakpoint
CREATE INDEX "peerlock_membership_room_status_idx" ON "peerlock_room_memberships" USING btree ("room_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "peerlock_rooms_code_unique" ON "peerlock_rooms" USING btree ("code");--> statement-breakpoint
CREATE INDEX "peerlock_rooms_active_idx" ON "peerlock_rooms" USING btree ("last_activity_at");