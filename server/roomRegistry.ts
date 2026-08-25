import { and, eq, gt, sql } from "drizzle-orm";
import { parse as parseCookie } from "cookie";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { EventEmitter } from "node:events";
import type { Response } from "express";
import type { TrpcContext } from "./_core/context";
import { getSessionCookieOptions } from "./_core/cookies";
import { getDb } from "./db";
import { peerlockAccounts, peerlockGuestSessions, peerlockRoomMemberships, peerlockRooms } from "../drizzle/schema";

export const COOKIE_NAME = "peerlock_guest_session";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REQUEST_TTL_MS = 10 * 60 * 1000;
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;
const roomEvents = new EventEmitter();
roomEvents.setMaxListeners(100);

export type GuestIdentity = { name: string; color: string };
type RoomContext = Pick<TrpcContext, "req" | "res"> & Partial<Pick<TrpcContext, "account">>;
export function onRoomEvent(roomId: string, listener: () => void) { roomEvents.on(roomId, listener); return () => roomEvents.off(roomId, listener); }
function emitRoomEvent(roomId: string) { roomEvents.emit(roomId); }

function roomCode() { return Array.from(randomBytes(8), byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join(""); }
function secret() { return randomBytes(32).toString("hex"); }
function passwordRecord(password: string) { const salt = randomBytes(16).toString("hex"); return { salt, hash: scryptSync(password, salt, 64).toString("hex") }; }
export function verifyRoomPassword(password: string, salt: string, expectedHash: string) { const actual = scryptSync(password, salt, 64); const expected = Buffer.from(expectedHash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }
export function canViewCollaboratorProfiles(status: string | null | undefined) { return status === "approved"; }
export function safeCollaboratorProfile(row: { displayName: string; displayColor: string; username: string | null; avatarKey: string | null; verifiedAt: Date | null }) { return { name: row.username ?? row.displayName, color: row.displayColor, avatarUrl: row.avatarKey ? `/manus-storage/${row.avatarKey}` : null, verified: Boolean(row.verifiedAt) }; }

export async function ensureGuestSession(ctx: RoomContext) {
  const cookies = parseCookie(ctx.req.headers.cookie ?? "");
  let id = cookies[COOKIE_NAME];
  const accountId = ctx.account?.id ?? null;
  const db = await getDb();
  if (!db) throw new Error("Room registry is temporarily unavailable.");
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) {
    id = randomUUID();
    await db.insert(peerlockGuestSessions).values({ id, accountId });
    (ctx.res as Response).cookie(COOKIE_NAME, id, { ...getSessionCookieOptions(ctx.req), maxAge: 1000 * 60 * 60 * 24 * 30 });
  } else {
    await db.insert(peerlockGuestSessions).values({ id, accountId }).onConflictDoUpdate({ target: peerlockGuestSessions.id, set: { lastSeenAt: new Date(), accountId } });
  }
  return id;
}

export function clearGuestSession(ctx: Pick<TrpcContext, "req" | "res">) {
  (ctx.res as Response).clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
  return { success: true as const };
}

async function requireRoom(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Room registry is temporarily unavailable.");
  const [room] = await db.select().from(peerlockRooms).where(eq(peerlockRooms.code, code)).limit(1);
  if (!room) throw new Error("This room code does not exist.");
  return { db, room };
}

export async function createRegisteredRoom(ctx: RoomContext, input: { protected: boolean; password?: string; identity: GuestIdentity }) {
  const sessionId = await ensureGuestSession(ctx); const db = await getDb(); if (!db) throw new Error("Room registry is temporarily unavailable.");
  const pass = input.password?.trim() ?? "";
  if (input.protected && pass.length < 8) throw new Error("Password rooms need at least eight characters.");
  const password = input.protected ? passwordRecord(pass) : null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = roomCode(); const id = randomUUID(); const transportSecret = secret();
    try {
      await db.insert(peerlockRooms).values({ id, code, ownerSessionId: sessionId, passwordSalt: password?.salt, passwordHash: password?.hash, transportSecret });
      await db.insert(peerlockRoomMemberships).values({ id: randomUUID(), roomId: id, sessionId, displayName: input.identity.name, displayColor: input.identity.color, status: "approved" });
      return { id, code, protected: input.protected, transportSecret };
    } catch (error: unknown) { if (attempt === 7) throw error; }
  }
  throw new Error("Could not allocate a unique room code. Please try again.");
}

