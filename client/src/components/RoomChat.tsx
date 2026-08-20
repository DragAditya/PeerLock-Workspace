import { useRoomChat } from "@/hooks/useRoomChat";
import type { LocalProfile, PeerPresence } from "@/lib/workspace";
import { AtSign, LockKeyhole, MessageCircleMore, Send, SmilePlus, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type * as Y from "yjs";

const QUICK_REACTIONS = ["👍", "❤️", "🎉"];

function mentionToken(name: string) {
  return `@${name.trim().split(/\s+/)[0]?.replace(/[^\w-]/g, "") || "peer"}`;
}

function MessageText({ body }: { body: string }) {
  return <>{body.split(/(@[\w-]+)/g).map((part, index) => part.startsWith("@") ? <mark key={`${part}-${index}`} className="chat-mention">{part}</mark> : part)}</>;
}

function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function RoomChat({ ydoc, profile, peers, enabled }: { ydoc: Y.Doc; profile: LocalProfile; peers: PeerPresence[]; enabled: boolean }) {
  const { messages, sendMessage, toggleReaction } = useRoomChat(ydoc, profile);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const mentionPeers = peers.filter(peer => !peer.isLocal);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);
  const mentionedPeerIds = mentionPeers.filter(peer => draft.includes(mentionToken(peer.name))).map(peer => peer.clientId);
  const submit = () => { if (sendMessage(draft, mentionedPeerIds)) setDraft(""); };
  const addMention = (peer: PeerPresence) => setDraft(current => `${current}${current && !current.endsWith(" ") ? " " : ""}${mentionToken(peer.name)} `);

  return <section className="room-chat rounded-2xl border border-white/[0.09] bg-[#111722]/84">
    <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3"><div><div className="flex items-center gap-2"><MessageCircleMore className="h-4 w-4 text-[#A99FF7]" /><h3 className="text-sm font-semibold text-[#E7ECF6]">Room chat</h3></div><p className="mt-1 text-[11px] text-[#7B889E]">Peer-synced in this room’s Yjs document</p></div><span className="rounded-md bg-[#A99FF7]/10 px-2 py-1 text-[10px] font-medium text-[#C6BFFF]">{messages.length}</span></div>
    {!enabled ? <div className="px-4 py-5 text-center"><WifiOff className="mx-auto h-5 w-5 text-[#8190A6]" /><p className="mt-3 text-xs font-semibold text-[#C8D0DE]">Share this document to unlock peer chat</p><p className="mx-auto mt-1 max-w-[230px] text-[11px] leading-5 text-[#7B889E]">Messages remain room data: local-first and replicated only when a private peer room is active.</p></div> : <><div className="chat-scroll max-h-[316px] min-h-[142px] space-y-4 overflow-y-auto px-4 py-4">{messages.length === 0 ? <div className="py-4 text-center text-[11px] leading-5 text-[#7B889E]"><LockKeyhole className="mx-auto mb-2 h-4 w-4 text-[#7FE6CA]" />Start the conversation. No application-server chat history is created.</div> : messages.map(message => { const local = message.authorId === profile.id; return <div key={message.id} className={`chat-message flex gap-2 ${local ? "flex-row-reverse" : ""}`}><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-bold text-[#0B1220]" style={{ backgroundColor: message.color }}>{message.authorName.slice(0, 1).toUpperCase()}</span><div className={`max-w-[222px] ${local ? "text-right" : ""}`}><p className="flex items-center gap-1 text-[10px] font-semibold text-[#AAB5C7]">{local ? "You" : message.authorName}<span className="font-normal text-[#738197]">· {formatMessageTime(message.createdAt)}</span></p><p className={`mt-1 rounded-xl px-3 py-2 text-left text-xs leading-5 ${local ? "bg-[#71E4C2]/14 text-[#D6FAF0]" : "bg-white/[0.055] text-[#D2DAE7]"}`}><MessageText body={message.body} /></p><div className={`mt-1.5 flex flex-wrap gap-1 ${local ? "justify-end" : ""}`}>{message.reactions.map(reaction => <button key={reaction.emoji} onClick={() => toggleReaction(message.id, reaction.emoji)} className={`chat-reaction ${reaction.reactedByLocalUser ? "chat-reaction-active" : ""}`}>{reaction.emoji} <span>{reaction.count}</span></button>)}<span className="group relative"><button className="chat-reaction chat-reaction-picker" aria-label="Add reaction"><SmilePlus className="h-3 w-3" /></button><span className="chat-reaction-menu">{QUICK_REACTIONS.map(emoji => <button key={emoji} onClick={() => toggleReaction(message.id, emoji)}>{emoji}</button>)}</span></span></div></div></div>; })}<div ref={bottomRef} /></div><div className="border-t border-white/[0.07] p-3">{mentionPeers.length > 0 && <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1"><AtSign className="h-3.5 w-3.5 shrink-0 text-[#A99FF7]" />{mentionPeers.map(peer => <button key={peer.clientId} onClick={() => addMention(peer)} className="chat-mention-chip"><span style={{ backgroundColor: peer.color }} />{mentionToken(peer.name)}</button>)}</div>}<div className="flex gap-2"><input value={draft} maxLength={1000} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder={mentionPeers.length ? "Message or @mention a peer…" : "Message the room…"} className="min-w-0 flex-1 bg-white/[0.05] px-3 py-2 text-xs text-[#E7ECF6] outline-none placeholder:text-[#6F7E94]" /><button onClick={submit} disabled={!draft.trim()} className="grid h-8 w-8 place-items-center rounded-lg bg-[#A99FF7] text-[#141021] disabled:opacity-40" aria-label="Send room message"><Send className="h-3.5 w-3.5" /></button></div><p className="mt-2 text-[10px] text-[#708096]">Enter to send · Use a chip to mention an active peer · Reactions sync with the room</p></div></>}
  </section>;
}
