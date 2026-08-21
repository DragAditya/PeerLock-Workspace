import { describe, expect, it } from "vitest";
import { validatePassword } from "./accountAuth";

describe("account password policy", () => {
  it("requires a practical minimum length plus uppercase, lowercase, and numeric characters", () => {
    expect(validatePassword("shortA1")).toBeTruthy();
    expect(validatePassword("alllowercase123")).toBeTruthy();
    expect(validatePassword("ALLUPPERCASE123")).toBeTruthy();
    expect(validatePassword("NoDigitsPassword")).toBeTruthy();
    expect(validatePassword("CorrectHorse9Battery")).toBeNull();
  });
});
