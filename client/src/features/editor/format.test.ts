import { describe, expect, it } from "vitest";
import { organizeTechnicalText } from "./format";

describe("organizeTechnicalText", () => {
  it("promotes all-caps technical section labels without changing markdown syntax", () => {
    expect(organizeTechnicalText("SYSTEM DESIGN\n\n- local replica\n\n```ts\nconst room = 1\n```"))
      .toBe("# SYSTEM DESIGN\n\n- local replica\n\n```ts\nconst room = 1\n```");
  });
});
