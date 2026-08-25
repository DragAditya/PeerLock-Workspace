import type { PeerPresence } from "@/features/editor/usePeerDocument";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, ShieldCheck, X } from "lucide-react";
import "./collaborator-profile.css";

export function CollaboratorProfileSheet({ person, onClose }: { person: PeerPresence; onClose: () => void }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="collaborator-profile-dialog" showCloseButton={false}><DialogClose asChild><button type="button" className="collaborator-profile-close" aria-label="Close profile"><X size={18} /></button></DialogClose><div className="collaborator-profile-avatar">{person.avatarUrl ? <img src={person.avatarUrl} alt={`${person.name} profile`} /> : <i style={{ backgroundColor: person.color }}>{person.name.slice(0, 1).toUpperCase()}</i>}</div><p className="eyebrow">ROOM COLLABORATOR</p><DialogTitle>{person.name}</DialogTitle><p className="collaborator-profile-status">{person.verified ? <><BadgeCheck size={15} />Verified PeerLock account</> : <><ShieldCheck size={15} />Approved room collaborator</>}</p><DialogDescription className="collaborator-profile-copy">This profile is visible because you are both approved members of this encrypted room. Email, documents, chat history, room secrets, and other private account data are not shown here.</DialogDescription></DialogContent></Dialog>;
}
