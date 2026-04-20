// -- 텍스트 블록 -------------------------------------------------------------
//
// 기존 textBlock.js + textEditing.js 를 React 로 전환한다.
// contentEditable 기반 인라인 편집, 헤딩 레벨(h1~h3), 서식 텍스트를 지원한다.

import { useCallback, useRef } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";
import { sanitizeHtml } from "@/utils/sanitize";

export default function TextBlock({ block }: BlockComponentProps) {
  const { authenticated } = useAuth();
  const elRef = useRef<HTMLParagraphElement>(null);
  const originalRef = useRef(block.formatted_text ?? block.text ?? "");

  const handleBlur = useCallback(async () => {
    const el = elRef.current;
    if (!el) return;
    const newHtml = el.innerHTML;
    const newText = el.textContent ?? "";
    if (newHtml === originalRef.current) return;

    await blocksApi.patchBlock(block.id, {
      text: newText,
      formatted_text: newHtml,
    });
    originalRef.current = newHtml;
  }, [block.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        // 편집 취소: 원본 복원
        if (elRef.current) {
          elRef.current.innerHTML = originalRef.current;
          elRef.current.blur();
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        elRef.current?.blur();
      }
    },
    [],
  );

  // 헤딩 레벨에 따라 태그를 구분하지 않고, data-level 로 CSS 에서 처리한다.
  // (기존 바닐라 JS 와 동일한 접근)
  return (
    <p
      ref={elRef}
      className="notion-text"
      data-level={block.level ?? undefined}
      contentEditable={authenticated}
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(block.formatted_text ?? block.text ?? ""),
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
