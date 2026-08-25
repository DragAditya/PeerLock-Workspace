import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import ListKeymap from "@tiptap/extension-list-keymap";
import ListItem from "@tiptap/extension-list-item";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { Bold, Code2, Heading2, Italic, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { useEffect } from "react";
import * as Y from "yjs";
import type { WebrtcProvider } from "y-webrtc";

const lowlight = createLowlight(common);
const CollaborativeListKeymap = ListKeymap.extend({ priority: 1000 });
const CollaborativeListItem = ListItem.extend({ priority: 1000 });
export type RichEditorApi = { getSelectedText: () => string; getDocumentMarkdown: () => string; replaceSelectionMarkdown: (text: string) => void; replaceDocumentMarkdown: (text: string) => void };
type Props = { document: Y.Doc; fragment: Y.XmlFragment; provider: WebrtcProvider | null; ready: boolean; syncRevision?: number; name: string; color: string; onTextChange: (text: string) => void; onEditorReady?: (api: RichEditorApi) => void };
type JsonNode = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: Array<{ type: string }>; content?: JsonNode[] };
const controls = [["heading", Heading2, "Heading"], ["bold", Bold, "Bold"], ["italic", Italic, "Italic"], ["bulletList", List, "Bullets"], ["orderedList", ListOrdered, "Numbered list"], ["blockquote", Quote, "Quote"], ["codeBlock", Code2, "Code block"]] as const;

