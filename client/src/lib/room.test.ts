import { describe, expect, it } from "vitest";
import { buildInviteUrl, createRoomCode, createRoomSecret, isValidRoomCode, normalizeRoomCode, parseInviteInput } from "./room";

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

  it("uses a concise room path while retaining the secret only in the URL fragment", () => {
    const url = buildInviteUrl("ABCD2345", "private-secret");
    expect(url).toContain("/r/ABCD2345#private-secret");
    expect(parseInviteInput("ABCD2345#private-secret")).toEqual({ roomCode: "ABCD2345", roomSecret: "private-secret" });
  });
});
