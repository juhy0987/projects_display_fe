// ── HTTP 클라이언트 기반 유틸 ────────────────────────────────────────────────
//
// 모든 API 호출은 이 모듈의 헬퍼를 통해 수행한다.
// VITE_API_BASE_URL 환경변수가 설정되면 해당 값을 base 로 사용하고,
// 미설정 시 상대 경로(/api/...)로 호출하여 Vite dev proxy 를 통과한다.
// (Ref: https://vite.dev/guide/env-and-mode)
//
// 반환 타입 설계:
// - JSON 응답을 기대하는 엔드포인트는 getJson/postJson/patchJson 을 사용하고,
//   본문이 비어 있으면 명시적으로 에러를 던진다 (타입 거짓말 방지).
// - 204 No Content 처럼 본문이 없는 엔드포인트는 postVoid/patchVoid/delVoid 를
//   사용해 Promise<void> 를 반환받는다.

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** 403 응답 시 사용자 안내 에러를 던진다. */
function checkPermission(res: Response): void {
  if (res.status === 403) {
    throw new Error("로그인이 필요합니다. 우상단의 로그인 버튼을 이용해 주세요.");
  }
}

/** 실패 응답에서 detail 문자열을 추출한다. */
async function extractError(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({}));
  return (err as { detail?: string }).detail ?? fallback;
}

/** 공통 요청 실행 — 상태 검사와 에러 처리를 담당하고 Response 를 반환한다. */
async function execute(
  path: string,
  method: string,
  body?: unknown,
): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  checkPermission(res);
  if (!res.ok) {
    throw new Error(await extractError(res, `요청 실패: ${method} ${path}`));
  }
  return res;
}

/** JSON 본문을 기대하는 요청. 본문이 비어 있으면 에러를 던진다. */
async function requestJson<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await execute(path, method, body);
  const text = await res.text();
  if (!text) {
    throw new Error(`빈 응답 본문: ${method} ${path}`);
  }
  return JSON.parse(text) as T;
}

/** 본문이 없는(204 등) 요청. */
async function requestVoid(
  path: string,
  method: string,
  body?: unknown,
): Promise<void> {
  await execute(path, method, body);
}

/** FormData 업로드 — 항상 JSON 응답을 기대한다. */
async function formRequest<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    body,
    credentials: "include",
  });
  checkPermission(res);
  if (!res.ok) {
    throw new Error(await extractError(res, `업로드 실패: ${path}`));
  }
  return (await res.json()) as T;
}

// ── JSON 응답 헬퍼 ───────────────────────────────────────────────────────────

export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path, "GET");
}

export function postJson<T>(path: string, body?: unknown): Promise<T> {
  return requestJson<T>(path, "POST", body);
}

export function patchJson<T>(path: string, body?: unknown): Promise<T> {
  return requestJson<T>(path, "PATCH", body);
}

// ── void 응답 헬퍼 ──────────────────────────────────────────────────────────

export function postVoid(path: string, body?: unknown): Promise<void> {
  return requestVoid(path, "POST", body);
}

export function patchVoid(path: string, body?: unknown): Promise<void> {
  return requestVoid(path, "PATCH", body);
}

export function delVoid(path: string): Promise<void> {
  return requestVoid(path, "DELETE");
}

// ── 업로드 ──────────────────────────────────────────────────────────────────

export function upload<T>(path: string, file: File, fieldName = "file"): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file);
  return formRequest<T>(path, form);
}
