import { describe, expect, it } from "vitest";
import { isNeonPostgresUrl } from "./db";

describe("Neon database URL validation", () => {
  it("accepts pooled Neon PostgreSQL URLs and rejects incompatible database URLs", () => {
    expect(isNeonPostgresUrl("postgresql://user:password@ep-example-123-pooler.c-1.us-east-2.aws.neon.tech/neondb?sslmode=require")).toBe(true);
    expect(isNeonPostgresUrl("mysql://user:password@host:3306/peerlock")).toBe(false);
    expect(isNeonPostgresUrl("postgresql://user:password@db.example.com/peerlock")).toBe(false);
    expect(isNeonPostgresUrl(undefined)).toBe(false);
  });
});
