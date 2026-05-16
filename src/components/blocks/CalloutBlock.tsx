// -- 콜아웃 블록 -------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";
import { sanitizeHtml } from "@/utils/sanitize";

export default function CalloutBlock({
  block,
  renderChildren,
  onAddBlock,
}: BlockComponentProps) {
  const { authenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const originalHtml = useRef(block.formatted_text ?? block.text ?? "");

  useEffect(() => {
    if (!editing) return;
    textRef.current?.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    if (textRef.current) {
      range.selectNodeContents(textRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const handleClick = useCallback(() => {
    if (!authenticated || editing) return;
    setEditing(true);
  }, [authenticated, editing]);

  const handleBlur = useCallback(async () => {
    if (!editing) return;
    setEditing(false);
    const el = textRef.current;
    if (!el) return;
    const html = sanitizeHtml(el.innerHTML);
    const text = el.textContent ?? "";
    if (html === originalHtml.current) return;
    await blocksApi.patchBlock(block.id, { text, formatted_text: html });
    originalHtml.current = html;
  }, [block.id, editing]);

  return (
    <div
      className={`notion-block notion-callout${editing ? " is-editing" : ""}`}
      data-color={block.color ?? undefined}
    >
      <span className="callout-emoji">{block.emoji ?? "💡"}</span>
      <div className="callout-body">
        <div
          ref={textRef}
          className="callout-text"
          contentEditable={editing}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(block.formatted_text ?? block.text ?? ""),
          }}
          onClick={handleClick}
          onBlur={handleBlur}
        />
        <div className="callout-children">
          {renderChildren(block.children, block.id)}
          {authenticated && (
            <button
              type="button"
              className="add-child-block-btn"
              onClick={() => onAddBlock("text", block.id)}
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
