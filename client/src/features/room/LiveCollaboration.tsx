import type { PeerPresence, RoomMessage } from "@/features/editor/usePeerDocument";
import { CollaboratorProfileSheet } from "./CollaboratorProfileSheet";
import { Check, MessageCircleMore, Send, SmilePlus, UsersRound, X } from "lucide-react";
import { useState } from "react";

const reactionOptions = ["👍", "❤", "😂", "🎉"] as const;

type Props = {
  peers: PeerPresence[];
  chat: RoomMessage[];
  message: string;
  setMessage: (value: string) => void;
  send: (value: string) => void;
  react: (messageId: string, emoji: string) => void;
  currentIdentityId?: string;
  onOpenProfile?: (peer: PeerPresence) => void;
  requests?: Array<{ id: string; name: string; color: string }>;
  decideRequest?: (requestId: string, allow: boolean) => void;
  deciding?: boolean;
};

function Avatar({ peer, className = "" }: { peer: PeerPresence; className?: string }) {
  return peer.avatarUrl ? <img className={className} src={peer.avatarUrl} alt={`${peer.name} profile`} /> : <i className={className} style={{ backgroundColor: peer.color }}>{peer.name.slice(0, 1).toUpperCase()}</i>;
}

export function LiveCollaboration({ peers, chat, message, setMessage, send, react, currentIdentityId, onOpenProfile, requests = [], decideRequest, deciding }: Props) {
  const [selectedPeer, setSelectedPeer] = useState<PeerPresence | null>(null);
  const openProfile = onOpenProfile ?? setSelectedPeer;
  const findPeer = (name: string) => peers.find(peer => peer.name === name);
  return <><section className="studio-live"><div className="studio-live-head"><div><p className="eyebrow">Live collaboration</p><h2>People and conversation, always in view.</h2></div><span><UsersRound size={15} />{peers.length} active</span></div><div className="studio-live-grid"><div className="live-peers"><p className="eyebrow">In this document</p><div className="live-peer-avatars">{peers.length ? peers.slice(0, 10).map(peer => <button type="button" className="live-peer-avatar" key={peer.id} title={`Open ${peer.name}'s profile`} onClick={() => openProfile(peer)}><Avatar peer={peer} /></button>) : <span className="live-empty">Open a room to meet peers here.</span>}</div>{peers.length ? peers.map(peer => <button type="button" className="live-peer-name" key={`name-${peer.id}`} onClick={() => openProfile(peer)}><Avatar peer={peer} className="peer-avatar" /><span>{peer.name}</span></button>) : null}</div><div className="live-chat">{requests.length ? <section className="live-join-requests" aria-label="Pending room join requests"><header><p className="eyebrow">Join requests</p><span>{requests.length} waiting</span></header>{requests.map(request => <article key={request.id}><div className="join-request-person"><i style={{ backgroundColor: request.color }} /><div><b>{request.name}</b><span>Requesting secure room access</span></div></div><div className="join-request-actions"><button className="join-allow" disabled={deciding} onClick={() => decideRequest?.(request.id, true)} aria-label={`Allow ${request.name}`}><Check size={14} />Allow</button><button className="join-decline" disabled={deciding} onClick={() => decideRequest?.(request.id, false)} aria-label={`Decline ${request.name}`}><X size={14} />Decline</button></div></article>)}</section> : null}<header><MessageCircleMore size={16} /><b>Room chat</b></header><div className="live-chat-log">{chat.length ? chat.slice(-8).map(item => { const peer = findPeer(item.author); const identity: PeerPresence = peer ?? { id: -1, name: item.author, color: item.color, avatarUrl: item.avatarUrl ?? null, verified: false }; return <article className="room-chat-message" key={item.id}><button type="button" className="room-chat-person" onClick={() => openProfile(identity)}><Avatar peer={{ ...identity, avatarUrl: item.avatarUrl ?? identity.avatarUrl }} /><div><b>{item.author}</b><p>{item.body}</p></div></button><div className="room-chat-reactions" aria-label={`Reactions for ${item.author}'s message`}>{reactionOptions.map(emoji => { const count = item.reactions?.[emoji]?.length ?? 0; const active = Boolean(currentIdentityId && item.reactions?.[emoji]?.includes(currentIdentityId)); return <button type="button" key={emoji} className={active ? "active" : ""} onClick={() => react(item.id, emoji)} aria-label={`React ${emoji}`}><span>{emoji}</span>{count ? <b>{count}</b> : null}</button>; })}<span className="room-reaction-hint"><SmilePlus size={12} />React</span></div></article>; }) : <p className="live-empty">Messages are replicated in the same encrypted Yjs document.</p>}</div><form onSubmit={event => { event.preventDefault(); send(message); setMessage(""); }}><input value={message} onChange={event => setMessage(event.target.value)} placeholder="Say something to the room" aria-label="Room chat message" /><button type="submit" aria-label="Send room chat"><Send size={15} /></button></form></div></div></section>{selectedPeer ? <CollaboratorProfileSheet person={selectedPeer} onClose={() => setSelectedPeer(null)} /> : null}</>;
}
