// -- 인라인 편집 상태 훅 -----------------------------------------------------
//
// 기존 바닐라 JS 의 makeTextEditable 이 따르던 규약을 React 로 재현한다.
//   - 초기 상태: contentEditable=false → CSS 의 :not([contenteditable="true"])
//     hover 셀렉터가 활성화되어 hover darken 효과가 적용된다.
//   - 클릭 시에만 true 로 전환하고 .notion-block 에 is-editing 클래스를 부여.
//   - blur 시 false 로 되돌린다.
// 뷰어 모드(비인증)에서는 편집 진입을 차단한다.

import { useCallback, useState } from "react";

export interface InlineEditBinding {
  /** 실제 contentEditable 속성 값. */
  contentEditable: boolean;
  /** .notion-block 루트에 부여할 클래스에 포함시킨다 (편집 중일 때 " is-editing"). */
  editingClass: string;
  /** 텍스트 영역에 바인딩할 이벤트 핸들러. */
  onClick: (e: React.MouseEvent) => void;
  onBlur: (e: React.FocusEvent) => void;
}

/**
 * 인증된 사용자만 클릭으로 편집 진입할 수 있는 토글 훅.
 * @param authenticated 편집 권한
 * @param onSave blur 시 호출되는 저장 콜백 (선택 사항 — 블록별로 처리해도 됨)
 */
export function useInlineEdit(
  authenticated: boolean,
  onSave?: () => void | Promise<void>,
): InlineEditBinding {
  const [editing, setEditing] = useState(false);

  const onClick = useCallback(() => {
    if (!authenticated) return;
    if (editing) return;
    setEditing(true);
  }, [authenticated, editing]);

  const onBlur = useCallback(async () => {
    if (!editing) return;
    setEditing(false);
    if (onSave) await onSave();
  }, [editing, onSave]);

  return {
    contentEditable: editing,
    editingClass: editing ? " is-editing" : "",
    onClick,
    onBlur,
  };
}
