import { describe, expect, it } from "vitest";
import { toggleChatReaction } from "./chatReactions";

describe("chat emoji reactions", () => {
  it("adds and removes only the active identity's reaction", () => {
    const added = toggleChatReaction({ "👍": ["peer-a"] }, "👍", "peer-b");
    expect(added).toEqual({ "👍": ["peer-a", "peer-b"] });
    expect(toggleChatReaction(added, "👍", "peer-b")).toEqual({ "👍": ["peer-a"] });
  });

  it("rejects unsupported reaction values without changing replicated state", () => {
    const current = { "🎉": ["peer-a"] };
    expect(toggleChatReaction(current, "🚫", "peer-b")).toEqual(current);
  });
});
