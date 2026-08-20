import { deleteDB, openDB } from "idb";
import type { LocalDocument } from "./workspace";

const DATABASE_NAME = "p2p-encrypted-workspace";
const DATABASE_VERSION = 1;
const DOCUMENT_STORE = "documents";

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function getDatabase() {
  return openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(DOCUMENT_STORE)) {
        const store = database.createObjectStore(DOCUMENT_STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("roomCode", "roomCode");
      }
    },
  });
}

export async function listDocuments(): Promise<LocalDocument[]> {
  const database = await getDatabase();
  const records = await database.getAll(DOCUMENT_STORE);
  return (records as LocalDocument[]).sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function getDocument(id: string): Promise<LocalDocument | undefined> {
  const database = await getDatabase();
  return database.get(DOCUMENT_STORE, id) as Promise<LocalDocument | undefined>;
}

export async function createDocument(title = "Untitled workspace", room?: { roomCode: string; roomSecret: string }) {
  const timestamp = Date.now();
  const document: LocalDocument = {
    id: createId(),
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(room ?? {}),
  };
  const database = await getDatabase();
  await database.put(DOCUMENT_STORE, document);
  return document;
}

export async function saveDocument(document: LocalDocument) {
  const database = await getDatabase();
  const next = { ...document, updatedAt: Date.now() };
  await database.put(DOCUMENT_STORE, next);
  return next;
}

export async function renameDocument(id: string, title: string) {
  const document = await getDocument(id);
  if (!document) return undefined;
  return saveDocument({ ...document, title: title.trim() || "Untitled workspace" });
}

export async function attachRoomToDocument(id: string, roomCode: string, roomSecret: string) {
  const document = await getDocument(id);
  if (!document) return undefined;
  return saveDocument({ ...document, roomCode, roomSecret });
}

export async function touchDocument(id: string) {
  const document = await getDocument(id);
  if (!document) return undefined;
  return saveDocument(document);
}

export async function deleteDocument(id: string) {
  const database = await getDatabase();
  await database.delete(DOCUMENT_STORE, id);
}

export async function findDocumentByRoom(roomCode: string, roomSecret: string) {
  const documents = await listDocuments();
  return documents.find(document => document.roomCode === roomCode && document.roomSecret === roomSecret);
}

export async function getOrCreateRoomDocument(roomCode: string, roomSecret: string) {
  const existing = await findDocumentByRoom(roomCode, roomSecret);
  if (existing) return existing;
  return createDocument(`Shared room ${roomCode}`, { roomCode, roomSecret });
}

export async function resetDocumentRegistryForTesting() {
  await deleteDB(DATABASE_NAME);
}
