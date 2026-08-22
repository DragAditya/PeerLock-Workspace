import { describe, expect, it } from "vitest";
import { passwordResetEmailTemplate, verificationEmailTemplate } from "./accountEmailTemplates";

describe("Peerlock account email templates", () => {
  it("renders a branded OTP email with an escaped identity and a plain-text alternative", () => {
    const email = verificationEmailTemplate({ username: "Ada <Test>", otp: "123456" });
    expect(email.subject).toContain("verification"); expect(email.html).toContain("PEERLOCK"); expect(email.html).toContain("123456"); expect(email.html).toContain("Ada &lt;Test&gt;"); expect(email.text).toContain("123456");
  });
  it("renders a branded reset email with an escaped action URL and expiry guidance", () => {
    const email = passwordResetEmailTemplate({ username: "Ada", resetUrl: "https://peerlock.test/reset?token=a&next=b" });
    expect(email.html).toContain("Reset my password"); expect(email.html).toContain("token=a&amp;next=b"); expect(email.text).toContain("30 minutes");
  });
});
