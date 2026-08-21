import { describe, expect, it } from "vitest";
import { makeInvite, makeRoomCode, makeRoomSecret, opaqueRoomName } from "./invite";

describe("clean-slate room invite helpers", () => {
  it("creates an eight-character non-ambiguous room code and a 256-bit hex secret", () => {
    expect(makeRoomCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    expect(makeRoomSecret()).toMatch(/^[a-f0-9]{64}$/);
  });
  it("creates short open-room links and explicit password-room links", () => {
    expect(makeInvite("AB12CD34", false, "https://peerlock.test")).toBe("https://peerlock.test/r/AB12CD34");
    expect(makeInvite("AB12CD34", true, "https://peerlock.test")).toBe("https://peerlock.test/r/AB12CD34?access=protected");
  });
  it("derives one stable WebRTC namespace from the immutable server room identity and transport secret", async () => {
    const first = await opaqueRoomName("11111111-1111-1111-1111-111111111111", "a".repeat(64));
    const repeat = await opaqueRoomName("11111111-1111-1111-1111-111111111111", "a".repeat(64));
    const separateRoom = await opaqueRoomName("22222222-2222-2222-2222-222222222222", "a".repeat(64));
    expect(first).toBe(repeat);
    expect(first).not.toBe(separateRoom);
  });
});
