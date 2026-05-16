// -- 토글 블록 ---------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";
import { sanitizeHtml } from "@/utils/sanitize";

export default function ToggleBlock({
  block,
  renderChildren,
  onAddBlock,
}: BlockComponentProps) {
  const { authenticated } = useAuth();
  const [open, setOpen] = useState(block.is_open ?? true);
  const [editing, setEditing] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const originalHtml = useRef(block.formatted_text ?? block.text ?? "");

  useEffect(() => {
    if (!editing) return;
    titleRef.current?.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    if (titleRef.current) {
      range.selectNodeContents(titleRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const handleToggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    await blocksApi.patchBlock(block.id, { is_open: next });
  }, [block.id, open]);

  const handleTitleClick = useCallback(() => {
    if (!authenticated || editing) return;
    setEditing(true);
  }, [authenticated, editing]);

  const handleTitleBlur = useCallback(async () => {
    if (!editing) return;
    setEditing(false);
    const el = titleRef.current;
    if (!el) return;
    const html = sanitizeHtml(el.innerHTML);
    const text = el.textContent ?? "";
    if (html === originalHtml.current) return;
    await blocksApi.patchBlock(block.id, { text, formatted_text: html });
    originalHtml.current = html;
  }, [block.id, editing]);

  return (
    <div
      className={`notion-block notion-toggle${editing ? " is-editing" : ""}`}
      data-level={block.level ?? undefined}
    >
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
          contentEditable={editing}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(block.formatted_text ?? block.text ?? ""),
          }}
          onClick={handleTitleClick}
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
