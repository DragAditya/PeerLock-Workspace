import { describe, expect, it } from "vitest";

describe("Resend credentials", () => {
  it.skipIf(!process.env.RESEND_API_KEY)("authenticates with the configured server-side API key", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey, "RESEND_API_KEY must be configured").toBeTruthy();
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(response.status, `Resend rejected the configured API key with HTTP ${response.status}`).toBe(200);
  }, 20_000);
});
