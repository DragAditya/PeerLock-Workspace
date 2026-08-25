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

  it("preserves each supported Markdown heading level instead of flattening document hierarchy", () => {
    const html = markdownToHtml("# Title\n\n### Detail\n\n###### Fine print");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<h3>Detail</h3>");
    expect(html).toContain("<h6>Fine print</h6>");
  });
});
