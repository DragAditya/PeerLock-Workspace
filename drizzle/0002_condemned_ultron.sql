CREATE TABLE "peerlock_admin_audit_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"actor_account_id" varchar(36) NOT NULL,
	"action" varchar(64) NOT NULL,
	"target_type" varchar(32) NOT NULL,
	"target_id" varchar(64),
	"summary" varchar(360) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peerlock_announcements" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"message" varchar(480) NOT NULL,
	"tone" varchar(16) DEFAULT 'info' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_account_id" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "peerlock_accounts" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "peerlock_accounts" ADD COLUMN "suspension_reason" varchar(240);--> statement-breakpoint
ALTER TABLE "peerlock_guest_sessions" ADD COLUMN "account_id" varchar(36);--> statement-breakpoint
CREATE INDEX "peerlock_admin_audit_logs_created_idx" ON "peerlock_admin_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "peerlock_admin_audit_logs_target_idx" ON "peerlock_admin_audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "peerlock_announcements_active_idx" ON "peerlock_announcements" USING btree ("active","created_at");--> statement-breakpoint
CREATE INDEX "peerlock_guest_sessions_account_idx" ON "peerlock_guest_sessions" USING btree ("account_id");