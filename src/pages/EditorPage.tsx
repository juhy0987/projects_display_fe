// -- 에디터 페이지 -----------------------------------------------------------
//
// 문서 상세 보기: 페이지 제목/부제, 프로퍼티, 블록 목록을 렌더링한다.
// 기존 main.js 의 loadDocument + renderDocument 를 React 컴포넌트로 전환.

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentPayload, BlockType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import * as documentsApi from "@/api/documents";
import * as blocksApi from "@/api/blocks";
import BlockRenderer from "@/components/editor/BlockRenderer";
import DbProperties from "@/components/editor/DbProperties";

interface EditorPageProps {
  documentId: string;
  onReloadSidebar: () => void;
}

export default function EditorPage({
  documentId,
  onReloadSidebar,
}: EditorPageProps) {
  const { authenticated } = useAuth();
  const [doc, setDoc] = useState<DocumentPayload | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const loadDocument = useCallback(async () => {
    try {
      const payload = await documentsApi.fetchDocument(documentId);
      setDoc(payload);
    } catch {
      setDoc(null);
    }
  }, [documentId]);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  // 제목 편집 후 blur 시 저장
  const handleTitleBlur = useCallback(async () => {
    if (!doc || !titleRef.current) return;
    const newTitle = titleRef.current.textContent?.trim() ?? "";
    if (newTitle !== doc.title) {
      await documentsApi.updateTitle(doc.id, newTitle);
      setDoc((prev) => (prev ? { ...prev, title: newTitle } : prev));
      onReloadSidebar();
    }
  }, [doc, onReloadSidebar]);

  const handleAddBlock = useCallback(
    async (type: BlockType, parentBlockId: string | null = null) => {
      if (!doc) return;
      await blocksApi.createBlock(doc.id, type, parentBlockId);
      await loadDocument();
    },
    [doc, loadDocument],
  );

  const handleAddBlockAfter = useCallback(
    async (
      type: BlockType,
      _afterBlockId: string,
      parentBlockId: string | null,
    ) => {
      if (!doc) return;
      // BE 는 "after" 를 직접 지원하지 않으므로 create 후 reload 한���.
      await blocksApi.createBlock(doc.id, type, parentBlockId);
      await loadDocument();
    },
    [doc, loadDocument],
  );

  if (!doc) {
    return (
      <section className="block-page">
        <p>문서를 불러오는 중...</p>
      </section>
    );
  }

  return (
    <section className="block-page" aria-live="polite">
      <div className="block-page-cover" />
      <header className="block-page-header">
        <h1
          ref={titleRef}
          id="page-title"
          contentEditable={authenticated}
          suppressContentEditableWarning
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              titleRef.current?.blur();
            }
          }}
        >
          {doc.title || "제목 없음"}
        </h1>
        <p id="page-subtitle">{doc.subtitle}</p>
      </header>

      {doc.db_context && (
        <DbProperties
          dbContext={doc.db_context}
          onReload={loadDocument}
        />
      )}

      <div id="block-root" className="block-root">
        {doc.blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            parentBlockId={null}
            onReload={loadDocument}
            onReloadSidebar={onReloadSidebar}
            onAddBlock={handleAddBlock}
            onAddBlockAfter={handleAddBlockAfter}
            onNavigate={() => {}}
          />
        ))}

        {/* 빈 문서에 첫 블록 추가 버튼 */}
        {authenticated && doc.blocks.length === 0 && (
          <button
            type="button"
            className="add-first-block-btn"
            onClick={() => handleAddBlock("text")}
          >
            + 블록 추가
          </button>
        )}
      </div>
    </section>
  );
}
