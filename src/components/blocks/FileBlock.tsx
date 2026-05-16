// -- 파일 블록 ---------------------------------------------------------------
//
// 기존 fileBlock.js + global.css 의 카노니컬 구조에 맞춘다:
//   .notion-file
//     .file-drop-zone[.is-drag-over]     (빈 상태)
//       .file-drop-icon
//       .file-drop-label
//       input.file-input (hidden)
//     .file-upload-spinner               (업로드 중)
//       .file-spinner-dot
//     .file-card                         (업로드 완료)
//       .file-icon
//       .file-info
//         .file-name
//         .file-meta
//       a.file-download-btn
//       button.file-remove-btn
//     .file-upload-error                 (에러)

import { useCallback, useRef, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";
import * as uploadApi from "@/api/upload";

export default function FileBlock({ block, onReload }: BlockComponentProps) {
  const { authenticated } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFile = !!block.file_id;

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError("");
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
        setError(e instanceof Error ? e.message : "파일 업로드 실패");
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

  const formatSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // hidden 속성으로 상태 표시를 토글 → CSS 의 [hidden] 규칙에 일치
  const showEmpty = !hasFile && !uploading;
  const showSpinner = uploading;
  const showCard = hasFile;

  return (
    <div className="notion-block notion-file">
      {/* 빈 상태(드롭존) */}
      <div
        className={`file-empty-state file-drop-zone${dragOver ? " is-drag-over" : ""}`}
        hidden={!showEmpty}
        role="button"
        tabIndex={0}
        onClick={() => authenticated && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && authenticated) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
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
        <span className="file-drop-icon">📎</span>
        <span className="file-drop-label">
          {authenticated ? "파일을 드래그하거나 클릭하여 업로드" : "파일 없음"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f);
          }}
        />
      </div>

      {/* 업로드 중 스피너 */}
      <div className="file-upload-spinner" hidden={!showSpinner}>
        <span className="file-spinner-dot" />
        <span>업로드 중...</span>
      </div>

      {/* 업로드 완료 카드 */}
      <div className="file-uploaded-state file-card" hidden={!showCard}>
        <span className="file-icon">📄</span>
        <div className="file-info">
          <span className="file-name">{block.file_name ?? "파일"}</span>
          <span className="file-meta">{formatSize(block.file_size)}</span>
        </div>
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
            className="file-remove-btn"
            onClick={handleDelete}
            aria-label="파일 제거"
          >
            ✕
          </button>
        )}
      </div>

      {/* 에러 */}
      <div className="file-upload-error" hidden={!error}>
        {error}
      </div>
    </div>
  );
}
