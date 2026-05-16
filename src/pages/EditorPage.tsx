// -- 에디터 페이지 -----------------------------------------------------------
//
// 문서 상세 보기: 페이지 제목/부제, 프로퍼티, 블록 목록을 렌더링한다.
// 기존 main.js 의 loadDocument + renderDocument 를 React 로 전환한 뒤,
// 블록 CRUD 에 낙관적 업데이트(optimistic)를 도입하여 서버 응답을 기다리지
// 않고 로컬 state 를 먼저 갱신한다. 실패 시 이전 스냅샷으로 롤백한다.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Block, DocumentPayload, BlockType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import * as documentsApi from "@/api/documents";
import * as blocksApi from "@/api/blocks";
import {
  appendRootBlock,
  insertBlockAfter,
  lastRootIsText,
  moveBlockInTree,
  removeBlockById,
} from "@/utils/blockTree";
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
  const docRef = useRef<DocumentPayload | null>(null);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  const loadDocument = useCallback(async () => {
    try {
      const payload = await documentsApi.fetchDocument(documentId);

      // 문서 불변: 마지막 루트 블록은 반드시 text 타입이어야 한다.
      if (authenticated && !lastRootIsText(payload.blocks)) {
        const newBlock = await blocksApi.createBlock(documentId, "text");
        setDoc({ ...payload, blocks: appendRootBlock(payload.blocks, newBlock) });
        return;
      }
      setDoc(payload);
    } catch {
      setDoc(null);
    }
  }, [documentId, authenticated]);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  // 제목 편집 후 blur 시 저장.
  // h1 의 표시 텍스트는 `doc.title || "제목 없음"` 이므로, 빈 제목 상태에서
  // 그대로 blur 하면 placeholder 인 "제목 없음" 이 textContent 로 잡혀
  // 실제 빈 제목이 "제목 없음" 으로 덮어쓰여지는 버그가 있었다.
  // placeholder 일치 시 빈 문자열로 정규화한다.
  const titleEdit = useInlineEdit(authenticated, async () => {
    if (!doc || !titleRef.current) return;
    const raw = titleRef.current.textContent?.trim() ?? "";
    const newTitle = raw === "제목 없음" ? "" : raw;
    if (newTitle !== doc.title) {
      await documentsApi.updateTitle(doc.id, newTitle);
      setDoc((prev) => (prev ? { ...prev, title: newTitle } : prev));
      onReloadSidebar();
    }
  });

  // -- 불변 보장 헬퍼 --------------------------------------------------------
  // 낙관적 업데이트 이후 마지막 루트 블록이 text 가 아니면 BE 에 text 블록을
  // 생성하고 로컬 state 에도 추가한다. 실패 시 조용히 무시 (다음 변경/재로드에서 재시도).
  const ensureTrailingText = useCallback(async () => {
    const cur = docRef.current;
    if (!cur || !authenticated) return;
    if (lastRootIsText(cur.blocks)) return;
    try {
      const newBlock = await blocksApi.createBlock(cur.id, "text");
      setDoc((prev) =>
        prev ? { ...prev, blocks: appendRootBlock(prev.blocks, newBlock) } : prev,
      );
    } catch {
      // 서버 실패는 조용히 넘긴다 — 다음 변경/재로드 시 다시 시도된다.
    }
  }, [authenticated]);

  // -- 낙관적 CRUD 핸들러 ----------------------------------------------------

  const handleAddBlock = useCallback(
    async (type: BlockType, parentBlockId: string | null = null) => {
      const cur = docRef.current;
      if (!cur) return;
      try {
        const created = await blocksApi.createBlock(cur.id, type, parentBlockId);
        // 서버가 실제 id 를 돌려주므로 그대로 로컬 state 에 반영한다.
        setDoc((prev) => {
          if (!prev) return prev;
          if (parentBlockId === null) {
            return { ...prev, blocks: appendRootBlock(prev.blocks, created) };
          }
          // 부모의 children 끝에 추가 — insertBlockAfter 를 응용
          const addToParent = (arr: Block[]): Block[] =>
            arr.map((b) => {
              if (b.id === parentBlockId) {
                return { ...b, children: [...b.children, created] };
              }
              return { ...b, children: addToParent(b.children) };
            });
          return { ...prev, blocks: addToParent(prev.blocks) };
        });
        void ensureTrailingText();
      } catch {
        await loadDocument();
      }
    },
    [ensureTrailingText, loadDocument],
  );

  const handleAddBlockAfter = useCallback(
    async (
      type: BlockType,
      afterBlockId: string,
      parentBlockId: string | null,
    ) => {
      const cur = docRef.current;
      if (!cur) return;

      try {
        // BE 가 생성 위치를 지원하지 않으므로 맨 끝에 생성 후 moveBlock 으로
        // afterBlockId 의 다음 형제 앞으로 재배치한다.
        const created = await blocksApi.createBlock(cur.id, type, parentBlockId);

        const siblings = parentBlockId
          ? (findChildren(cur.blocks, parentBlockId) ?? [])
          : cur.blocks;
        const afterIdx = siblings.findIndex((b) => b.id === afterBlockId);
        const nextSibling = afterIdx >= 0 ? siblings[afterIdx + 1] : undefined;

        if (nextSibling) {
          await blocksApi.moveBlock(created.id, nextSibling.id);
        }

        // 로컬 state: afterBlockId 바로 뒤에 삽입
        setDoc((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            blocks: insertBlockAfter(
              prev.blocks,
              afterBlockId,
              created,
              parentBlockId,
            ),
          };
        });
        void ensureTrailingText();
      } catch {
        await loadDocument();
      }
    },
    [ensureTrailingText, loadDocument],
  );

  const handleDeleteBlock = useCallback(
    async (blockId: string) => {
      const snapshot = docRef.current;
      if (!snapshot) return;

      // 삭제된 블록이 page/database/db_row 라면 사이드바 갱신 필요
      const findType = (arr: Block[]): BlockType | null => {
        for (const b of arr) {
          if (b.id === blockId) return b.type;
          const found = findType(b.children);
          if (found) return found;
        }
        return null;
      };
      const victimType = findType(snapshot.blocks);

      // 낙관적: 먼저 로컬에서 제거
      setDoc((prev) =>
        prev ? { ...prev, blocks: removeBlockById(prev.blocks, blockId) } : prev,
      );

      try {
        await blocksApi.deleteBlock(blockId);
        if (
          victimType === "page" ||
          victimType === "database" ||
          victimType === "db_row"
        ) {
          onReloadSidebar();
        }
        void ensureTrailingText();
      } catch {
        // 롤백
        setDoc(snapshot);
      }
    },
    [ensureTrailingText, onReloadSidebar],
  );

  const handleMoveBlock = useCallback(
    async (blockId: string, beforeBlockId: string | null) => {
      const snapshot = docRef.current;
      if (!snapshot) return;

      setDoc((prev) =>
        prev
          ? { ...prev, blocks: moveBlockInTree(prev.blocks, blockId, beforeBlockId) }
          : prev,
      );

      try {
        await blocksApi.moveBlock(blockId, beforeBlockId);
        void ensureTrailingText();
      } catch {
        setDoc(snapshot);
      }
    },
    [ensureTrailingText],
  );

  const handleChangeBlockType = useCallback(
    async (blockId: string, newType: BlockType) => {
      const snapshot = docRef.current;
      if (!snapshot) return;
      try {
        await blocksApi.changeBlockType(blockId, newType);
        // 타입 변경은 서버가 content_json 구조를 재구성하므로, 해당 블록만
        // 재조회하지 말고 단건 교체 대신 문서를 다시 로드한다.
        // (type 에 따라 추가된 child_document 등 사이드 이펙트가 있을 수 있음)
        await loadDocument();
        if (newType === "page" || newType === "database") {
          onReloadSidebar();
        }
      } catch {
        setDoc(snapshot);
      }
    },
    [loadDocument, onReloadSidebar],
  );

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
        <DbProperties dbContext={doc.db_context} onReload={loadDocument} />
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
            onMoveBlock={handleMoveBlock}
            onDeleteBlock={handleDeleteBlock}
            onChangeBlockType={handleChangeBlockType}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * 블록 트리에서 parentBlockId 에 해당하는 블록의 children 배열을 반환한다.
 * 찾지 못하면 null 을 반환한다 (빈 children 과 구분하기 위해 null 센티넬 사용).
 */
function findChildren(
  blocks: Block[],
  parentBlockId: string,
): Block[] | null {
  for (const b of blocks) {
    if (b.id === parentBlockId) return b.children;
    const found = findChildren(b.children, parentBlockId);
    if (found !== null) return found;
  }
  return null;
}
