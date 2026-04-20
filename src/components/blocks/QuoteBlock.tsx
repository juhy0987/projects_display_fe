// -- 인용 블록 ---------------------------------------------------------------

import { useCallback, useRef } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";
import { sanitizeHtml } from "@/utils/sanitize";

export default function QuoteBlock({
  block,
  renderChildren,
  onAddBlock,
}: BlockComponentProps) {
  const { authenticated } = useAuth();
  const textRef = useRef<HTMLParagraphElement>(null);

  const handleBlur = useCallback(async () => {
    const html = textRef.current?.innerHTML ?? "";
    const text = textRef.current?.textContent ?? "";
    await blocksApi.patchBlock(block.id, { text, formatted_text: html });
  }, [block.id]);

  return (
    <blockquote className="notion-quote">
      <p
        ref={textRef}
        className="quote-text"
        contentEditable={authenticated}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(block.formatted_text ?? block.text ?? ""),
        }}
        onBlur={handleBlur}
      />
      <div className="quote-children">
        {renderChildren(block.children, block.id)}
        {authenticated && block.children.length === 0 && (
          <button
            type="button"
            className="add-child-block-btn"
            onClick={() => onAddBlock("text", block.id)}
          >
            +
          </button>
        )}
      </div>
    </blockquote>
  );
}
