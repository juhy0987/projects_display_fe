# 03. API 호출 / 데이터 흐름

## 단일 진입점

모든 HTTP 호출은 `src/api/` 를 거친다. 컴포넌트 / 페이지에서 `fetch` / `axios` 를 직접 호출 금지.

```
컴포넌트  →  hook  →  src/api/<resource>.ts  →  src/api/client.ts  →  BE
```

## 공통 클라이언트 (`src/api/client.ts`)

- baseURL, 헤더, 인증 쿠키 / 토큰, 에러 정규화를 한 곳에서 처리.
- 실패 시 `Error` 의 서브타입 / 표준화된 객체를 throw — 호출부가 `response.ok` 를 매번 확인할 필요 없게.

```ts
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new ApiError(res.status, body?.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}
```

## 리소스별 모듈

- 파일 1개 = 하나의 리소스 (`blocks.ts`, `documents.ts`, `auth.ts`).
- 함수명은 동작 + 리소스: `listDocuments`, `createBlock`, `updateBlockContent`.
- 인자와 반환 타입은 명시적으로 — `src/types/` 의 타입 사용.

```ts
import { request } from "./client";
import type { Block, BlockCreate } from "@/types/blocks";

export function listBlocks(documentId: string): Promise<Block[]> {
  return request<Block[]>(`/api/documents/${documentId}/blocks`);
}

export function createBlock(documentId: string, payload: BlockCreate): Promise<Block> {
  return request<Block>(`/api/documents/${documentId}/blocks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
```

## 데이터 페칭 패턴

- 가벼운 화면: 페이지 컴포넌트 안에서 `useEffect` + `useState` 로 직접.
- 여러 화면이 같은 데이터를 보면 hook (`useDocument`, `useBlocks`) 으로 추출.
- 캐시가 필요해지면 그 시점에 `react-query` 등 도입 검토 — 이슈로 합의.

## 에러 처리

- API 호출 실패는 throw 된 `ApiError` 를 컴포넌트가 잡아 사용자 메시지로 변환.
- 글로벌 알림 (토스트) 은 context 에서 제공, hook 으로 호출.
- 401 / 인증 만료는 `client.ts` 에서 가로채 로그인 페이지로 라우팅하거나 context 알림.

## 인증

- 세션 쿠키 기반이면 `credentials: "include"` 필수 (위 client.ts 참고).
- 인증 사용자 정보는 `AuthContext` 에서 제공. 로그인/로그아웃은 `src/api/auth.ts`.

## 업로드 / 파일

- `multipart/form-data` 는 `Content-Type` 헤더를 직접 지정하지 않는다 (브라우저가 boundary 포함해서 설정).
- 큰 파일은 진행률이 필요하면 `XMLHttpRequest` 또는 fetch + stream 으로.

## 보안 주의사항

- 응답에서 받은 HTML / Markdown 을 그대로 `dangerouslySetInnerHTML` 에 넣지 않는다 — `dompurify` 거친 후만.
- 외부 임베드(URL preview) 는 origin 화이트리스트 / sandbox iframe 으로 격리.
- 토큰을 로컬 스토리지에 두지 않는다 (XSS 시 즉시 탈취). 쿠키 (HttpOnly) 가 기본.

## 타입 동기화

- BE Pydantic 모델 ↔ FE `src/types/` 가 손으로 맞춰진다. 변경 시 양쪽 PR 에서 함께 갱신.
- 시간이 지나면 OpenAPI 스키마에서 타입 자동 생성을 검토 — 별도 이슈로.
