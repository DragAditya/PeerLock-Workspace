import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { peerlockAccounts } from "../drizzle/schema";
import { configuredSuperAdminEmail } from "./adminAuthorization";
import { getDb } from "./db";

describe("configured super-admin account readiness", () => {
  it("maps the server-configured admin identity to one existing Peerlock account", async () => {
    const db = await getDb();
    const email = configuredSuperAdminEmail();
    expect(email, "The server-only super-admin email must be configured").toBeTruthy();
    const [account] = await db!.select({ id: peerlockAccounts.id, emailVerifiedAt: peerlockAccounts.emailVerifiedAt }).from(peerlockAccounts).where(eq(peerlockAccounts.email, email)).limit(1);
    expect(account, "The configured super-admin email must first be registered as a Peerlock account").toBeTruthy();
    expect(account?.emailVerifiedAt, "Verify the configured super-admin account email before opening the control center").toBeTruthy();
  }, 20_000);
});
