import type { DocumentInfo, DocumentPayload } from "@/types";
import { get, post, patch, del } from "./client";

export function fetchDocuments(): Promise<DocumentInfo[]> {
  return get<DocumentInfo[]>("/api/documents");
}

export function fetchDocument(id: string): Promise<DocumentPayload> {
  return get<DocumentPayload>(`/api/documents/${id}`);
}

export function createDocument(): Promise<DocumentInfo> {
  return post<DocumentInfo>("/api/documents");
}

export function updateTitle(id: string, title: string): Promise<void> {
  return patch<void>(`/api/documents/${id}`, { title });
}

export function deleteDocument(id: string): Promise<void> {
  return del<void>(`/api/documents/${id}`);
}
