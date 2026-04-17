// -- 페이지 참조 블록 --------------------------------------------------------

import { useCallback } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";

export default function PageBlock({ block, onNavigate }: BlockComponentProps) {
  const isBroken = block.is_broken_ref;
  const docId = block.child_document_id ?? block.child_document?.id;
  const title =
    block.child_document?.title ?? block.title ?? "제목 없음";

  const handleClick = useCallback(() => {
    if (docId && !isBroken) onNavigate(docId);
  }, [docId, isBroken, onNavigate]);

  return (
    <button
      type="button"
      className={`page-block${isBroken ? " is-broken" : ""}`}
      onClick={handleClick}
      disabled={isBroken}
    >
      <span className="page-block-icon">
        {isBroken ? "\u26A0" : "\uD83D\uDCC4"}
      </span>
      <span className="page-block-title">{title}</span>
    </button>
  );
}
