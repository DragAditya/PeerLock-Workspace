type Mark = { type?: string; attrs?: Record<string, unknown> };

export type EditorJsonNode = {
  type?: string;
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  content?: EditorJsonNode[];
};

function renderText(node: EditorJsonNode) {
  let value = node.text ?? "";
  const marks = node.marks ?? [];
  marks.forEach(mark => {
    if (mark.type === "bold") value = `**${value}**`;
    if (mark.type === "italic") value = `*${value}*`;
    if (mark.type === "strike") value = `~~${value}~~`;
    if (mark.type === "code") value = `\`${value}\``;
    if (mark.type === "link" && typeof mark.attrs?.href === "string") value = `[${value}](${mark.attrs.href})`;
  });
  return value;
}

function inlineContent(nodes: EditorJsonNode[] = []): string {
  return nodes.map(node => {
    if (node.type === "text") return renderText(node);
    if (node.type === "hardBreak") return "  \n";
    return inlineContent(node.content);
  }).join("");
}

function markdownNode(node: EditorJsonNode, depth = 0): string {
  const children = node.content ?? [];
  switch (node.type) {
    case "doc":
      return children.map(child => markdownNode(child, depth)).filter(Boolean).join("\n\n");
    case "paragraph":
      return inlineContent(children);
    case "heading":
      return `${"#".repeat(Number(node.attrs?.level ?? 1))} ${inlineContent(children)}`;
    case "blockquote":
      return children.map(child => markdownNode(child, depth)).join("\n").split("\n").map(line => `> ${line}`).join("\n");
    case "bulletList":
      return children.map(child => markdownNode(child, depth)).join("\n");
    case "orderedList":
      return children.map((child, index) => markdownNode({ ...child, attrs: { ...child.attrs, ordinal: index + 1 } }, depth)).join("\n");
    case "listItem": {
      const [first, ...rest] = children;
      const marker = typeof node.attrs?.ordinal === "number" ? `${node.attrs.ordinal}.` : "-";
      const prefix = `${"  ".repeat(depth)}${marker} `;
      const firstLine = first ? markdownNode(first, depth + 1) : "";
      const nested = rest.map(child => markdownNode(child, depth + 1)).filter(Boolean).join("\n");
      return `${prefix}${firstLine}${nested ? `\n${nested}` : ""}`;
    }
    case "codeBlock":
      return `\`\`\`${typeof node.attrs?.language === "string" ? node.attrs.language : ""}\n${inlineContent(children)}\n\`\`\``;
    case "horizontalRule":
      return "---";
    default:
      return inlineContent(children);
  }
}

export function editorJsonToMarkdown(document: EditorJsonNode) {
  return markdownNode(document).replace(/\n{3,}/g, "\n\n").trim();
}

export function editorJsonToPlainText(node: EditorJsonNode): string {
  if (node.type === "text") return node.text ?? "";
  const separator = node.type === "doc"
    ? "\n\n"
    : ["listItem", "blockquote", "codeBlock"].includes(node.type ?? "")
      ? "\n"
      : "";
  return (node.content ?? []).map(editorJsonToPlainText).join(separator).replace(/\n{3,}/g, "\n\n").trim();
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
