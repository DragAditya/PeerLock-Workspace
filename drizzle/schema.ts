import { index, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const roomMembershipStatus = pgEnum("room_membership_status", ["pending", "approved", "declined", "expired"]);

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

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
