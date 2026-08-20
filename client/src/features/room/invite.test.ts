import { describe, expect, it } from "vitest";
import { makeRoomCode, makeRoomSecret } from "./invite";

describe("clean-slate room invite helpers", () => {
  it("creates an eight-character non-ambiguous room code and a 256-bit hex secret", () => {
    expect(makeRoomCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    expect(makeRoomSecret()).toMatch(/^[a-f0-9]{64}$/);
  });
});
