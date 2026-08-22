import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { peerlockAccountSessions, peerlockAccountTokens, peerlockAccounts, peerlockAdminAuditLogs, peerlockGuestSessions, peerlockRoomMemberships, peerlockRooms } from "../drizzle/schema";
import { configuredSuperAdminEmail } from "./adminAuthorization";
import { adminPermanentlyDeleteAccount } from "./adminService";
import { getDb } from "./db";

const accountId = randomUUID(); const guestId = randomUUID(); const roomId = randomUUID(); const sessionId = randomUUID(); const tokenId = randomUUID();
const email = `peerlock-delete-${accountId}@example.test`; const code = accountId.replace(/-/g, "").slice(0, 8).toUpperCase();
afterEach(async () => { const db = await getDb(); if (!db) return; await db.delete(peerlockRoomMemberships).where(eq(peerlockRoomMemberships.roomId, roomId)); await db.delete(peerlockRooms).where(eq(peerlockRooms.id, roomId)); await db.delete(peerlockGuestSessions).where(eq(peerlockGuestSessions.id, guestId)); await db.delete(peerlockAccountSessions).where(eq(peerlockAccountSessions.id, sessionId)); await db.delete(peerlockAccountTokens).where(eq(peerlockAccountTokens.id, tokenId)); await db.delete(peerlockAccounts).where(eq(peerlockAccounts.id, accountId)); await db.delete(peerlockAdminAuditLogs).where(eq(peerlockAdminAuditLogs.targetId, accountId)); }, 60_000);

describe("permanent account deletion", () => {
  it("removes account-server metadata so the email and username become available again", async () => {
    const db = await getDb(); expect(db).toBeTruthy();
    await db!.insert(peerlockAccounts).values({ id: accountId, email, username: `delete_${accountId.slice(0, 8)}`, passwordSalt: "test-salt", passwordHash: "test-hash", emailVerifiedAt: new Date() });
    await db!.insert(peerlockAccountSessions).values({ id: sessionId, accountId, tokenHash: `test-${sessionId}`, expiresAt: new Date(Date.now() + 60_000) });
    await db!.insert(peerlockAccountTokens).values({ id: tokenId, accountId, purpose: "verify_email", tokenHash: `test-${tokenId}`, expiresAt: new Date(Date.now() + 60_000) });
    await db!.insert(peerlockGuestSessions).values({ id: guestId, accountId });
    await db!.insert(peerlockRooms).values({ id: roomId, code, ownerSessionId: guestId, transportSecret: "test-only-transport-secret" });
    await db!.insert(peerlockRoomMemberships).values({ id: randomUUID(), roomId, sessionId: guestId, displayName: "Delete Test", displayColor: "#119977", status: "approved" });
    await adminPermanentlyDeleteAccount({ id: "admin-test", email: configuredSuperAdminEmail(), username: "admin", emailVerifiedAt: new Date(), suspendedAt: null }, accountId);
    const [account, session, token, guest, membership] = await Promise.all([
      db!.select().from(peerlockAccounts).where(eq(peerlockAccounts.id, accountId)), db!.select().from(peerlockAccountSessions).where(eq(peerlockAccountSessions.accountId, accountId)), db!.select().from(peerlockAccountTokens).where(eq(peerlockAccountTokens.accountId, accountId)), db!.select().from(peerlockGuestSessions).where(eq(peerlockGuestSessions.accountId, accountId)), db!.select().from(peerlockRoomMemberships).where(eq(peerlockRoomMemberships.roomId, roomId)),
    ]);
    expect(account).toHaveLength(0); expect(session).toHaveLength(0); expect(token).toHaveLength(0); expect(guest).toHaveLength(0); expect(membership).toHaveLength(0);
  }, 60_000);
});
