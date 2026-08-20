import { describe, expect, it } from "vitest";
import { ROOM_MAX_PEERS, ROOM_MAX_REMOTE_CONNECTIONS, isRoomAtCapacity, visiblePeerCount } from "./capacity";

describe("room capacity policy", () => {
  it("enforces one local peer plus at most nine remote mesh connections", () => {
    expect(ROOM_MAX_PEERS).toBe(10);
    expect(ROOM_MAX_REMOTE_CONNECTIONS).toBe(9);
  });
  it("reports capacity exactly at the ten-peer threshold", () => {
    expect(isRoomAtCapacity(9)).toBe(false);
    expect(isRoomAtCapacity(10)).toBe(true);
    expect(visiblePeerCount(14)).toBe(10);
  });
});
