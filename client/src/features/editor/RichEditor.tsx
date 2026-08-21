import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
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
type Props = { document: Y.Doc; fragment: Y.XmlFragment; provider: WebrtcProvider | null; ready: boolean; name: string; color: string; onTextChange: (text: string) => void };
const controls = [
  ["heading", Heading2, "Heading"], ["bold", Bold, "Bold"], ["italic", Italic, "Italic"], ["bulletList", List, "Bullets"], ["orderedList", ListOrdered, "Numbered list"], ["blockquote", Quote, "Quote"], ["codeBlock", Code2, "Code block"],
] as const;

export function RichEditor({ document, fragment, provider, ready, name, color, onTextChange }: Props) {
  const extensions: any[] = [StarterKit.configure({ undoRedo: false, codeBlock: false, listItem: false, listKeymap: false }), CollaborativeListItem, CollaborativeListKeymap, CodeBlockLowlight.configure({ lowlight }), Collaboration.configure({ document, fragment }), Placeholder.configure({ placeholder: "Write something worth keeping private…\n\nUse Markdown input: # heading, - list, > quote, or ``` for code." })];
  if (provider) extensions.push(CollaborationCaret.configure({ provider, user: { name, color } }));
  const editor = useEditor({ extensions, editorProps: { attributes: { class: "rich-editor" } }, editable: ready }, [document, fragment, provider, name, color, ready]);
  useEffect(() => { if (!editor) return; const update = () => onTextChange(editor.getText()); editor.on("update", update); update(); return () => { editor.off("update", update); }; }, [editor, onTextChange]);
  if (!ready || !editor) return <div className="rich-editor-loading">Restoring local document…</div>;
  const handleListKey = (event: React.KeyboardEvent<HTMLDivElement>) => { if (!editor.isActive("listItem")) return; const { $from, empty } = editor.state.selection; if (event.key === "Enter") { if (editor.commands.splitListItem("listItem")) event.preventDefault(); return; } if (event.key === "Tab") { event.preventDefault(); if (event.shiftKey) editor.commands.liftListItem("listItem"); else editor.commands.sinkListItem("listItem"); return; } if (event.key === "Backspace" && empty && $from.parentOffset === 0 && $from.parent.content.size === 0 && editor.commands.liftListItem("listItem")) event.preventDefault(); };
  return <div className="rich-editor-shell"><div className="rich-toolbar">{controls.map(([command, Icon, label]) => <button key={command} type="button" title={label} aria-label={label} className={editor.isActive(command) ? "active" : ""} onClick={() => { const chain = editor.chain().focus(); if (command === "heading") chain.toggleHeading({ level: 2 }).run(); else if (command === "bulletList") chain.toggleBulletList().run(); else if (command === "orderedList") chain.toggleOrderedList().run(); else if (command === "blockquote") chain.toggleBlockquote().run(); else if (command === "codeBlock") chain.toggleCodeBlock().run(); else if (command === "bold") chain.toggleBold().run(); else chain.toggleItalic().run(); }}><Icon size={15} /></button>)}<span /><button type="button" title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={15} /></button><button type="button" title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={15} /></button></div><EditorContent editor={editor} onKeyDownCapture={handleListKey} /></div>;
}
