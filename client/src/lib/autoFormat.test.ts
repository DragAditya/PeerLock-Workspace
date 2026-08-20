import { describe, expect, it } from "vitest";
import { formatTechnicalText } from "./autoFormat";

describe("technical document auto-formatting", () => {
  it("converts headings, lists, quotes, and fenced code into Tiptap nodes", () => {
    const result = formatTechnicalText("# API notes\n\n- endpoint\n- auth\n\n> private by default\n\n```ts\nconst peer = true\n```");
    expect(result.content?.map(node => node.type)).toEqual(["heading", "bulletList", "blockquote", "codeBlock"]);
    expect(result.content?.[0]?.attrs).toEqual({ level: 1 });
    expect(result.content?.[3]?.attrs).toEqual({ language: "ts" });
  });

  it("joins plain-text lines into readable paragraphs", () => {
    const result = formatTechnicalText("Local first\npeer synced");
    expect(result.content?.[0]?.content?.[0]?.text).toBe("Local first peer synced");
  });
});
