import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { createInitializationGate } from "@/features/workspace/initialization";
import { listLocalDocuments, storeDocument, deleteStoredDocument } from "@/features/workspace/storage";
import type { LocalProfile, WorkspaceDocument, WorkspaceStore } from "@/features/workspace/types";

const WorkspaceContext = createContext<WorkspaceStore | null>(null);
const profileKey = "peerlock-clean-profile";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<LocalProfile | null>(() => { try { return JSON.parse(localStorage.getItem(profileKey) ?? "null"); } catch { return null; } });
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializationRecovered, setInitializationRecovered] = useState(false);
  useEffect(() => {
    let active = true;
    const gate = createInitializationGate(4500, reason => {
      if (!active) return;
      setLoading(false);
      setInitializationRecovered(reason !== "ready");
    });
    void listLocalDocuments()
      .then(items => {
        if (!active) return;
        setDocuments(items);
        gate.ready();
      })
      .catch(() => {
        if (active) gate.fail();
      });
    return () => { active = false; gate.dispose(); };
  }, []);
  useEffect(() => {
    const preference = profile?.theme ?? "system";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.peerlockTheme = preference === "system" ? (media.matches ? "dark" : "light") : preference; };
    apply();
    if (preference !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [profile?.theme]);
  const setProfile = (next: LocalProfile) => { localStorage.setItem(profileKey, JSON.stringify(next)); setProfileState(next); };
  const clearProfile = () => { localStorage.removeItem(profileKey); setProfileState(null); };
  const save = async (document: WorkspaceDocument) => { await storeDocument(document); setDocuments(current => [document, ...current.filter(item => item.id !== document.id)].sort((a, b) => b.updatedAt - a.updatedAt)); };
  const createDocument = async (title = "Untitled note") => { const time = Date.now(); const document = { id: nanoid(12), title, createdAt: time, updatedAt: time, externalAiEnabled: true }; await save(document); return document; };
  const updateDocument = async (id: string, patch: Partial<WorkspaceDocument>) => { const current = documents.find(item => item.id === id); if (!current) return; await save({ ...current, ...patch, updatedAt: Date.now() }); };
  const removeDocument = async (id: string) => { await deleteStoredDocument(id); setDocuments(current => current.filter(item => item.id !== id)); };
  const openRoom = async (room: { id: string; code: string; protected: boolean; transportSecret: string }) => {
    const matching = documents.filter(item => item.roomId === room.id).sort((a, b) => b.updatedAt - a.updatedAt);
    const canonical = matching[0];
    const linked = canonical
      ? { ...canonical, roomCode: room.code, roomProtected: room.protected, roomTransportSecret: room.transportSecret, updatedAt: Date.now() }
      : { id: `room-${room.id}`, title: `Room ${room.code}`, createdAt: Date.now(), updatedAt: Date.now(), externalAiEnabled: true, roomId: room.id, roomCode: room.code, roomProtected: room.protected, roomTransportSecret: room.transportSecret };
    await Promise.all(matching.slice(1).map(stale => deleteStoredDocument(stale.id)));
    await save(linked);
    return linked;
  };
  const value = useMemo(() => ({ profile, documents, loading, initializationRecovered, setProfile, clearProfile, createDocument, updateDocument, removeDocument, openRoom }), [profile, documents, loading, initializationRecovered]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() { const value = useContext(WorkspaceContext); if (!value) throw new Error("WorkspaceProvider missing"); return value; }
