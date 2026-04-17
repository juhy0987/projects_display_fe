// -- 파일 블록 ---------------------------------------------------------------
//
// 기존 fileBlock.js 를 React 로 전환.
// 드래그앤드롭 / 클릭 업로드, 파일 카드, 삭제 시 orphan 파일 정리.

import { useCallback, useRef, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";
import * as uploadApi from "@/api/upload";

export default function FileBlock({ block, onReload }: BlockComponentProps) {
  const { authenticated } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFile = !!block.file_id;

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const result = await uploadApi.uploadFile(file);
        await blocksApi.patchBlock(block.id, {
          file_id: result.id,
          file_name: result.original_name,
          file_size: result.size,
          file_content_type: result.content_type,
        });
        onReload();
      } catch (e) {
        alert(e instanceof Error ? e.message : "파일 업로드 실패");
      } finally {
        setUploading(false);
      }
    },
    [block.id, onReload],
  );

  const handleDelete = useCallback(async () => {
    if (block.file_id) {
      await uploadApi.deleteFile(block.file_id);
      await blocksApi.patchBlock(block.id, {
        file_id: null,
        file_name: null,
        file_size: null,
        file_content_type: null,
      });
      onReload();
    }
  }, [block.id, block.file_id, onReload]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!hasFile) {
    return (
      <div
        className={`file-block file-drop-zone${dragOver ? " drag-over" : ""}`}
        onClick={() => authenticated && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleUpload(file);
        }}
      >
        {uploading ? (
          <p>업로드 중...</p>
        ) : (
          <p>파일을 드래그하거나 클릭하여 업로드</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f);
          }}
        />
      </div>
    );
  }

  return (
    <div className="file-block file-card">
      <div className="file-info">
        <span className="file-name">{block.file_name ?? "파일"}</span>
        <span className="file-size">{formatSize(block.file_size)}</span>
      </div>
      <div className="file-actions">
        <a
          className="file-download-btn"
          href={`/api/files/${block.file_id}`}
          download={block.file_name}
        >
          다운로드
        </a>
        {authenticated && (
          <button
            type="button"
            className="file-delete-btn"
            onClick={handleDelete}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
