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

  // 콜백에서 최신 doc 을 참조하되 콜백 identity 는 유지하기 위한 ref.
  // setDoc 할 때마다 deps 를 통해 콜백이 새 identity 로 재생성되면 하위
  // BlockRenderer 전체 트리가 props 변화로 인해 무효 리렌더된다.
  const docRef = useRef<DocumentPayload | null>(null);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  const loadDocument = useCallback(async () => {
    try {
      const payload = await documentsApi.fetchDocument(documentId);

      // 문서 불변: 마지막 루트 블록은 반드시 text 타입이어야 한다.
      // 사용자가 다른 블록 뒤로 캐럿을 놓고 계속 타이핑할 수 있는 "꼬리
      // 텍스트" 역할이므로, 문서가 비어 있거나 마지막이 text 가 아니면
      // 즉시 text 블록을 추가하고 재조회한다. 서버 수정 권한이 필요하므로
      // 인증된 사용자에 한정한다 (viewer 는 읽기 전용).
      if (authenticated) {
        const last = payload.blocks[payload.blocks.length - 1];
        if (!last || last.type !== "text") {
          await blocksApi.createBlock(documentId, "text");
          const refreshed = await documentsApi.fetchDocument(documentId);
          setDoc(refreshed);
          return;
        }
      }
      setDoc(payload);
    } catch {
      setDoc(null);
    }
  }, [documentId, authenticated]);

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
      const cur = docRef.current;
      if (!cur) return;
      await blocksApi.createBlock(cur.id, type, parentBlockId);
      await loadDocument();
    },
    [loadDocument],
  );

  const handleAddBlockAfter = useCallback(
    async (
      type: BlockType,
      afterBlockId: string,
      parentBlockId: string | null,
    ) => {
      const cur = docRef.current;
      if (!cur) return;
      // BE 는 블록 생성 시 위치 지정을 지원하지 않으므로, 맨 끝에 생성한 뒤
      // moveBlock 으로 afterBlockId 의 "다음 형제" 위치로 이동시킨다.
      const created = await blocksApi.createBlock(
        cur.id,
        type,
        parentBlockId,
      );

      // 같은 부모 내의 형제 배열에서 afterBlockId 다음 블록을 탐색
      const siblings = parentBlockId
        ? findChildren(cur.blocks, parentBlockId)
        : cur.blocks;
      const afterIdx = siblings.findIndex((b) => b.id === afterBlockId);
      const nextSibling = afterIdx >= 0 ? siblings[afterIdx + 1] : undefined;

      // 새 블록이 이미 맨 끝에 있다면 이동 불필요
      if (nextSibling) {
        await blocksApi.moveBlock(created.id, nextSibling.id);
      }
      await loadDocument();
    },
    [loadDocument],
  );

  // 페이지 블록 클릭 시 라우팅. useCallback 으로 identity 안정화.
  const handleNavigate = useCallback(
    (id: string) => navigate(`/docs/${id}`),
    [navigate],
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
            onNavigate={handleNavigate}
          />
        ))}
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
