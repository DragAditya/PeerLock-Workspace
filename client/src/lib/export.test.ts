import { describe, expect, it } from "vitest";
import { editorJsonToMarkdown, editorJsonToPlainText } from "./export";

const sampleDocument = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Private notes" }] },
    { type: "paragraph", content: [{ type: "text", text: "Peer", marks: [{ type: "bold" }] }, { type: "text", text: " editing" }] },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Stored locally" }] }] }] },
  ],
};

describe("editor export", () => {
  it("converts supported editor JSON to readable Markdown", () => {
    expect(editorJsonToMarkdown(sampleDocument)).toBe("## Private notes\n\n**Peer** editing\n\n- Stored locally");
  });

  it("converts supported editor JSON to plain text", () => {
    expect(editorJsonToPlainText(sampleDocument)).toContain("Private notes");
    expect(editorJsonToPlainText(sampleDocument)).toContain("Peer editing");
    expect(editorJsonToPlainText(sampleDocument)).toContain("Stored locally");
  });
});
