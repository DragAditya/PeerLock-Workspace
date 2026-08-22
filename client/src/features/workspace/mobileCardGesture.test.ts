import { describe, expect, it } from "vitest";
import { clampLeftSwipeOffset, MOBILE_DELETE_REVEAL_THRESHOLD, MOBILE_DELETE_REVEAL_WIDTH, shouldBeginLeftSwipe, shouldRevealMobileDelete } from "./mobileCardGesture";

describe("mobile card delete gesture", () => {
  it("starts only for a deliberate leftward horizontal swipe", () => {
    expect(shouldBeginLeftSwipe(-18, 2)).toBe(true);
    expect(shouldBeginLeftSwipe(-8, 4)).toBe(false);
    expect(shouldBeginLeftSwipe(-18, 18)).toBe(false);
    expect(shouldBeginLeftSwipe(18, 2)).toBe(false);
  });

  it("caps drag travel at the visible delete rail width", () => {
    expect(clampLeftSwipeOffset(-30)).toBe(-30);
    expect(clampLeftSwipeOffset(-999)).toBe(-MOBILE_DELETE_REVEAL_WIDTH);
    expect(clampLeftSwipeOffset(18)).toBe(0);
  });

  it("reveals deletion only after the safe threshold and never deletes directly", () => {
    expect(shouldRevealMobileDelete(true, -MOBILE_DELETE_REVEAL_THRESHOLD - 1)).toBe(true);
    expect(shouldRevealMobileDelete(true, -MOBILE_DELETE_REVEAL_THRESHOLD)).toBe(false);
    expect(shouldRevealMobileDelete(false, -MOBILE_DELETE_REVEAL_THRESHOLD - 10)).toBe(false);
  });
});
