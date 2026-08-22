export const MOBILE_DELETE_REVEAL_WIDTH = 94;
export const MOBILE_DELETE_REVEAL_THRESHOLD = 58;
export const HORIZONTAL_SWIPE_BIAS = 8;

export function shouldBeginLeftSwipe(deltaX: number, deltaY: number) {
  return deltaX < 0 && Math.abs(deltaX) > Math.abs(deltaY) + HORIZONTAL_SWIPE_BIAS;
}

export function clampLeftSwipeOffset(deltaX: number) {
  return Math.max(-MOBILE_DELETE_REVEAL_WIDTH, Math.min(0, deltaX));
}

export function shouldRevealMobileDelete(isHorizontalSwipe: boolean, deltaX: number) {
  return isHorizontalSwipe && deltaX < -MOBILE_DELETE_REVEAL_THRESHOLD;
}
