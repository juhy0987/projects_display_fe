// -- 블록 래퍼 ---------------------------------------------------------------
//
// 기존 blockWrapper.js 를 React 로 재현한다. 좌측 액션 바는 두 개의 버튼만
// 둔다:
//   1) .block-insert-btn (+)       — 아래에 텍스트 블록 추가
//   2) .block-drag-handle (⠿)      — 클릭 시 타입 변경 드롭다운, mousedown +
//                                   drag 시 블록 이동 (드래그 핸들 겸용)
//
// 드래그 시에는 `draggable` 속성을 mousedown 순간에만 true 로 토글하여,
// 단순 클릭과 드래그를 구분한다. 드롭 타겟은 블록 본체(.block-wrapper 내부
// 자식)이고, 같은 부모의 형제 간 이동만 허용한다.
// (Ref: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, DragEvent } from "react";
import type { Block, BlockType } from "@/types";
import * as blocksApi from "@/api/blocks";

/** 타입 변경 드롭다운에 표시할 블록 팔레트. 기존 blockPalette.js 와 동일. */
const BLOCK_PALETTE_ITEMS: { type: BlockType; label: string; icon: string }[] = [
  { type: "text", label: "텍스트", icon: "T" },
  { type: "image", label: "이미지", icon: "▣" },
  { type: "file", label: "파일", icon: "📎" },
  { type: "toggle", label: "토글", icon: "▶" },
  { type: "quote", label: "인용", icon: '"' },
  { type: "code", label: "코드", icon: "⟨⟩" },
  { type: "callout", label: "콜아웃", icon: "💡" },
  { type: "divider", label: "구분선", icon: "—" },
  { type: "url_embed", label: "URL 임베드", icon: "🔗" },
  { type: "database", label: "데이터베이스", icon: "⊞" },
];

interface BlockWrapperProps {
  block: Block;
  parentBlockId: string | null;
  onReload: () => void;
  onReloadSidebar?: () => void;
  onAddBlockAfter: (
    type: BlockType,
    afterBlockId: string,
    parentBlockId: string | null,
  ) => void;
  authenticated: boolean;
  children: ReactNode;
}

