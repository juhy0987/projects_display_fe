import type { Block, BlockType } from "@/types";
import { post, patch, del } from "./client";

export function createBlock(
  documentId: string,
  type: BlockType,
  parentBlockId: string | null = null,
  targetDocumentId: string | null = null,
): Promise<Block> {
  const body: Record<string, unknown> = { type, parent_block_id: parentBlockId };
  if (targetDocumentId !== null) body.target_document_id = targetDocumentId;
  return post<Block>(`/api/documents/${documentId}/blocks`, body);
}

export function patchBlock(
  blockId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  return patch<void>(`/api/blocks/${blockId}`, fields);
}

export function deleteBlock(blockId: string): Promise<void> {
  return del<void>(`/api/blocks/${blockId}`);
}

export function changeBlockType(
  blockId: string,
  type: BlockType,
): Promise<void> {
  return patch<void>(`/api/blocks/${blockId}/type`, { type });
}

export function moveBlock(
  blockId: string,
  beforeBlockId: string | null,
): Promise<void> {
  return patch<void>(`/api/blocks/${blockId}/position`, {
    before_block_id: beforeBlockId,
  });
}
