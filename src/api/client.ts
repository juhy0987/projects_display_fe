// ── HTTP 클라이언트 기반 유틸 ────────────────────────────────────────────────
//
// 모든 API 호출은 이 모듈의 헬퍼를 통해 수행한다.
// VITE_API_BASE_URL 환경변수가 설정되면 해당 값을 base 로 사용하고,
// 미설정 시 상대 경로(/api/...)로 호출하여 Vite dev proxy 를 통과한다.
// (Ref: https://vite.dev/guide/env-and-mode)

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** 403 응답 시 사용자 안내 에러를 던진다. */
function checkPermission(res: Response): void {
  if (res.status === 403) {
    throw new Error("로그인이 필요합니다. 우상단의 로그인 버튼을 이용해 주세요.");
  }
}

/** JSON body 를 포함하는 요청을 보낸다. */
async function jsonRequest<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  checkPermission(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `요청 실패: ${method} ${path}`,
    );
  }
  // 204 No Content 등 body 없는 응답 처리
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

/** FormData body 를 포함하는 요청을 보낸다. */
async function formRequest<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    body,
    credentials: "include",
  });
  checkPermission(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `업로드 실패: ${path}`,
    );
  }
  return res.json() as Promise<T>;
}

export function get<T>(path: string): Promise<T> {
  return jsonRequest<T>(path, "GET");
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return jsonRequest<T>(path, "POST", body);
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return jsonRequest<T>(path, "PATCH", body);
}

export function del<T>(path: string): Promise<T> {
  return jsonRequest<T>(path, "DELETE");
}

export function upload<T>(path: string, file: File, fieldName = "file"): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file);
  return formRequest<T>(path, form);
}