export async function requestRoomJoin(ctx: RoomContext, input: { code: string; password?: string; identity: GuestIdentity }) {
  const sessionId = await ensureGuestSession(ctx); const { db, room } = await requireRoom(input.code);
  if (room.passwordHash && (!input.password || !room.passwordSalt || !verifyRoomPassword(input.password, room.passwordSalt, room.passwordHash))) throw new Error("The room password is incorrect.");
  const [existing] = await db.select().from(peerlockRoomMemberships).where(and(eq(peerlockRoomMemberships.roomId, room.id), eq(peerlockRoomMemberships.sessionId, sessionId))).limit(1);
  if (existing?.status === "approved") return { state: "approved" as const, roomId: room.id, code: room.code, transportSecret: room.transportSecret, protected: Boolean(room.passwordHash) };
  const isOwner = room.ownerSessionId === sessionId;
  const status = isOwner ? "approved" : "pending";
  const expires = new Date(Date.now() + REQUEST_TTL_MS);
  if (existing) await db.update(peerlockRoomMemberships).set({ displayName: input.identity.name, displayColor: input.identity.color, status, requestExpiresAt: status === "pending" ? expires : null, lastSeenAt: new Date() }).where(eq(peerlockRoomMemberships.id, existing.id));
  else await db.insert(peerlockRoomMemberships).values({ id: randomUUID(), roomId: room.id, sessionId, displayName: input.identity.name, displayColor: input.identity.color, status, requestExpiresAt: status === "pending" ? expires : null });
  emitRoomEvent(room.id);
  return { state: status, roomId: room.id, code: room.code, protected: Boolean(room.passwordHash) };
}

export async function roomAccess(ctx: RoomContext, roomId: string) {
  const sessionId = await ensureGuestSession(ctx); const db = await getDb(); if (!db) throw new Error("Room registry is temporarily unavailable.");
  await db.update(peerlockRoomMemberships).set({ status: sql`CASE WHEN ${peerlockRoomMemberships.status} = 'pending' AND ${peerlockRoomMemberships.requestExpiresAt} < NOW() THEN 'expired' ELSE ${peerlockRoomMemberships.status} END` }).where(eq(peerlockRoomMemberships.roomId, roomId));
  const [membership] = await db.select().from(peerlockRoomMemberships).where(and(eq(peerlockRoomMemberships.roomId, roomId), eq(peerlockRoomMemberships.sessionId, sessionId))).limit(1);
  const [room] = await db.select().from(peerlockRooms).where(eq(peerlockRooms.id, roomId)).limit(1);
  if (!room || !membership) throw new Error("Room membership was not found.");
  if (membership.status !== "approved") return { state: membership.status, roomId, code: room.code, protected: Boolean(room.passwordHash) } as const;
  await db.update(peerlockRoomMemberships).set({ lastSeenAt: new Date() }).where(eq(peerlockRoomMemberships.id, membership.id));
  await db.update(peerlockRooms).set({ lastActivityAt: new Date() }).where(eq(peerlockRooms.id, room.id));
  return { state: "approved" as const, roomId, code: room.code, protected: Boolean(room.passwordHash), transportSecret: room.transportSecret, owner: room.ownerSessionId === sessionId };
}

export async function pendingRoomRequests(ctx: RoomContext, roomId: string) {
  const sessionId = await ensureGuestSession(ctx); const { db, room } = await requireRoomById(roomId);
  if (room.ownerSessionId !== sessionId) throw new Error("Only the room owner can view join requests.");
  return db.select({ id: peerlockRoomMemberships.id, name: peerlockRoomMemberships.displayName, color: peerlockRoomMemberships.displayColor, expiresAt: peerlockRoomMemberships.requestExpiresAt }).from(peerlockRoomMemberships).where(and(eq(peerlockRoomMemberships.roomId, roomId), eq(peerlockRoomMemberships.status, "pending"), gt(peerlockRoomMemberships.requestExpiresAt, new Date())));
}

