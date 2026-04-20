// -- 에디터 페이지 -----------------------------------------------------------
//
// 문서 상세 보기: 페이지 제목/부제, 프로퍼티, 블록 목록을 렌더링한다.
// 기존 main.js 의 loadDocument + renderDocument 를 React 컴포넌트로 전환.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Block, DocumentPayload, BlockType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useInlineEdit } from "@/hooks/useInlineEdit";
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
  const navigate = useNavigate();
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
  const titleEdit = useInlineEdit(authenticated, async () => {
    if (!doc || !titleRef.current) return;
    const newTitle = titleRef.current.textContent?.trim() ?? "";
    if (newTitle !== doc.title) {
      await documentsApi.updateTitle(doc.id, newTitle);
      setDoc((prev) => (prev ? { ...prev, title: newTitle } : prev));
      onReloadSidebar();
    }
  });

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
      afterBlockId: string,
      parentBlockId: string | null,
    ) => {
      if (!doc) return;
      // BE 는 블록 생성 시 위치 지정을 지원하지 않으므로, 맨 끝에 생성한 뒤
      // moveBlock 으로 afterBlockId 의 "다음 형제" 위치로 이동시킨다.
      // moveBlock 의 before_block_id 는 "이 블록의 바로 앞에 위치"를 의미하므로,
      // afterBlockId 의 다음 블록 id 를 찾아 before 로 넘겨야 한다.
      const created = await blocksApi.createBlock(
        doc.id,
        type,
        parentBlockId,
      );

      // 같은 부모 내의 형제 배열에서 afterBlockId 다음 블록을 탐색
      const siblings = parentBlockId
        ? findChildren(doc.blocks, parentBlockId)
        : doc.blocks;
      const afterIdx = siblings.findIndex((b) => b.id === afterBlockId);
      const nextSibling = afterIdx >= 0 ? siblings[afterIdx + 1] : undefined;
      const beforeId = nextSibling ? nextSibling.id : null;

      // 새 블록이 이미 맨 끝에 있다면 이동 불필요
      if (nextSibling) {
        await blocksApi.moveBlock(created.id, beforeId);
      }
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
          contentEditable={titleEdit.contentEditable}
          suppressContentEditableWarning
          onClick={titleEdit.onClick}
          onBlur={titleEdit.onBlur}
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
            onNavigate={(id) => navigate(`/docs/${id}`)}
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

/** 블록 트리에서 parentBlockId 에 해당하는 블록의 children 배열을 반환한다. */
function findChildren(blocks: Block[], parentBlockId: string): Block[] {
  for (const b of blocks) {
    if (b.id === parentBlockId) return b.children;
    const found = findChildren(b.children, parentBlockId);
    if (found.length > 0 || b.children.some((c) => c.id === parentBlockId)) {
      return found;
    }
  }
  return [];
}
