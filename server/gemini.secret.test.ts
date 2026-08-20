import { describe, expect, it } from "vitest";

describe("Gemini credential", () => {
  it("authenticates the configured server-side API key against the Gemini models endpoint", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey!)}`, {
      signal: AbortSignal.timeout(12_000),
    });

    expect(response.ok).toBe(true);
    const payload = await response.json() as { models?: unknown[] };
    expect(Array.isArray(payload.models)).toBe(true);
  }, 15_000);
});
