CREATE TYPE "public"."account_token_purpose" AS ENUM('verify_email', 'reset_password');--> statement-breakpoint
CREATE TABLE "peerlock_account_sessions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peerlock_account_tokens" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" varchar(36) NOT NULL,
	"purpose" "account_token_purpose" NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peerlock_accounts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"username" varchar(48) NOT NULL,
	"password_salt" varchar(64) NOT NULL,
	"password_hash" varchar(128) NOT NULL,
	"email_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "peerlock_account_sessions_token_hash_unique" ON "peerlock_account_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "peerlock_account_sessions_account_idx" ON "peerlock_account_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "peerlock_account_sessions_expiry_idx" ON "peerlock_account_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "peerlock_account_tokens_token_hash_unique" ON "peerlock_account_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "peerlock_account_tokens_account_purpose_idx" ON "peerlock_account_tokens" USING btree ("account_id","purpose");--> statement-breakpoint
CREATE INDEX "peerlock_account_tokens_expiry_idx" ON "peerlock_account_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "peerlock_accounts_email_unique" ON "peerlock_accounts" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "peerlock_accounts_username_unique" ON "peerlock_accounts" USING btree ("username");