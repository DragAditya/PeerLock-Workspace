import { describe, expect, it } from "vitest";
import { extractGeminiMarkdown } from "./geminiFormatter";

describe("Gemini formatting response", () => {
  it("extracts the requested Markdown field from a valid structured response", () => {
    expect(extractGeminiMarkdown({ candidates: [{ content: { parts: [{ text: '{"markdown":"# Notes\\n\\n- Local first"}' }] } }] })).toBe("# Notes\n\n- Local first");
  });

  it("rejects empty model responses instead of applying a destructive editor update", () => {
    expect(() => extractGeminiMarkdown({ candidates: [] })).toThrow("Gemini returned no formatted document.");
  });
});
