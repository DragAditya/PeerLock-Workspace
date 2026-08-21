import { describe, expect, it } from "vitest";
import { createVerificationOtp, safeAccountError, validatePassword } from "./accountAuth";

describe("account password policy", () => {
  it("requires a practical minimum length plus uppercase, lowercase, and numeric characters", () => {
    expect(validatePassword("shortA1")).toBeTruthy();
    expect(validatePassword("alllowercase123")).toBeTruthy();
    expect(validatePassword("ALLUPPERCASE123")).toBeTruthy();
    expect(validatePassword("NoDigitsPassword")).toBeTruthy();
    expect(validatePassword("CorrectHorse9Battery")).toBeNull();
  });
});

describe("email verification OTP", () => {
  it("creates a six-digit numeric confirmation code", () => {
    expect(createVerificationOtp()).toMatch(/^\d{6}$/);
  });
});

describe("safe account errors", () => {
  it("replaces unique username database details with clear guidance", () => {
    expect(safeAccountError(new Error('duplicate key value violates unique constraint "peerlock_accounts_username_unique"'))).toBe("That username is already taken. Try adding a number or choosing a different name.");
  });

  it("explains missing account migration and provider connectivity without exposing internals", () => {
    expect(safeAccountError(new Error('relation "peerlock_accounts" does not exist'))).toContain("latest database migration");
    expect(safeAccountError(new Error("fetch failed: ECONNRESET"))).toContain("email provider");
  });
});
