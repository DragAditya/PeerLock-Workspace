export type LocalProfile = { id: string; name: string; color: string };

export type WorkspaceDocument = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  roomCode?: string;
  roomSecret?: string;
  externalAiEnabled: boolean;
};

export type WorkspaceStore = {
  profile: LocalProfile | null;
  documents: WorkspaceDocument[];
  loading: boolean;
  setProfile: (profile: LocalProfile) => void;
  createDocument: (title?: string) => Promise<WorkspaceDocument>;
  updateDocument: (id: string, patch: Partial<WorkspaceDocument>) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  openRoom: (roomCode: string, roomSecret: string) => Promise<WorkspaceDocument>;
};
