import { describe, expect, it } from "vitest";
import { peerlockAdminAuditLogs, peerlockGuestSessions } from "../drizzle/schema";
import { getDb } from "./db";

describe("super-admin schema", () => {
  it("exposes the retained audit and account-linked session metadata through the configured Neon connection", async () => {
    const db = await getDb();
    expect(db, "A configured Neon connection is required").toBeTruthy();
    await db!.select({ id: peerlockGuestSessions.id, accountId: peerlockGuestSessions.accountId }).from(peerlockGuestSessions).limit(1);
    await db!.select({ id: peerlockAdminAuditLogs.id }).from(peerlockAdminAuditLogs).limit(1);
  }, 20_000);
});
