import { describe, expect, it } from "vitest";
import { createWebrtcProviderOptions, getRoomCapacityState, MAX_DIRECT_CONNECTIONS } from "./collaboration";

describe("collaboration configuration", () => {
  it("passes a room secret to the provider and keeps the peer mesh inside the supported room scope", () => {
    expect(createWebrtcProviderOptions("room-secret")).toEqual({ password: "room-secret", maxConns: 9 });
    expect(MAX_DIRECT_CONNECTIONS).toBe(9);
  });

  it("exposes explicit capacity states around the ten-person room boundary", () => {
    expect(getRoomCapacityState(0)).toBe("within-limit");
    expect(getRoomCapacityState(9)).toBe("at-limit");
    expect(getRoomCapacityState(10)).toBe("above-limit");
  });
});
