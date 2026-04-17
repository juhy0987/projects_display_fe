// -- 데이터베이스 블록 -------------------------------------------------------
//
// 기존 databaseBlock.js 를 React 로 전환.
// 테이블 형태로 컬럼/행 편집, 셀 값 수정, 컬럼 추가/삭제를 지원한다.

import { useCallback, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import type { DbColumn } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import * as databaseApi from "@/api/database";
import * as blocksApi from "@/api/blocks";

export default function DatabaseBlock({ block, onReload, onReloadSidebar }: BlockComponentProps) {
  const { authenticated } = useAuth();
  const columns = block.columns ?? [];
  const rows = block.rows ?? [];
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(block.title ?? "");

  const handleTitleSave = useCallback(async () => {
    setEditingTitle(false);
    if (title !== (block.title ?? "")) {
      await databaseApi.patchDatabaseBlock(block.id, { title });
      onReloadSidebar();
    }
  }, [block.id, block.title, title, onReloadSidebar]);

  const handleAddColumn = useCallback(async () => {
    const name = prompt("컬럼 이름을 입력하세요:");
    if (!name) return;
    await databaseApi.addColumn(block.id, name);
    onReload();
  }, [block.id, onReload]);

  const handleRemoveColumn = useCallback(
    async (colId: string) => {
      if (!confirm("이 컬럼을 삭제하시겠습니까?")) return;
      await databaseApi.removeColumn(block.id, colId);
      onReload();
    },
    [block.id, onReload],
  );

  const handleCellChange = useCallback(
    async (rowBlockId: string, colId: string, value: unknown) => {
      await databaseApi.updateRowProperties(rowBlockId, { [colId]: value });
    },
    [],
  );

  const handleAddRow = useCallback(async () => {
    if (!block.document_id) return;
    await blocksApi.createBlock(block.document_id, "db_row", block.id);
    onReload();
  }, [block.document_id, block.id, onReload]);

  return (
    <div className="database-block" style={block.color ? { borderColor: block.color } : undefined}>
      {/* 데이터베이스 제목 */}
      <div className="database-title-row">
        {editingTitle ? (
          <input
            className="database-title-input"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
            }}
          />
        ) : (
          <h3
            className="database-title"
            onClick={() => authenticated && setEditingTitle(true)}
          >
            {title || "제목 없음"}
          </h3>
        )}
      </div>

      {/* 테이블 */}
      <div className="database-table-wrapper">
        <table className="database-table">
          <thead>
            <tr>
              <th className="db-title-col">제목</th>
              {columns.map((col) => (
                <th key={col.id}>
                  <span>{col.name}</span>
                  {authenticated && (
                    <button
                      type="button"
                      className="db-col-remove-btn"
                      onClick={() => handleRemoveColumn(col.id)}
                      title="컬럼 삭제"
                    >
                      x
                    </button>
                  )}
                </th>
              ))}
              {authenticated && (
                <th>
                  <button
                    type="button"
                    className="db-add-col-btn"
                    onClick={handleAddColumn}
                    title="컬럼 추가"
                  >
                    +
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.block_id}>
                <td className="db-title-col">{row.title || "제목 없음"}</td>
                {columns.map((col) => (
                  <DbCell
                    key={col.id}
                    column={col}
                    value={row.properties[col.id]}
                    editable={authenticated}
                    onChange={(val) =>
                      handleCellChange(row.block_id, col.id, val)
                    }
                  />
                ))}
                {authenticated && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {authenticated && (
        <button
          type="button"
          className="db-add-row-btn"
          onClick={handleAddRow}
        >
          + 새 행
        </button>
      )}
    </div>
  );
}

// -- 셀 편집 컴포넌트 --------------------------------------------------------

interface DbCellProps {
  column: DbColumn;
  value: unknown;
  editable: boolean;
  onChange: (value: unknown) => void;
}

function DbCell({ column, value, editable, onChange }: DbCellProps) {
  const strVal = value != null ? String(value) : "";

  if (column.type === "checkbox") {
    return (
      <td>
        <input
          type="checkbox"
          checked={!!value}
          disabled={!editable}
          onChange={(e) => onChange(e.target.checked)}
        />
      </td>
    );
  }

  if (column.type === "select" && column.options?.length) {
    return (
      <td>
        <select
          value={strVal}
          disabled={!editable}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">-</option>
          {column.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </td>
    );
  }

  return (
    <td>
      <input
        type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
        value={strVal}
        disabled={!editable}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(e.target.value)}
      />
    </td>
  );
}
