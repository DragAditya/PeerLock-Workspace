export type LocalProfile = { id: string; name: string; color: string };

export type WorkspaceDocument = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  roomCode?: string;
  roomId?: string;
  roomProtected?: boolean;
  roomTransportSecret?: string;
  externalAiEnabled: boolean;
};

export type WorkspaceStore = {
  profile: LocalProfile | null;
  documents: WorkspaceDocument[];
  loading: boolean;
  initializationRecovered: boolean;
  setProfile: (profile: LocalProfile) => void;
  clearProfile: () => void;
  createDocument: (title?: string) => Promise<WorkspaceDocument>;
  updateDocument: (id: string, patch: Partial<WorkspaceDocument>) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  openRoom: (room: { id: string; code: string; protected: boolean; transportSecret: string }) => Promise<WorkspaceDocument>;
};