export default function BlockWrapper({
  block,
  parentBlockId,
  onReload,
  onReloadSidebar,
  onAddBlockAfter,
  authenticated,
  children,
}: BlockWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropPos, setDropPos] = useState<"above" | "below" | null>(null);
  // draggable 속성은 드래그 핸들 mousedown 에서만 true 로 설정한다.
  // 기본값이 false 면 블록 본문의 텍스트 선택이 방해받지 않는다.
  const [draggable, setDraggable] = useState(false);
  // 드래그가 실제로 시작됐는지 추적. dragstart 후 click 이벤트에서
  // 메뉴가 잘못 열리는 걸 막기 위한 플래그.
  const dragDidStart = useRef(false);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  // -- 드래그 핸들 mousedown: draggable 활성화 + mouseup 리셋 --
  const handleDragMouseDown = useCallback(() => {
    setDraggable(true);
    const onMouseUp = () => {
      // dragstart 가 발화하지 않았다면 draggable 해제 (단순 클릭)
      if (!dragDidStart.current) setDraggable(false);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  // -- 드래그 핸들 click: 드롭다운 토글 --
  const handleDragClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragDidStart.current) {
      dragDidStart.current = false;
      return;
    }
    setMenuOpen((m) => !m);
  }, []);

  // -- dragstart --
  const handleDragStart = useCallback(
    (e: DragEvent) => {
      if (!draggable) {
        e.preventDefault();
        return;
      }
      dragDidStart.current = true;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", block.id);
      wrapperRef.current?.classList.add("is-dragging");
    },
    [block.id, draggable],
  );

  const handleDragEnd = useCallback(() => {
    setDraggable(false);
    wrapperRef.current?.classList.remove("is-dragging");
    setDropPos(null);
  }, []);

  // -- 드롭 대상 (같은 부모 형제만) --
  const handleDragOver = useCallback(
    (e: DragEvent) => {
      const draggedId = e.dataTransfer.types.includes("text/plain")
        ? null // 값은 drop 에서 읽음
        : null;
      void draggedId;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const midY = rect.top + rect.height / 2;
      setDropPos(e.clientY < midY ? "above" : "below");
    },
    [],
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    // 래퍼를 완전히 벗어났을 때만 해제 (자식 내부 이동은 무시)
    if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
      setDropPos(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");
      setDropPos(null);
      if (!draggedId || draggedId === block.id) return;

      // 위에 드롭 -> 이 블록 앞에 배치. 아래 -> 다음 형제 앞에 배치.
      const wrapperEl = wrapperRef.current;
      if (!wrapperEl) return;
      const rect = wrapperEl.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      let beforeId: string | null;
      if (e.clientY < midY) {
        beforeId = block.id;
      } else {
        // 다음 형제 — 본인 래퍼는 건너뛴다.
        let next = wrapperEl.nextElementSibling as HTMLElement | null;
        while (next && next.getAttribute("data-block-id") === draggedId) {
          next = next.nextElementSibling as HTMLElement | null;
        }
        beforeId =
          next && next.classList.contains("block-wrapper")
            ? next.getAttribute("data-block-id")
            : null;
      }

      await blocksApi.moveBlock(draggedId, beforeId);
      onReload();
    },
    [block.id, onReload],
  );

  // -- 삽입 버튼 --
  const handleInsertClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen(false);
      onAddBlockAfter("text", block.id, parentBlockId);
    },
    [block.id, parentBlockId, onAddBlockAfter],
  );

  // -- 타입 변경 --
  const isPageBlock = block.type === "page";
  const isDbBlock = block.type === "database" || block.type === "db_row";
  const canChangeType = !isPageBlock && !isDbBlock;

  const handleTypeChange = useCallback(
    async (newType: BlockType) => {
      setMenuOpen(false);
      if (newType === block.type) return;
      await blocksApi.changeBlockType(block.id, newType);
      onReload();
    },
    [block.id, block.type, onReload],
  );

  // -- 삭제 --
  const handleDelete = useCallback(async () => {
    setMenuOpen(false);
    if (!confirm("이 블록을 삭제하시겠습니까?")) return;
    await blocksApi.deleteBlock(block.id);
    // page/database/db_row 삭제는 사이드바 갱신 필요
    const needsSidebar =
      (block.type === "page" ||
        block.type === "database" ||
        block.type === "db_row") &&
      onReloadSidebar;
    if (needsSidebar) {
      onReloadSidebar();
    }
    onReload();
  }, [block.id, block.type, onReload, onReloadSidebar]);

  const dropClass =
    dropPos === "above"
      ? " drop-above"
      : dropPos === "below"
        ? " drop-below"
        : "";

  return (
    <div
      ref={wrapperRef}
      className={`block-wrapper${dropClass}`}
      data-block-id={block.id}
      data-parent-block-id={parentBlockId ?? ""}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {authenticated && (
        <div className="block-actions">
          {/* 삽입 버튼 */}
          <button
            type="button"
            className="block-insert-btn"
            aria-label="아래에 블록 추가"
            onClick={handleInsertClick}
          >
            +
          </button>

          {/* 드래그 핸들 + 드롭다운 */}
          <div className="block-more-wrap">
            <button
              type="button"
              className="block-drag-handle"
              aria-label="이동 / 블록 액션"
              onMouseDown={handleDragMouseDown}
              onClick={handleDragClick}
            >
              ⠿
            </button>
            {menuOpen && (
              <div className="block-more-menu">
                {canChangeType && (
                  <>
                    <div className="block-menu-section-label">타입 변경</div>
                    {BLOCK_PALETTE_ITEMS.filter(
                      (item) => item.type !== "page",
                    ).map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        className={`block-change-type-btn${item.type === block.type ? " is-current" : ""}`}
                        onClick={() => handleTypeChange(item.type)}
                      >
                        <span className="block-menu-icon">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                    <div className="block-menu-divider" />
                  </>
                )}
                <button
                  type="button"
                  className="block-delete-btn"
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 블록 콘텐츠 */}
      {children}
    </div>
  );
}
