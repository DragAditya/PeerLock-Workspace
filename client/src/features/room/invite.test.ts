import { describe, expect, it } from "vitest";
import { makeInvite, makeRoomCode, makeRoomSecret } from "./invite";

describe("clean-slate room invite helpers", () => {
  it("creates an eight-character non-ambiguous room code and a 256-bit hex secret", () => {
    expect(makeRoomCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    expect(makeRoomSecret()).toMatch(/^[a-f0-9]{64}$/);
  });
  it("creates short open-room links and explicit password-room links", () => {
    expect(makeInvite("AB12CD34", false, "https://peerlock.test")).toBe("https://peerlock.test/r/AB12CD34");
    expect(makeInvite("AB12CD34", true, "https://peerlock.test")).toBe("https://peerlock.test/r/AB12CD34?access=protected");
  });
});
