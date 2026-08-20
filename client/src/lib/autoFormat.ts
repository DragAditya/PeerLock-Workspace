import type { Editor, JSONContent } from "@tiptap/core";
import type { EditorJsonNode } from "./export";

function inlineText(text: string): EditorJsonNode[] {
  if (!text) return [];
  return [{ type: "text", text }];
}

function paragraph(text: string): EditorJsonNode {
  return { type: "paragraph", content: inlineText(text) };
}

function listNode(type: "bulletList" | "orderedList", items: string[]): EditorJsonNode {
  return {
    type,
    content: items.map(item => ({ type: "listItem", content: [paragraph(item)] })),
  };
}

/**
 * Converts a technical plain-text outline to standard Tiptap JSON entirely in the browser.
 * The parser intentionally covers common authoring conventions without transmitting content.
 */
export function formatTechnicalText(text: string): JSONContent {
  const sourceLines = text.replace(/\r\n/g, "\n").split("\n");
  const content: EditorJsonNode[] = [];
  let index = 0;

  while (index < sourceLines.length) {
    const line = sourceLines[index] ?? "";
    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
    if (fence) {
      const language = fence[1] || "plaintext";
      const code: string[] = [];
      index += 1;
      while (index < sourceLines.length && !/^\s*```\s*$/.test(sourceLines[index] ?? "")) {
        code.push(sourceLines[index] ?? "");
        index += 1;
      }
      if (index < sourceLines.length) index += 1;
      content.push({ type: "codeBlock", attrs: { language }, content: inlineText(code.join("\n")) });
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      content.push({ type: "heading", attrs: { level: heading[1].length }, content: inlineText(heading[2]) });
      index += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < sourceLines.length && /^\s*[-*+]\s+/.test(sourceLines[index] ?? "")) {
        items.push((sourceLines[index] ?? "").replace(/^\s*[-*+]\s+/, ""));
        index += 1;
      }
      content.push(listNode("bulletList", items));
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < sourceLines.length && /^\s*\d+[.)]\s+/.test(sourceLines[index] ?? "")) {
        items.push((sourceLines[index] ?? "").replace(/^\s*\d+[.)]\s+/, ""));
        index += 1;
      }
      content.push(listNode("orderedList", items));
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < sourceLines.length && /^>\s?/.test(sourceLines[index] ?? "")) {
        quote.push((sourceLines[index] ?? "").replace(/^>\s?/, ""));
        index += 1;
      }
      content.push({ type: "blockquote", content: [paragraph(quote.join("\n"))] });
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      content.push({ type: "horizontalRule" });
      index += 1;
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;
    while (index < sourceLines.length) {
      const next = sourceLines[index] ?? "";
      if (!next.trim() || /^(#{1,3})\s+|^\s*[-*+]\s+|^\s*\d+[.)]\s+|^>\s?|^\s*```|^\s*---+\s*$/.test(next)) break;
      paragraphLines.push(next.trim());
      index += 1;
    }
    content.push(paragraph(paragraphLines.join(" ")));
  }

  return { type: "doc", content: content.length ? content : [paragraph("")] } as JSONContent;
}

export function autoFormatEditor(editor: Editor) {
  const formatted = formatTechnicalText(editor.getText());
  editor.commands.setContent(formatted);
  return formatted;
}
