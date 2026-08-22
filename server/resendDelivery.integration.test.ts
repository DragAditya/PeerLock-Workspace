import { describe, expect, it } from "vitest";

describe("controlled Resend delivery", () => {
  it.skipIf(process.env.RUN_RESEND_DELIVERY_TEST !== "1")("accepts one user-approved test message", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const to = process.env.RESEND_TEST_TO;
    expect(apiKey, "A server-only Resend key is required").toBeTruthy();
    expect(from, "RESEND_FROM_EMAIL must be configured").toBeTruthy();
    expect(to, "A user-approved test recipient is required").toBeTruthy();
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject: "Peerlock email delivery test", html: "<p>This confirms that Peerlock can deliver account emails. No action is required.</p>" }) });
    const responseBody = await response.json().catch(() => null) as { message?: string } | null;
    expect(response.status, `Resend delivery test was not accepted (HTTP ${response.status}${responseBody?.message ? `: ${responseBody.message}` : ""})`).toBeGreaterThanOrEqual(200);
    expect(response.status, `Resend delivery test was not accepted (HTTP ${response.status}${responseBody?.message ? `: ${responseBody.message}` : ""})`).toBeLessThan(300);
  }, 20_000);
});
