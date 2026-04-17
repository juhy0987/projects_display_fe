import type { DbColumn, DbColumnType } from "@/types";
import { post, patch, del } from "./client";

export function addColumn(
  dbBlockId: string,
  name: string,
  type: DbColumnType = "text",
  options: string[] = [],
): Promise<DbColumn> {
  return post<DbColumn>(
    `/api/database/blocks/${dbBlockId}/schema/columns`,
    { name, type, options },
  );
}

export function updateColumn(
  dbBlockId: string,
  colId: string,
  fields: Partial<Pick<DbColumn, "name" | "type" | "options">>,
): Promise<void> {
  return patch<void>(
    `/api/database/blocks/${dbBlockId}/schema/columns/${colId}`,
    fields,
  );
}

export function removeColumn(
  dbBlockId: string,
  colId: string,
): Promise<void> {
  return del<void>(
    `/api/database/blocks/${dbBlockId}/schema/columns/${colId}`,
  );
}

export function updateRowProperties(
  dbRowBlockId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  return patch<void>(
    `/api/database/blocks/${dbRowBlockId}/properties`,
    { properties },
  );
}

export function patchDatabaseBlock(
  dbBlockId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  return patch<void>(`/api/database/blocks/${dbBlockId}`, fields);
}
