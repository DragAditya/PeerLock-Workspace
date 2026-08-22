import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getConfiguredNeonDatabaseUrl, getDb, isNeonPostgresUrl } from "./db";

describe("configured Neon fallback connection", () => {
  it("uses a valid server-only Neon URL and completes a harmless connectivity query", async () => {
    const url = getConfiguredNeonDatabaseUrl();
    expect(isNeonPostgresUrl(url)).toBe(true);
    const db = await getDb();
    expect(db).not.toBeNull();
    await expect(db!.execute(sql`SELECT 1 AS peerlock_connection_ok`)).resolves.toBeTruthy();
  });
});
