// -- 콜아웃 블록 -------------------------------------------------------------

import { useCallback, useRef } from "react";
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
  const textRef = useRef<HTMLDivElement>(null);

  const handleBlur = useCallback(async () => {
    const html = textRef.current?.innerHTML ?? "";
    const text = textRef.current?.textContent ?? "";
    await blocksApi.patchBlock(block.id, { text, formatted_text: html });
  }, [block.id]);

  return (
    <div
      className="callout-block"
      style={block.color ? { borderLeftColor: block.color } : undefined}
    >
      <span className="callout-emoji">{block.emoji ?? "💡"}</span>
      <div className="callout-body">
        <div
          ref={textRef}
          className="callout-text"
          contentEditable={authenticated}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(block.formatted_text ?? block.text ?? ""),
          }}
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
