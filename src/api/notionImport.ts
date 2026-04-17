import { upload } from "./client";

export interface NotionImportResult {
  created: number;
  warnings: string[];
  fallbacks: string[];
}

export function importNotion(file: File): Promise<NotionImportResult> {
  return upload<NotionImportResult>("/api/import/notion", file);
}
