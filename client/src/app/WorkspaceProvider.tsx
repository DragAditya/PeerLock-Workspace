import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { listLocalDocuments, storeDocument, deleteStoredDocument } from "@/features/workspace/storage";
import type { LocalProfile, WorkspaceDocument, WorkspaceStore } from "@/features/workspace/types";

const WorkspaceContext = createContext<WorkspaceStore | null>(null);
const profileKey = "peerlock-clean-profile";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<LocalProfile | null>(() => { try { return JSON.parse(localStorage.getItem(profileKey) ?? "null"); } catch { return null; } });
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void listLocalDocuments().then(items => { setDocuments(items); setLoading(false); }); }, []);
  const setProfile = (next: LocalProfile) => { localStorage.setItem(profileKey, JSON.stringify(next)); setProfileState(next); };
  const clearProfile = () => { localStorage.removeItem(profileKey); setProfileState(null); };
  const save = async (document: WorkspaceDocument) => { await storeDocument(document); setDocuments(current => [document, ...current.filter(item => item.id !== document.id)].sort((a, b) => b.updatedAt - a.updatedAt)); };
  const createDocument = async (title = "Untitled note") => { const time = Date.now(); const document = { id: nanoid(12), title, createdAt: time, updatedAt: time, externalAiEnabled: true }; await save(document); return document; };
  const updateDocument = async (id: string, patch: Partial<WorkspaceDocument>) => { const current = documents.find(item => item.id === id); if (!current) return; await save({ ...current, ...patch, updatedAt: Date.now() }); };
  const removeDocument = async (id: string) => { await deleteStoredDocument(id); setDocuments(current => current.filter(item => item.id !== id)); };
  const openRoom = async (room: { id: string; code: string; protected: boolean; transportSecret: string }) => { const found = documents.find(item => item.roomId === room.id); if (found) { const updated = { ...found, roomCode: room.code, roomProtected: room.protected, roomTransportSecret: room.transportSecret }; await save(updated); return updated; } const document = await createDocument(`Room ${room.code}`); const linked = { ...document, roomId: room.id, roomCode: room.code, roomProtected: room.protected, roomTransportSecret: room.transportSecret }; await save(linked); return linked; };
  const value = useMemo(() => ({ profile, documents, loading, setProfile, clearProfile, createDocument, updateDocument, removeDocument, openRoom }), [profile, documents, loading]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() { const value = useContext(WorkspaceContext); if (!value) throw new Error("WorkspaceProvider missing"); return value; }
