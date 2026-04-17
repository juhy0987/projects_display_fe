// ── 블록·문서·인증 관련 공용 타입 정의 ─────────────────────────────────────

/** 블록 타입 유니온. BE 의 BlockType enum 과 1:1 대응한다. */
export type BlockType =
  | "text"
  | "image"
  | "code"
  | "toggle"
  | "quote"
  | "callout"
  | "divider"
  | "page"
  | "database"
  | "db_row"
  | "url_embed"
  | "file";

/** DB 컬럼 타입. */
export type DbColumnType =
  | "text"
  | "number"
  | "select"
  | "checkbox"
  | "date"
  | "url";

/** 데이터베이스 스키마 컬럼. */
export interface DbColumn {
  id: string;
  name: string;
  type: DbColumnType;
  options?: string[];
}

/** 데이터베이스 행(db_row). */
export interface DbRow {
  block_id: string;
  document_id: string;
  title: string;
  properties: Record<string, unknown>;
}

/** 블록 데이터 — 서버 응답의 단일 블록 형상. */
export interface Block {
  id: string;
  type: BlockType;
  document_id: string;
  parent_block_id: string | null;

  // text / heading
  text?: string;
  formatted_text?: string;
  level?: 1 | 2 | 3;

  // image
  url?: string;
  thumbnail_url?: string;
  caption?: string;

  // code
  code?: string;
  language?: string;

  // toggle / callout
  is_open?: boolean;
  emoji?: string;
  color?: string;

  // page
  title?: string;
  child_document_id?: string;
  child_document?: { id: string; title: string };
  is_broken_ref?: boolean;

  // file
  file_id?: string;
  file_name?: string;
  file_size?: number;
  file_content_type?: string;

  // url_embed
  embed_title?: string;
  embed_description?: string;
  embed_image?: string;
  embed_logo?: string;

  // database
  columns?: DbColumn[];
  rows?: DbRow[];

  // 중첩 블록
  children: Block[];
}

/** 사이드바에 표시되는 문서 트리 노드. */
export interface DocumentInfo {
  id: string;
  title: string;
  node_type?: "document" | "database" | "db_row";
  children: DocumentInfo[];
}

/** 문서 상세 페이로드 (`GET /api/documents/{id}`). */
export interface DocumentPayload {
  id: string;
  title: string;
  subtitle: string;
  blocks: Block[];
  db_context?: {
    block_id: string;
    columns: DbColumn[];
    properties: Record<string, unknown>;
  };
}

/** 인증 상태. */
export interface AuthState {
  authenticated: boolean;
  username: string | null;
}
