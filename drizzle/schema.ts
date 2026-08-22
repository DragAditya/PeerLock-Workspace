import { boolean, index, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const roomMembershipStatus = pgEnum("room_membership_status", ["pending", "approved", "declined", "expired"]);
export const accountTokenPurpose = pgEnum("account_token_purpose", ["verify_email", "reset_password"]);

/** Core template user table. Peerlock collaboration itself remains guest-first. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Opaque, cookie-bound browser guests. No email, credential, document, or chat content is stored here. */
export const peerlockGuestSessions = pgTable("peerlock_guest_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  accountId: varchar("account_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [index("peerlock_guest_sessions_account_idx").on(table.accountId)]);

/** Server metadata registry for room identity and access policy only. Document data stays in Yjs/IndexedDB/WebRTC. */
export const peerlockRooms = pgTable("peerlock_rooms", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 8 }).notNull(),
  ownerSessionId: varchar("owner_session_id", { length: 64 }).notNull(),
  passwordSalt: varchar("password_salt", { length: 64 }),
  passwordHash: varchar("password_hash", { length: 128 }),
  transportSecret: varchar("transport_secret", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [uniqueIndex("peerlock_rooms_code_unique").on(table.code), index("peerlock_rooms_active_idx").on(table.lastActivityAt)]);

/** Membership and join-request state. It never contains document body, editor updates, or chat messages. */
export const peerlockRoomMemberships = pgTable("peerlock_room_memberships", {
  id: varchar("id", { length: 36 }).primaryKey(),
  roomId: varchar("room_id", { length: 36 }).notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  displayName: varchar("display_name", { length: 64 }).notNull(),
  displayColor: varchar("display_color", { length: 16 }).notNull(),
  status: roomMembershipStatus("status").notNull(),
  requestExpiresAt: timestamp("request_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [uniqueIndex("peerlock_membership_room_session_unique").on(table.roomId, table.sessionId), index("peerlock_membership_room_status_idx").on(table.roomId, table.status)]);

/** Optional Peerlock account identity. Local documents remain device-local and are never stored here. */
export const peerlockAccounts = pgTable("peerlock_accounts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  username: varchar("username", { length: 48 }).notNull(),
  passwordSalt: varchar("password_salt", { length: 64 }).notNull(),
  passwordHash: varchar("password_hash", { length: 128 }).notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedInAt: timestamp("last_signed_in_at"),
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: varchar("suspension_reason", { length: 240 }),
}, table => [
  uniqueIndex("peerlock_accounts_email_unique").on(table.email),
  uniqueIndex("peerlock_accounts_username_unique").on(table.username),
]);

/** Opaque, revocable account sessions. Browser cookies hold only random tokens, never account data. */
export const peerlockAccountSessions = pgTable("peerlock_account_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: varchar("account_id", { length: 36 }).notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, table => [
  uniqueIndex("peerlock_account_sessions_token_hash_unique").on(table.tokenHash),
  index("peerlock_account_sessions_account_idx").on(table.accountId),
  index("peerlock_account_sessions_expiry_idx").on(table.expiresAt),
]);

/** Hashed, expiring, single-use email-verification and password-reset tokens. */
export const peerlockAccountTokens = pgTable("peerlock_account_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: varchar("account_id", { length: 36 }).notNull(),
  purpose: accountTokenPurpose("purpose").notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [
  uniqueIndex("peerlock_account_tokens_token_hash_unique").on(table.tokenHash),
  index("peerlock_account_tokens_account_purpose_idx").on(table.accountId, table.purpose),
  index("peerlock_account_tokens_expiry_idx").on(table.expiresAt),
]);

/** Admin-created global notices. They contain operational text only, never document or chat content. */
export const peerlockAnnouncements = pgTable("peerlock_announcements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  message: varchar("message", { length: 480 }).notNull(),
  tone: varchar("tone", { length: 16 }).notNull().default("info"),
  active: boolean("active").notNull().default(true),
  createdByAccountId: varchar("created_by_account_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, table => [index("peerlock_announcements_active_idx").on(table.active, table.createdAt)]);

/** Immutable metadata-only history for accountable super-admin actions. */
export const peerlockAdminAuditLogs = pgTable("peerlock_admin_audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  actorAccountId: varchar("actor_account_id", { length: 36 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  targetType: varchar("target_type", { length: 32 }).notNull(),
  targetId: varchar("target_id", { length: 64 }),
  summary: varchar("summary", { length: 360 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => [index("peerlock_admin_audit_logs_created_idx").on(table.createdAt), index("peerlock_admin_audit_logs_target_idx").on(table.targetType, table.targetId)]);
