import type { DocumentInfo, DocumentPayload } from "@/types";
import { getJson, postJson, patchVoid, delVoid } from "./client";

export function fetchDocuments(): Promise<DocumentInfo[]> {
  return getJson<DocumentInfo[]>("/api/documents");
}

export function fetchDocument(id: string): Promise<DocumentPayload> {
  return getJson<DocumentPayload>(`/api/documents/${id}`);
}

export function createDocument(): Promise<DocumentInfo> {
  return postJson<DocumentInfo>("/api/documents");
}

export function updateTitle(id: string, title: string): Promise<void> {
  return patchVoid(`/api/documents/${id}`, { title });
}

export function deleteDocument(id: string): Promise<void> {
  return delVoid(`/api/documents/${id}`);
}
