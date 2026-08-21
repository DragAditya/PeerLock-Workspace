import { describe, expect, it } from "vitest";
import { verifyRoomPassword } from "./roomRegistry";
import { randomBytes, scryptSync } from "node:crypto";

describe("room password verification", () => {
  it("accepts only the password that produced the stored hash", () => {
    const salt = randomBytes(16).toString("hex"); const hash = scryptSync("correct-horse-battery", salt, 64).toString("hex");
    expect(verifyRoomPassword("correct-horse-battery", salt, hash)).toBe(true);
    expect(verifyRoomPassword("incorrect-password", salt, hash)).toBe(false);
  });
});
