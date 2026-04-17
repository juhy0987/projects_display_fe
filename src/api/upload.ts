import { upload, del } from "./client";

export interface ImageUploadResult {
  url: string;
  thumbnail_url: string;
}

export interface FileUploadResult {
  id: string;
  original_name: string;
  size: number;
  content_type: string;
}

export function uploadImage(file: File): Promise<ImageUploadResult> {
  return upload<ImageUploadResult>("/api/upload", file);
}

export function uploadFile(file: File): Promise<FileUploadResult> {
  return upload<FileUploadResult>("/api/files", file);
}

export function deleteFile(fileId: string): Promise<void> {
  return del<void>(`/api/files/${fileId}`);
}
