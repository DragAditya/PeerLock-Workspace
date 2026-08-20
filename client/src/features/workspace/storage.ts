import { openDB } from "idb";
import type { WorkspaceDocument } from "./types";

const database = openDB("peerlock-clean-v1", 1, { upgrade(db) { db.createObjectStore("documents", { keyPath: "id" }); } });

export async function listLocalDocuments() {
  const docs = await (await database).getAll("documents") as WorkspaceDocument[];
  return docs.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function storeDocument(document: WorkspaceDocument) { await (await database).put("documents", document); }
export async function deleteStoredDocument(id: string) { await (await database).delete("documents", id); }
