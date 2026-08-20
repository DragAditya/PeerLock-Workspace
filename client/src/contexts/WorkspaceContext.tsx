import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createDocument as createDocumentRecord,
  attachRoomToDocument,
  setDocumentExternalAiEnabled as setDocumentExternalAiEnabledRecord,
  deleteDocument as deleteDocumentRecord,
  getOrCreateRoomDocument,
  listDocuments,
  renameDocument as renameDocumentRecord,
} from "@/lib/documentStore";
import { getLocalProfile, isLocalProfileReady, saveLocalProfile, type LocalDocument, type LocalProfile } from "@/lib/workspace";

type WorkspaceContextValue = {
  documents: LocalDocument[];
  loading: boolean;
  profile: LocalProfile;
  profileReady: boolean;
  refreshDocuments: () => Promise<void>;
  createDocument: (title?: string, room?: { roomCode: string; roomSecret: string }) => Promise<LocalDocument>;
  createOrOpenRoom: (roomCode: string, roomSecret: string) => Promise<LocalDocument>;
  renameDocument: (id: string, title: string) => Promise<LocalDocument | undefined>;
  deleteDocument: (id: string) => Promise<void>;
  attachRoom: (id: string, roomCode: string, roomSecret: string) => Promise<LocalDocument | undefined>;
  setDocumentExternalAiEnabled: (id: string, externalAiEnabled: boolean) => Promise<LocalDocument | undefined>;
  updateProfile: (next: LocalProfile) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LocalProfile>(() => getLocalProfile());
  const [profileReady, setProfileReady] = useState(() => isLocalProfileReady());

  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments(await listDocuments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const createDocument = useCallback(async (title?: string, room?: { roomCode: string; roomSecret: string }) => {
    const document = await createDocumentRecord(title, room);
    await refreshDocuments();
    return document;
  }, [refreshDocuments]);

  const createOrOpenRoom = useCallback(async (roomCode: string, roomSecret: string) => {
    const document = await getOrCreateRoomDocument(roomCode, roomSecret);
    await refreshDocuments();
    return document;
  }, [refreshDocuments]);

  const renameDocument = useCallback(async (id: string, title: string) => {
    const document = await renameDocumentRecord(id, title);
    await refreshDocuments();
    return document;
  }, [refreshDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    await deleteDocumentRecord(id);
    await refreshDocuments();
  }, [refreshDocuments]);

  const attachRoom = useCallback(async (id: string, roomCode: string, roomSecret: string) => {
    const document = await attachRoomToDocument(id, roomCode, roomSecret);
    await refreshDocuments();
    return document;
  }, [refreshDocuments]);

  const setDocumentExternalAiEnabled = useCallback(async (id: string, externalAiEnabled: boolean) => {
    const document = await setDocumentExternalAiEnabledRecord(id, externalAiEnabled);
    await refreshDocuments();
    return document;
  }, [refreshDocuments]);

  const updateProfile = useCallback((next: LocalProfile) => {
    const normalized = { ...next, name: next.name.trim() };
    saveLocalProfile(normalized);
    setProfile(normalized);
    setProfileReady(true);
  }, []);

  const value = useMemo<WorkspaceContextValue>(() => ({
    documents,
    loading,
    profile,
    profileReady,
    refreshDocuments,
    createDocument,
    createOrOpenRoom,
    renameDocument,
    deleteDocument,
    attachRoom,
    setDocumentExternalAiEnabled,
    updateProfile,
  }), [attachRoom, createDocument, createOrOpenRoom, deleteDocument, documents, loading, profile, profileReady, refreshDocuments, renameDocument, setDocumentExternalAiEnabled, updateProfile]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
