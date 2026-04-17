// -- DB Properties 패널 -----------------------------------------------------
//
// 문서가 db_row 일 때 상단에 표시되는 프로퍼티 편집 패널.
// 기존 editor.js 의 renderDbProperties 를 React 로 전환.

import type { DbColumn } from "@/types";

interface DbPropertiesProps {
  dbContext: {
    block_id: string;
    columns: DbColumn[];
    properties: Record<string, unknown>;
  };
  onReload: () => void;
}

export default function DbProperties({
  dbContext,
  onReload: _onReload,
}: DbPropertiesProps) {
  const { columns, properties } = dbContext;

  if (columns.length === 0) return null;

  return (
    <div id="page-properties" className="page-properties">
      {columns.map((col) => (
        <div key={col.id} className="property-row">
          <span className="property-label">{col.name}</span>
          <span className="property-value">
            {String(properties[col.id] ?? "")}
          </span>
        </div>
      ))}
    </div>
  );
}
