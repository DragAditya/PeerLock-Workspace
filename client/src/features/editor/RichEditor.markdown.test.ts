import { describe, expect, it } from "vitest";
import { markdownToHtml } from "./RichEditor";

describe("Gemini rich Markdown application", () => {
  it("preserves structural Markdown as compatible rich editor HTML", () => {
    const html = markdownToHtml("## Python example\n\n- keep lists\n- keep structure\n\n> Preserve intent\n\n```python\nprint('hello')\n```");
    expect(html).toContain("<h2>Python example</h2>");
    expect(html).toContain("<ul><li>keep lists</li><li>keep structure</li></ul>");
    expect(html).toContain("<blockquote><p>Preserve intent</p></blockquote>");
    expect(html).toContain("language-python");
    expect(html).toContain("print('hello')");
  });
});
