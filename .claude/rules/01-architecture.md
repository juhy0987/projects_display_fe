# 01. 아키텍처

## 시스템 한 줄 요약

React 18 + TypeScript SPA. Vite 로 번들링되며, 같은 저장소의 `be/` (FastAPI) HTTP API 를 소비. 개발 서버는 `/api`·`/static` 을 BE(8000) 로 프록시한다.

## 디렉터리 트리

```
fe/
├── index.html
├── vite.config.ts             # 5173 dev 서버, /api·/static 프록시
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── package.json
├── src/
│   ├── main.tsx               # 진입점 (createRoot + Router)
│   ├── App.tsx                # 라우트 정의
│   ├── api/                   # HTTP 클라이언트 + 리소스별 호출
│   │   ├── client.ts          # 공통 fetch 래퍼 / baseURL / 에러 정규화
│   │   ├── auth.ts            # 인증
│   │   ├── blocks.ts          # 블록 CRUD
│   │   ├── documents.ts       # 문서 CRUD
│   │   ├── upload.ts          # 파일 업로드
│   │   ├── urlEmbed.ts        # URL 임베드 메타데이터
│   │   ├── notionImport.ts    # Notion 임포트
│   │   ├── database.ts        # DB 관련 액션
│   │   └── index.ts           # 통합 export
│   ├── pages/                 # 라우트 단위 페이지
│   │   └── EditorPage.tsx
│   ├── components/            # 재사용 UI / 블록 / 팔레트
│   ├── hooks/                 # 커스텀 훅
│   ├── contexts/              # React Context Provider
│   ├── types/                 # 도메인 / API 응답 타입
│   ├── utils/                 # 순수 헬퍼
│   ├── styles/                # 전역 CSS
│   └── test/                  # Vitest 테스트 + setup
└── static/                    # (Vite 외부) 정적 파일
```

## 레이어 의존성

```
pages → components → hooks → api / utils
        components ↗
        contexts (provider 로 주입)
```

- **pages**: 라우트 한 화면. 데이터 로딩 트리거 + 상태 컨테이너.
- **components**: 한 가지 책임의 UI. 가능하면 props 만으로 구동.
- **hooks**: 재사용 가능한 로직 (예: `useDocument(id)`, `useDebouncedValue`).
- **api**: HTTP 호출 전용. 컴포넌트에서 `fetch` 직접 호출 금지.
- **contexts**: 전역 상태(인증 사용자 / 테마 등). 도메인 데이터는 가급적 hook 으로.
- **types**: BE 응답 / 도메인 타입의 단일 소스.

## 라우팅

- `react-router-dom` v6 사용.
- 라우트 정의는 `App.tsx` 한 곳에 모은다.
- 페이지 컴포넌트는 `src/pages/` 만. `src/components/` 에는 두지 않는다.

## API 호출 흐름

```
Component  ──calls──▶  hook 또는 api/<resource>.ts
                              │
                              ▼
                       api/client.ts (공통 fetch)
                              │
                              ▼
                    Vite dev proxy → BE (FastAPI)
```

- 응답 타입은 `src/types/` 에 명시 — 컴포넌트가 응답 모양에 의존하지 않도록.
- 인증 토큰 / 쿠키 처리는 `api/client.ts` 에서 한 번만.

## 빌드 / 서빙

- `npm run dev` — Vite dev 서버 (HMR, `/api`·`/static` 프록시).
- `npm run build` — `tsc -b && vite build` → `dist/`.
- `npm run preview` — `dist/` 프리뷰 서버.
- 운영 배포 시 `dist/` 를 정적 서버로 호스팅하거나 BE 가 정적 파일로 서빙.

## 안 하기로 한 것 (Non-Goals)

- **Redux / Zustand 등 전역 상태 라이브러리** — 현재 규모에 불필요. Context + hook 으로 충분할 때까지 도입 보류.
- **SSR / Next.js** — Vite SPA 유지.
- **CSS-in-JS 라이브러리** — 일반 CSS / CSS Modules.
- **gRPC / GraphQL** — REST 만.

이 경계를 넘는 변경은 별도 이슈로 합의 후 진행.
