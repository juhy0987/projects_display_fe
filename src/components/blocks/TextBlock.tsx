// -- 텍스트 블록 -------------------------------------------------------------
//
// 기존 textBlock.js + textEditing.js 를 React 로 전환한다.
// contentEditable 기반 인라인 편집, 헤딩 레벨(h1~h3), 서식 텍스트를 지원한다.
//
// 편집 진입은 "클릭 시에만" 이루어진다. 평상시에는 contenteditable=false 여서
// CSS 의 .notion-text:not([contenteditable="true"]):hover 가 매칭되고 hover
// darken 효과가 적용된다.

import { useCallback, useEffect, useRef, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";
import { sanitizeHtml } from "@/utils/sanitize";

export default function TextBlock({ block }: BlockComponentProps) {
  const { authenticated } = useAuth();
  const elRef = useRef<HTMLParagraphElement>(null);
  const [editing, setEditing] = useState(false);
  const originalRef = useRef(block.formatted_text ?? block.text ?? "");

  // 편집 진입 직후 포커스 + 캐럿을 본문 끝으로 이동
  useEffect(() => {
    if (!editing) return;
    const el = elRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editing]);

  const handleClick = useCallback(() => {
    if (!authenticated || editing) return;
    setEditing(true);
  }, [authenticated, editing]);

  const handleBlur = useCallback(async () => {
    if (!editing) return;
    setEditing(false);
    const el = elRef.current;
    if (!el) return;
    const newHtml = sanitizeHtml(el.innerHTML);
    const newText = el.textContent ?? "";
    if (newHtml === originalRef.current) return;
    await blocksApi.patchBlock(block.id, {
      text: newText,
      formatted_text: newHtml,
    });
    originalRef.current = newHtml;
  }, [block.id, editing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
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

  return (
    <p
      ref={elRef}
      className={`notion-block notion-text${editing ? " is-editing" : ""}`}
      data-level={block.level ?? undefined}
      contentEditable={editing}
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(block.formatted_text ?? block.text ?? ""),
      }}
      onClick={handleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
