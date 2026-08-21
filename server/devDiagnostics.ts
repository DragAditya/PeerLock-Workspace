import { count } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";
import { peerlockAccountSessions, peerlockAccounts, peerlockAccountTokens, peerlockGuestSessions, peerlockRoomMemberships, peerlockRooms } from "../drizzle/schema";
import { accountEmailDiagnostics } from "./accountAuth";
import { getDb, isNeonPostgresUrl } from "./db";

type TableProbe = { state: "ready"; records: number } | { state: "missing_or_unreachable"; message: string };
function safeDatabaseMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/does not exist|relation|peerlock_/i.test(message)) return "Table is missing. Apply the committed Neon migration during Render build.";
  if (/timeout|connect|network|fetch/i.test(message)) return "Database connection could not be completed.";
  return "Database query failed without exposing internal query details.";
}
async function probeTable(table: AnyPgTable): Promise<TableProbe> {
  const db = await getDb();
  if (!db) return { state: "missing_or_unreachable", message: "DATABASE_URL is absent, invalid, or not a Neon PostgreSQL URL." };
  try { const result = await db.select({ records: count() }).from(table); return { state: "ready", records: Number(result[0]?.records ?? 0) }; } catch (error) { return { state: "missing_or_unreachable", message: safeDatabaseMessage(error) }; }
}

export async function getDevDiagnostics(input: { accountId: string; verified: boolean }) {
  const [accounts, sessions, tokens, guestSessions, rooms, memberships] = await Promise.all([
    probeTable(peerlockAccounts), probeTable(peerlockAccountSessions), probeTable(peerlockAccountTokens), probeTable(peerlockGuestSessions), probeTable(peerlockRooms), probeTable(peerlockRoomMemberships),
  ]);
  const email = accountEmailDiagnostics();
  return {
    generatedAt: new Date().toISOString(),
    access: { authenticated: true, verified: input.verified, accountReference: `…${input.accountId.slice(-6)}` },
    runtime: { environment: process.env.NODE_ENV ?? "development", node: process.version, uptimeSeconds: Math.round(process.uptime()), appBaseUrlConfigured: Boolean(process.env.APP_BASE_URL) },
    database: { provider: "Neon PostgreSQL", urlLooksValid: isNeonPostgresUrl(process.env.DATABASE_URL), expectedMigrations: ["0000_curly_king_bedlam.sql", "0001_cloudy_malcolm_colcord.sql"], tables: { peerlock_accounts: accounts, peerlock_account_sessions: sessions, peerlock_account_tokens: tokens, peerlock_guest_sessions: guestSessions, peerlock_rooms: rooms, peerlock_room_memberships: memberships } },
    email: { configured: email.configured, senderConfigured: email.senderConfigured, appBaseUrlConfigured: email.baseUrlConfigured, lastAttemptAt: email.attemptedAt, lastDelivery: email.delivered === null ? "No attempt during this process" : email.delivered ? "Accepted by provider" : "Not delivered", providerStatus: email.status, safeReason: email.reason },
    authentication: { accountOnlyAccess: true, verification: "Six-digit hashed, expiring, single-use email OTP", passwordReset: "Single-use expiring reset link", session: "Opaque HTTP-only cookie; values are never logged" },
    collaboration: { maximumPeers: 10, signaling: "Single-process memory-only WebSocket relay", roomRegistry: "Neon metadata only", documentStorage: "Browser IndexedDB + encrypted WebRTC; excluded from server diagnostics" },
    privacy: { excludedFromLogs: ["Passwords", "password hashes", "account session cookies", "password reset tokens", "email OTP codes", "Resend API key", "database URL", "document body", "Yjs updates", "chat message text"] },
  };
}
