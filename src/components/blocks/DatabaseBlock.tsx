// -- 데이터베이스 블록 -------------------------------------------------------
//
// 기존 databaseBlock.js 를 React 로 전환.
// 테이블 형태로 컬럼/행 편집, 셀 값 수정, 컬럼 추가/삭제를 지원한다.

import { useCallback, useEffect, useState } from "react";
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
    <div
      className="notion-block notion-database"
      style={block.color ? { borderColor: block.color } : undefined}
    >
      {/* 데이터베이스 제목 */}
      <div className="db-title-row">
        {editingTitle ? (
          <input
            className="db-title-input"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
            }}
          />
        ) : (
          <input
            className="db-title-input"
            value={title || ""}
            readOnly
            placeholder="제목 없음"
            onClick={() => authenticated && setEditingTitle(true)}
          />
        )}
      </div>

      {/* 테이블 */}
      <div className="db-table-wrap">
        <table className="db-table">
          <thead>
            <tr>
              <th className="db-th db-th-title">제목</th>
              {columns.map((col) => (
                <th key={col.id} className="db-th">
                  <span className="db-col-name">{col.name}</span>
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
                <th className="db-th db-th-add">
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
              <tr key={row.block_id} className="db-row">
                <td className="db-td db-td-title">
                  {row.title || "제목 없음"}
                </td>
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
                {authenticated && <td className="db-td" />}
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

  // 체크박스/셀렉트는 즉시 저장(단일 클릭 상호작용이므로 부하/경쟁 문제 없음).
  if (column.type === "checkbox") {
    return (
      <td className="db-td">
        <input
          type="checkbox"
          className="db-cell-checkbox"
          checked={!!value}
          disabled={!editable}
          onChange={(e) => onChange(e.target.checked)}
        />
      </td>
    );
  }

  if (column.type === "select" && column.options?.length) {
    return (
      <td className="db-td">
        <select
          className="db-cell-input"
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

  // 텍스트/숫자/날짜는 로컬 상태로 보관하고 onBlur 에서만 저장한다.
  // 매 키스트로크마다 PATCH 를 날리면 서버 부하와 네트워크 지연으로 인한
  // 레이스 컨디션(이전 요청이 늦게 도착하여 최신 값을 덮어씀)이 발생한다.
  return <TextCell column={column} initialValue={strVal} editable={editable} onChange={onChange} />;
}

interface TextCellProps {
  column: DbColumn;
  initialValue: string;
  editable: boolean;
  onChange: (value: unknown) => void;
}

function TextCell({ column, initialValue, editable, onChange }: TextCellProps) {
  const [local, setLocal] = useState(initialValue);

  // 부모(행)의 서버 값이 바뀌면 로컬도 동기화
  useEffect(() => {
    setLocal(initialValue);
  }, [initialValue]);

  const inputType =
    column.type === "number" ? "number" : column.type === "date" ? "date" : "text";

  return (
    <td className="db-td">
      <input
        className="db-cell-input"
        type={inputType}
        value={local}
        disabled={!editable}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== initialValue) onChange(local);
        }}
      />
    </td>
  );
}