function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function inlineHtml(value: string) { return escapeHtml(value).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>"); }
function inlineMarkdown(nodes: JsonNode[] = []) { return nodes.map(node => { if (node.type === "hardBreak") return "\n"; let text = node.text ?? ""; for (const mark of node.marks ?? []) { if (mark.type === "bold") text = `**${text}**`; if (mark.type === "italic") text = `*${text}*`; if (mark.type === "code") text = `\`${text}\``; } return text; }).join(""); }
function markdownFromNode(node: JsonNode, depth = 0): string {
  const content = node.content ?? [];
  if (node.type === "doc") return content.map(child => markdownFromNode(child)).filter(Boolean).join("\n\n");
  if (node.type === "paragraph") return inlineMarkdown(content);
  if (node.type === "heading") return `${"#".repeat(Number(node.attrs?.level ?? 2))} ${inlineMarkdown(content)}`;
  if (node.type === "codeBlock") return `\`\`\`${String(node.attrs?.language ?? "").trim()}\n${content.map(child => child.text ?? "").join("")}\n\`\`\``;
  if (node.type === "blockquote") return content.map(child => markdownFromNode(child).split("\n").map(line => `> ${line}`).join("\n")).join("\n");
  if (node.type === "bulletList" || node.type === "orderedList") return content.map((item, index) => { const pieces = item.content ?? []; const first = markdownFromNode(pieces[0] ?? {}); const nested = pieces.slice(1).map(part => markdownFromNode(part, depth + 1)).filter(Boolean).map(part => part.split("\n").map(line => `  ${line}`).join("\n")).join("\n"); const prefix = node.type === "orderedList" ? `${index + Number(node.attrs?.start ?? 1)}. ` : "- "; return `${prefix}${first}${nested ? `\n${nested}` : ""}`; }).join("\n");
  if (node.type === "listItem") return content.map(child => markdownFromNode(child, depth)).join("\n");
  return inlineMarkdown(content);
}
export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n"); const blocks: string[] = []; let index = 0;
  const paragraph = (items: string[]) => items.length ? `<p>${inlineHtml(items.join("\n")).replace(/\n/g, "<br>")}</p>` : "";
  while (index < lines.length) {
    const line = lines[index]; if (!line.trim()) { index += 1; continue; }
    const fence = line.match(/^```([\w+-]*)\s*$/); if (fence) { const code: string[] = []; index += 1; while (index < lines.length && !/^```\s*$/.test(lines[index])) code.push(lines[index++]); if (index < lines.length) index += 1; blocks.push(`<pre><code class="language-${escapeHtml(fence[1] || "plaintext")}">${escapeHtml(code.join("\n"))}</code></pre>`); continue; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/); if (heading) { const level = Math.min(6, Math.max(1, heading[1].length)); blocks.push(`<h${level}>${inlineHtml(heading[2])}</h${level}>`); index += 1; continue; }
    if (/^>\s?/.test(line)) { const quote: string[] = []; while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, "")); blocks.push(`<blockquote>${paragraph(quote)}</blockquote>`); continue; }
    if (/^[-*]\s+/.test(line)) { const items: string[] = []; while (index < lines.length && /^[-*]\s+/.test(lines[index])) items.push(`<li>${inlineHtml(lines[index++].replace(/^[-*]\s+/, ""))}</li>`); blocks.push(`<ul>${items.join("")}</ul>`); continue; }
    if (/^\d+\.\s+/.test(line)) { const items: string[] = []; while (index < lines.length && /^\d+\.\s+/.test(lines[index])) items.push(`<li>${inlineHtml(lines[index++].replace(/^\d+\.\s+/, ""))}</li>`); blocks.push(`<ol>${items.join("")}</ol>`); continue; }
    const prose: string[] = []; while (index < lines.length && lines[index].trim() && !/^```|^#{1,6}\s+|^>\s?|^[-*]\s+|^\d+\.\s+/.test(lines[index])) prose.push(lines[index++]); blocks.push(paragraph(prose));
  }
  return blocks.join("") || "<p></p>";
}

export function RichEditor({ document, fragment, provider, ready, syncRevision = 0, name, color, onTextChange, onEditorReady }: Props) {
  const extensions: any[] = [StarterKit.configure({ undoRedo: false, codeBlock: false, listItem: false, listKeymap: false }), CollaborativeListItem, CollaborativeListKeymap, CodeBlockLowlight.configure({ lowlight }), Collaboration.configure({ document, fragment }), Placeholder.configure({ placeholder: "Write something worth keeping private…\n\nUse Markdown input: # heading, - list, > quote, or ``` for code." })];
  if (provider) extensions.push(CollaborationCaret.configure({ provider, user: { name, color } }));
  const editor = useEditor({ extensions, editorProps: { attributes: { class: "rich-editor" } }, editable: ready }, [document, fragment, provider, name, color, ready]);
  useEffect(() => { if (!editor) return; const update = () => onTextChange(editor.getText()); editor.on("update", update); update(); return () => { editor.off("update", update); }; }, [editor, onTextChange]);
  useEffect(() => { if (!editor || !onEditorReady) return; onEditorReady({ getSelectedText: () => { const { from, to } = editor.state.selection; return editor.state.doc.textBetween(from, to, "\n").trim(); }, getDocumentMarkdown: () => markdownFromNode(editor.getJSON() as JsonNode), replaceSelectionMarkdown: (text) => { const { from, to } = editor.state.selection; editor.chain().focus().insertContentAt({ from, to }, markdownToHtml(text), { updateSelection: true }).run(); }, replaceDocumentMarkdown: (text) => editor.chain().focus().setContent(markdownToHtml(text), { emitUpdate: true }).run() }); }, [editor, onEditorReady]);
  useEffect(() => { if (!editor || syncRevision === 0) return; const frame = requestAnimationFrame(() => editor.view.updateState(editor.state)); return () => cancelAnimationFrame(frame); }, [editor, syncRevision]);
  if (!ready || !editor) return <div className="rich-editor-loading">Restoring local document…</div>;
  const handleListKey = (event: React.KeyboardEvent<HTMLDivElement>) => { if (!editor.isActive("listItem")) return; const { $from, empty } = editor.state.selection; if (event.key === "Enter") { if (editor.commands.splitListItem("listItem")) event.preventDefault(); return; } if (event.key === "Tab") { event.preventDefault(); if (event.shiftKey) editor.commands.liftListItem("listItem"); else editor.commands.sinkListItem("listItem"); return; } if (event.key === "Backspace" && empty && $from.parentOffset === 0 && $from.parent.content.size === 0 && editor.commands.liftListItem("listItem")) event.preventDefault(); };
  return <div className="rich-editor-shell"><div className="rich-toolbar">{controls.map(([command, Icon, label]) => <button key={command} type="button" title={label} aria-label={label} className={editor.isActive(command) ? "active" : ""} onClick={() => { const chain = editor.chain().focus(); if (command === "heading") chain.toggleHeading({ level: 2 }).run(); else if (command === "bulletList") chain.toggleBulletList().run(); else if (command === "orderedList") chain.toggleOrderedList().run(); else if (command === "blockquote") chain.toggleBlockquote().run(); else if (command === "codeBlock") chain.toggleCodeBlock().run(); else if (command === "bold") chain.toggleBold().run(); else chain.toggleItalic().run(); }}><Icon size={15} /></button>)}<span /><button type="button" title="Undo" aria-label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={15} /></button><button type="button" title="Redo" aria-label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={15} /></button></div><EditorContent editor={editor} onKeyDownCapture={handleListKey} /></div>;
}
