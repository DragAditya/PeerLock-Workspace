import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitializationGate } from "./initialization";

describe("createInitializationGate", () => {
  afterEach(() => vi.useRealTimers());

  it("releases exactly once as ready when local persistence settles before its deadline", () => {
    vi.useFakeTimers();
    const onRelease = vi.fn();
    const gate = createInitializationGate(4500, onRelease);
    gate.ready();
    vi.advanceTimersByTime(4500);
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenCalledWith("ready");
  });

  it("releases as timeout when a persistence operation remains pending", () => {
    vi.useFakeTimers();
    const onRelease = vi.fn();
    createInitializationGate(3500, onRelease);
    vi.advanceTimersByTime(3500);
    expect(onRelease).toHaveBeenCalledWith("timeout");
  });

  it("does not release after disposal during route cleanup", () => {
    vi.useFakeTimers();
    const onRelease = vi.fn();
    const gate = createInitializationGate(3500, onRelease);
    gate.dispose();
    vi.advanceTimersByTime(3500);
    expect(onRelease).not.toHaveBeenCalled();
  });
});
