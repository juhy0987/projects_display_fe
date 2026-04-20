// -- 블록 래퍼 ---------------------------------------------------------------
//
// 기존 blockWrapper.js 를 React 로 전환한다.
// 각 블록을 .block-wrapper 로 감싸고, 드래그 핸들 / 삽입(+) 버튼 /
// 더보기 메뉴(타입 변환, 삭제)를 제공한다.
// 드래그앤드롭은 HTML5 Drag and Drop API 를 사용한다.
// (Ref: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)

import { useCallback, useRef, useState } from "react";
import type { ReactNode, DragEvent } from "react";
import type { Block, BlockType } from "@/types";
import * as blocksApi from "@/api/blocks";

// 블록 타입 변환 목록
const BLOCK_TYPES: { type: BlockType; label: string }[] = [
  { type: "text", label: "텍스트" },
  { type: "code", label: "코드" },
  { type: "quote", label: "인용" },
  { type: "callout", label: "콜아웃" },
  { type: "toggle", label: "토글" },
  { type: "divider", label: "구분선" },
];

interface BlockWrapperProps {
  block: Block;
  parentBlockId: string | null;
  onReload: () => void;
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
  onAddBlockAfter,
  authenticated,
  children,
}: BlockWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropPos, setDropPos] = useState<"above" | "below" | null>(null);

  // -- 드래그 시작 --
  const handleDragStart = useCallback(
    (e: DragEvent) => {
      e.dataTransfer.setData("text/plain", block.id);
      e.dataTransfer.effectAllowed = "move";
      wrapperRef.current?.classList.add("is-dragging");
    },
    [block.id],
  );

  const handleDragEnd = useCallback(() => {
    wrapperRef.current?.classList.remove("is-dragging");
    setDropPos(null);
  }, []);

  // -- 드롭 대상 --
  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const midY = rect.top + rect.height / 2;
      setDropPos(e.clientY < midY ? "above" : "below");
    },
    [],
  );

  const handleDragLeave = useCallback(() => setDropPos(null), []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setDropPos(null);
      const draggedId = e.dataTransfer.getData("text/plain");
      if (!draggedId || draggedId === block.id) return;
      // beforeBlockId: 위에 드롭하면 이 블록의 id, 아래면 null(맨 끝)
      const beforeId = dropPos === "above" ? block.id : null;
      await blocksApi.moveBlock(draggedId, beforeId);
      onReload();
    },
    [block.id, dropPos, onReload],
  );

  // -- 블록 삭제 --
  const handleDelete = useCallback(async () => {
    if (!confirm("이 블록을 삭제하시겠습니까?")) return;
    setMenuOpen(false);
    await blocksApi.deleteBlock(block.id);
    onReload();
  }, [block.id, onReload]);

  // -- 블록 타입 변환 --
  const handleTypeChange = useCallback(
    async (newType: BlockType) => {
      setMenuOpen(false);
      await blocksApi.changeBlockType(block.id, newType);
      onReload();
    },
    [block.id, onReload],
  );

  const dropClass = dropPos === "above"
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
      draggable={authenticated}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {authenticated && (
        <div className="block-actions">
          {/* 드래그 핸들 */}
          <span className="block-drag-handle" title="드래그하여 이동">
            &#x2630;
          </span>

          {/* 블록 삽입 버튼 */}
          <button
            type="button"
            className="block-insert-btn"
            title="아래에 블록 추가"
            onClick={() =>
              onAddBlockAfter("text", block.id, parentBlockId)
            }
          >
            +
          </button>

          {/* 더보기 메뉴 */}
          <div className="block-more-wrap">
            <button
              type="button"
              className="block-more-btn"
              title="블록 메뉴"
              onClick={() => setMenuOpen((m) => !m)}
            >
              &#8943;
            </button>
            {menuOpen && (
              <div className="block-more-menu">
                <div className="block-menu-section">
                  <span className="block-menu-label">타입 변환</span>
                  {BLOCK_TYPES.map((bt) => (
                    <button
                      key={bt.type}
                      type="button"
                      className={
                        bt.type === block.type ? "is-active" : ""
                      }
                      onClick={() => handleTypeChange(bt.type)}
                      disabled={bt.type === block.type}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
                <hr />
                <button
                  type="button"
                  className="block-menu-delete"
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
