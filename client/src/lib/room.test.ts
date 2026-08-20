import { describe, expect, it } from "vitest";
import { createRoomCode, createRoomSecret, isValidRoomCode, normalizeRoomCode } from "./room";

describe("room helpers", () => {
  it("creates a share-safe eight-character room code", () => {
    const code = createRoomCode();
    expect(code).toHaveLength(8);
    expect(isValidRoomCode(code)).toBe(true);
    expect(/[01IO]/.test(code)).toBe(false);
  });

  it("normalizes input without accepting ambiguous or malformed codes", () => {
    expect(normalizeRoomCode(" abc-2345 ")).toBe("ABC2345");
    expect(isValidRoomCode("ABCD2345")).toBe(true);
    expect(isValidRoomCode("ABCD-1234")).toBe(false);
    expect(isValidRoomCode("ABCD123")).toBe(false);
  });

  it("creates a 256-bit URL-safe room secret", () => {
    const secret = createRoomSecret();
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
