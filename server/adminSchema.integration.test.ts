import { describe, expect, it } from "vitest";
import { peerlockAdminAuditLogs, peerlockAnnouncements } from "../drizzle/schema";
import { getDb } from "./db";

describe("super-admin schema", () => {
  it("exposes the announcement and audit metadata tables through the configured Neon connection", async () => {
    const db = await getDb();
    expect(db, "A configured Neon connection is required").toBeTruthy();
    await db!.select({ id: peerlockAnnouncements.id }).from(peerlockAnnouncements).limit(1);
    await db!.select({ id: peerlockAdminAuditLogs.id }).from(peerlockAdminAuditLogs).limit(1);
  }, 20_000);
});
