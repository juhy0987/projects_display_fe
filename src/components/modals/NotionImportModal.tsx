// -- Notion Import 모달 ------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import * as notionImportApi from "@/api/notionImport";
import type { NotionImportResult } from "@/api/notionImport";

interface NotionImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function NotionImportModal({
  open,
  onClose,
  onImported,
}: NotionImportModalProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<NotionImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setImporting(true);
      setResult(null);
      try {
        const res = await notionImportApi.importNotion(file);
        setResult(res);
        onImported();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Import 실패");
      } finally {
        setImporting(false);
      }
    },
    [onImported],
  );

  const handleClose = useCallback(() => {
    setResult(null);
    setImporting(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="login-modal-overlay is-open"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="login-modal" role="dialog" aria-label="Notion Import">
        <h2 className="login-modal-title">Notion Import</h2>

        {!result ? (
          <div
            className={`notion-import-dropzone${dragOver ? " is-dragover" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) void handleFile(f);
            }}
          >
            {importing ? (
              <p>Import 진행 중...</p>
            ) : (
              <p>Notion 내보내기 zip 파일을 드래그하거나 클릭</p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </div>
        ) : (
          <div className="notion-import-result">
            <p>생성된 문서: {result.created}개</p>
            {result.warnings.length > 0 && (
              <details>
                <summary>경고 ({result.warnings.length})</summary>
                <ul>
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            )}
            {result.fallbacks.length > 0 && (
              <details>
                <summary>Fallback ({result.fallbacks.length})</summary>
                <ul>
                  {result.fallbacks.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <button
          type="button"
          className="login-modal-close"
          aria-label="닫기"
          onClick={handleClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
