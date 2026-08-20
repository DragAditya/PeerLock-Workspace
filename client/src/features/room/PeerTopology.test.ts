import { describe, expect, it } from "vitest";
import { roomState } from "./PeerTopology";

describe("room topology state", () => {
  it("reports a ten-peer room as at capacity", () => expect(roomState("connected", 10).label).toBe("Room at capacity"));
  it("distinguishes connecting and connected room states", () => {
    expect(roomState("connecting", 2).tone).toBe("connecting");
    expect(roomState("connected", 2).tone).toBe("connected");
  });
});
