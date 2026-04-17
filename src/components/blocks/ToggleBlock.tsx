// -- 토글 블록 ---------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";

export default function ToggleBlock({
  block,
  renderChildren,
  onAddBlock,
}: BlockComponentProps) {
  const { authenticated } = useAuth();
  const [open, setOpen] = useState(block.is_open ?? true);
  const titleRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    await blocksApi.patchBlock(block.id, { is_open: next });
  }, [block.id, open]);

  const handleTitleBlur = useCallback(async () => {
    const html = titleRef.current?.innerHTML ?? "";
    const text = titleRef.current?.textContent ?? "";
    await blocksApi.patchBlock(block.id, {
      text,
      formatted_text: html,
    });
  }, [block.id]);

  return (
    <div className="toggle-block" data-level={block.level ?? undefined}>
      <div className="toggle-header">
        <button
          type="button"
          className={`toggle-arrow-btn${open ? " is-open" : ""}`}
          onClick={handleToggle}
          aria-expanded={open}
          aria-label="토글 펼침/접힘"
        >
          &#9656;
        </button>
        <div
          ref={titleRef}
          className="toggle-title"
          contentEditable={authenticated}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{
            __html: block.formatted_text ?? block.text ?? "",
          }}
          onBlur={handleTitleBlur}
        />
      </div>

      {open && (
        <div className="toggle-children">
          {renderChildren(block.children, block.id)}
          {authenticated && (
            <button
              type="button"
              className="add-child-block-btn"
              onClick={() => onAddBlock("text", block.id)}
            >
              + 하위 블록 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
