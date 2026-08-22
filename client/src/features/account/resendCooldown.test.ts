import { describe, expect, it } from "vitest";
import { formatResendCooldown } from "./resendCooldown";

describe("verification resend cooldown", () => {
  it("formats remaining seconds into an accessible minute-second button label", () => {
    expect(formatResendCooldown(60)).toBe("Resend in 1:00"); expect(formatResendCooldown(9)).toBe("Resend in 0:09"); expect(formatResendCooldown(-4)).toBe("Resend in 0:00");
  });
});
