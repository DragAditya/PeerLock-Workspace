import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { Bold, Code2, FileCode2, Heading1, Heading2, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";
import { useEffect } from "react";
import type { WebrtcProvider } from "y-webrtc";
import type * as Y from "yjs";
import type { LocalProfile } from "@/lib/workspace";

const lowlight = createLowlight(common);

function ToolbarButton({ editor, label, active, onClick, children }: { editor: Editor; label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={`grid h-8 w-8 place-items-center rounded-lg transition ${active ? "bg-[#71E4C2]/16 text-[#7FE6CA]" : "text-[#94A0B4] hover:bg-white/[0.07] hover:text-[#F0F4FB]"}`}>{children}</button>;
}

function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.07] bg-[#111722]/88 px-3 py-2">
      <ToolbarButton editor={editor} label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-3.5 w-3.5" /></ToolbarButton>
      <ToolbarButton editor={editor} label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-3.5 w-3.5" /></ToolbarButton>
      <span className="mx-1 h-4 w-px bg-white/[0.1]" />
      <ToolbarButton editor={editor} label="Heading one" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-3.5 w-3.5" /></ToolbarButton>
      <ToolbarButton editor={editor} label="Heading two" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-3.5 w-3.5" /></ToolbarButton>
      <span className="mx-1 h-4 w-px bg-white/[0.1]" />
      <ToolbarButton editor={editor} label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3.5 w-3.5" /></ToolbarButton>
      <ToolbarButton editor={editor} label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></ToolbarButton>
      <ToolbarButton editor={editor} label="Strike-through" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-3.5 w-3.5" /></ToolbarButton>
      <ToolbarButton editor={editor} label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code2 className="h-3.5 w-3.5" /></ToolbarButton>
      <ToolbarButton editor={editor} label="Syntax-highlighted code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock({ language: "plaintext" }).run()}><FileCode2 className="h-3.5 w-3.5" /></ToolbarButton>
      <span className="mx-1 h-4 w-px bg-white/[0.1]" />
      <ToolbarButton editor={editor} label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3.5 w-3.5" /></ToolbarButton>
      <ToolbarButton editor={editor} label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-3.5 w-3.5" /></ToolbarButton>
      <ToolbarButton editor={editor} label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-3.5 w-3.5" /></ToolbarButton>
    </div>
  );
}

export function CollaborativeEditor({ ydoc, provider, profile, onReady }: { ydoc: Y.Doc; provider?: WebrtcProvider; profile: LocalProfile; onReady: (editor: Editor) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ undoRedo: false, codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext", enableTabIndentation: true, HTMLAttributes: { class: "technical-codeblock" } }),
      Collaboration.configure({ document: ydoc, field: "content" }),
      Placeholder.configure({ placeholder: "Begin writing. Your changes are saved locally as you type." }),
      ...(provider ? [CollaborationCaret.configure({ provider, user: { name: profile.name, color: profile.color } })] : []),
    ],
    editorProps: { attributes: { class: "peerlock-editor" } },
  });

  useEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);

  if (!editor) return <div className="grid min-h-[420px] place-items-center text-sm text-[#8190A6]">Preparing your local encrypted replica…</div>;
  return <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111722]/88 shadow-[0_20px_70px_rgba(0,0,0,0.18)]"><EditorToolbar editor={editor} /><div className="border-b border-white/[0.06] bg-[#0D131E] px-4 py-2 text-[11px] text-[#7F8CA3]"><span className="font-semibold text-[#9DECD6]">Markdown shortcuts</span><span className="px-2 text-[#43516A]">·</span><span><code>#</code> heading <span className="px-1">·</span><code>-</code> list <span className="px-1">·</span><code>&gt;</code> quote <span className="px-1">·</span><code>```ts</code> highlighted code</span></div><EditorContent editor={editor} /></div>;
}