/** Approved room members can view safe collaborator display metadata, but never email or workspace content. */
export async function roomCollaborators(ctx: RoomContext, roomId: string) {
  const sessionId = await ensureGuestSession(ctx); const { db } = await requireRoomById(roomId);
  const [viewer] = await db.select({ status: peerlockRoomMemberships.status }).from(peerlockRoomMemberships).where(and(eq(peerlockRoomMemberships.roomId, roomId), eq(peerlockRoomMemberships.sessionId, sessionId))).limit(1);
  if (!canViewCollaboratorProfiles(viewer?.status)) throw new Error("Only approved room members can view collaborator profiles.");
  const rows = await db.select({
    sessionId: peerlockRoomMemberships.sessionId,
    displayName: peerlockRoomMemberships.displayName,
    displayColor: peerlockRoomMemberships.displayColor,
    accountId: peerlockGuestSessions.accountId,
    username: peerlockAccounts.username,
    avatarKey: peerlockAccounts.avatarKey,
    verifiedAt: peerlockAccounts.emailVerifiedAt,
  }).from(peerlockRoomMemberships)
    .leftJoin(peerlockGuestSessions, eq(peerlockRoomMemberships.sessionId, peerlockGuestSessions.id))
    .leftJoin(peerlockAccounts, eq(peerlockGuestSessions.accountId, peerlockAccounts.id))
    .where(and(eq(peerlockRoomMemberships.roomId, roomId), eq(peerlockRoomMemberships.status, "approved")));
  return rows.map(safeCollaboratorProfile);
}

export async function roomEventSnapshot(ctx: RoomContext, roomId: string) {
  const sessionId = await ensureGuestSession(ctx); const { db, room } = await requireRoomById(roomId);
  const [membership] = await db.select().from(peerlockRoomMemberships).where(and(eq(peerlockRoomMemberships.roomId, roomId), eq(peerlockRoomMemberships.sessionId, sessionId))).limit(1);
  if (!membership) throw new Error("Room membership was not found.");
  if (room.ownerSessionId === sessionId) {
    const requests = await db.select({ id: peerlockRoomMemberships.id, name: peerlockRoomMemberships.displayName, color: peerlockRoomMemberships.displayColor, expiresAt: peerlockRoomMemberships.requestExpiresAt }).from(peerlockRoomMemberships).where(and(eq(peerlockRoomMemberships.roomId, roomId), eq(peerlockRoomMemberships.status, "pending"), gt(peerlockRoomMemberships.requestExpiresAt, new Date())));
    return { role: "owner" as const, requests };
  }
  return { role: "member" as const, state: membership.status };
}

async function requireRoomById(id: string) { const db = await getDb(); if (!db) throw new Error("Room registry is temporarily unavailable."); const [room] = await db.select().from(peerlockRooms).where(eq(peerlockRooms.id, id)).limit(1); if (!room) throw new Error("Room was not found."); return { db, room }; }

export async function decideRoomRequest(ctx: RoomContext, input: { roomId: string; requestId: string; allow: boolean }) {
  const sessionId = await ensureGuestSession(ctx); const { db, room } = await requireRoomById(input.roomId); if (room.ownerSessionId !== sessionId) throw new Error("Only the room owner can decide join requests.");
  const [request] = await db.select().from(peerlockRoomMemberships).where(and(eq(peerlockRoomMemberships.id, input.requestId), eq(peerlockRoomMemberships.roomId, input.roomId))).limit(1);
  if (!request || request.status !== "pending") throw new Error("This join request is no longer pending.");
  if (request.requestExpiresAt && request.requestExpiresAt.getTime() < Date.now()) throw new Error("This join request has expired.");
  await db.update(peerlockRoomMemberships).set({ status: input.allow ? "approved" : "declined", requestExpiresAt: null }).where(eq(peerlockRoomMemberships.id, request.id)); emitRoomEvent(input.roomId); return { success: true as const };
}

export async function liveRoomCount() { const db = await getDb(); if (!db) return 0; const result = await db.select({ count: sql<number>`count(*)` }).from(peerlockRooms).where(gt(peerlockRooms.lastActivityAt, new Date(Date.now() - ACTIVE_WINDOW_MS))); return Number(result[0]?.count ?? 0); }
