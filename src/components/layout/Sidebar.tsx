// -- 사이드바 컴포넌트 -------------------------------------------------------
//
// 기존 sidebar.js + documentList.js 를 React 로 통합한다.
// - 문서 트리 재귀 렌더링
// - 토글(펼침/접힘), 인라인 이름 수정, 삭제
// - 새 문서 / Notion Import 버튼
// - localStorage 기반 사이드바 접힘 상태 유지

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentInfo } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import * as documentsApi from "@/api/documents";

interface SidebarProps {
  documents: DocumentInfo[];
  activeDocId: string | null;
  onSelect: (id: string) => void;
  onReload: () => void;
  onImportClick: () => void;
}

const COLLAPSED_KEY = "sidebar-collapsed";

export default function Sidebar({
  documents,
  activeDocId,
  onSelect,
  onReload,
  onImportClick,
}: SidebarProps) {
  const { authenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === "true",
  );

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const handleNewDoc = useCallback(async () => {
    try {
      const doc = await documentsApi.createDocument();
      onReload();
      onSelect(doc.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "문서 생성에 실패했습니다.");
    }
  }, [onReload, onSelect]);

  return (
    <>
      <div
        className="sidebar-tab"
        role="button"
        tabIndex={0}
        aria-label="사이드바 토글"
        aria-expanded={!collapsed}
        aria-controls="sidebar-panel"
        onClick={() => setCollapsed((c) => !c)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            // Space 키는 기본적으로 페이지 스크롤을 트리거하므로 차단한다.
            e.preventDefault();
            setCollapsed((c) => !c);
          }
        }}
      >
        <span className="sidebar-tab-chevron" />
        <span className="sidebar-tab-label">문서</span>
      </div>

      <aside id="sidebar-panel" className="sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">Project Manager</p>
        </div>

        <div className="document-list-header">
          <h2>Documents</h2>
          {authenticated && (
            <>
              <button
                type="button"
                className="new-document-btn"
                onClick={handleNewDoc}
              >
                + 새 문서
              </button>
              <button
                type="button"
                className="notion-import-btn"
                title="Notion Import"
                onClick={onImportClick}
              >
                &#8615; Import
              </button>
            </>
          )}
        </div>

        <ul className="document-list" aria-label="document list">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              depth={0}
              activeDocId={activeDocId}
              onSelect={onSelect}
              onReload={onReload}
            />
          ))}
        </ul>
      </aside>
    </>
  );
}

// -- 문서 트리 아이템 (재귀) ---------------------------------------------------

interface DocItemProps {
  doc: DocumentInfo;
  depth: number;
  activeDocId: string | null;
  onSelect: (id: string) => void;
  onReload: () => void;
}

function DocumentItem({
  doc,
  depth,
  activeDocId,
  onSelect,
  onReload,
}: DocItemProps) {
  const { authenticated } = useAuth();
  const [open, setOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const hasChildren = doc.children.length > 0;

  const icon = useMemo(() => {
    if (doc.node_type === "database") return "\u229E";
    if (doc.node_type === "db_row") return "\u2261";
    return "";
  }, [doc.node_type]);

  const handleRename = useCallback(
    async (newTitle: string) => {
      setRenaming(false);
      if (newTitle && newTitle !== doc.title) {
        await documentsApi.updateTitle(doc.id, newTitle);
        onReload();
      }
    },
    [doc.id, doc.title, onReload],
  );

  const handleDelete = useCallback(async () => {
    if (!confirm(`"${doc.title || "제목 없음"}" 문서를 삭제하시겠습니까?`)) return;
    await documentsApi.deleteDocument(doc.id);
    onReload();
  }, [doc.id, doc.title, onReload]);

  const nodeClass =
    doc.node_type === "database"
      ? " is-database-node"
      : doc.node_type === "db_row"
        ? " is-db-row"
        : "";

  return (
    <li className="document-row">
      <div
        className={`document-item${activeDocId === doc.id ? " is-active" : ""}${nodeClass}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {/* 접힘 토글 */}
        <button
          type="button"
          className={`document-toggle-btn${hasChildren ? " has-children" : ""}${open ? " is-expanded" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setOpen((o) => !o);
          }}
          aria-label="하위 문서 펼침/접힘"
          aria-expanded={open}
          disabled={!hasChildren}
        />

        {/* 아이콘 + 제목 */}
        {renaming ? (
          <input
            className="document-title-input"
            defaultValue={doc.title}
            autoFocus
            onBlur={(e) => handleRename(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename(e.currentTarget.value);
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="document-title-btn"
            onClick={() => onSelect(doc.id)}
          >
            {icon && <span className="document-item-icon">{icon}</span>}
            <span className="document-title-text">
              {doc.title || "제목 없음"}
            </span>
          </button>
        )}

        {/* 더보기 메뉴 */}
        {authenticated && doc.node_type !== "db_row" && (
          <div className="document-menu-wrapper">
            <button
              type="button"
              className="document-menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((m) => !m);
              }}
              aria-label="문서 메뉴"
            >
              &#8943;
            </button>
            {menuOpen && (
              <div className="document-menu">
                <button
                  type="button"
                  className="document-menu-rename"
                  onClick={() => {
                    setMenuOpen(false);
                    setRenaming(true);
                  }}
                >
                  이름 변경
                </button>
                <button
                  type="button"
                  className="document-menu-delete"
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하위 문서 */}
      {hasChildren && open && (
        <ul className="document-children">
          {doc.children.map((child) => (
            <DocumentItem
              key={child.id}
              doc={child}
              depth={depth + 1}
              activeDocId={activeDocId}
              onSelect={onSelect}
              onReload={onReload}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
