# projects-display FE — Architecture Reference

`fe/` 프론트엔드의 모듈 / 연결 관계를 프로젝트 디렉터리 트리와 같은 구조로 정리한 참조 문서입니다.

상위 규칙은 [.claude/rules/01-architecture.md](../../.claude/rules/01-architecture.md) 가 정의합니다.

## 시스템 한 줄 요약

React 18 + TypeScript SPA. Vite 로 번들링되며, `be/` (FastAPI) HTTP API 를 소비.

## 디렉터리 트리 (FE)

```
fe/
├── index.html                 # Vite 엔트리
├── vite.config.ts             # dev 서버 5173 + /api·/static 프록시 → BE:8000
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── package.json
├── src/
│   ├── main.tsx               # createRoot + Router 설정
│   ├── App.tsx                # 라우트 정의
│   ├── api/                   # HTTP 호출 단일 진입점
│   │   ├── client.ts          # 공통 fetch 래퍼
│   │   ├── auth.ts
│   │   ├── blocks.ts
│   │   ├── documents.ts
│   │   ├── upload.ts
│   │   ├── urlEmbed.ts
│   │   ├── notionImport.ts
│   │   ├── database.ts
│   │   └── index.ts
│   ├── pages/                 # 라우트 단위 페이지
│   │   └── EditorPage.tsx
│   ├── components/            # 재사용 UI / 블록 / 팔레트
│   ├── hooks/                 # 커스텀 훅
│   ├── contexts/              # React Context Provider
│   ├── types/                 # 도메인 / API 응답 타입
│   ├── utils/                 # 순수 헬퍼
│   ├── styles/                # 전역 CSS
│   └── test/                  # Vitest 테스트 + setup
└── dist/                      # 빌드 산출물
```

## 데이터 흐름 — 한 장 요약

```
User Action
     │
     ▼
┌────────────────────────────┐
│ Page / Component           │
│ src/pages, src/components  │
└────────────┬───────────────┘
             │ call (props / hook)
             ▼
┌────────────────────────────┐
│ Hook (선택)                │
│ src/hooks/use*.ts          │   ─ effect / 상태 / 캐시
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ API Module                 │
│ src/api/<resource>.ts      │   ─ 함수형 호출 시그니처
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ HTTP Client                │
│ src/api/client.ts          │   ─ 인증 / 에러 정규화 / baseURL
└────────────┬───────────────┘
             │ fetch
             ▼
       Vite dev proxy
             │  /api, /static
             ▼
       BE (FastAPI)
```

## 외부 의존성

| 외부 | 어디서 | 용도 |
|------|--------|------|
| BE (`be/`) | `src/api/client.ts` | HTTP API 호출 |
| `react-router-dom` v6 | `src/App.tsx` | 라우팅 |
| `dompurify` | HTML 렌더 컴포넌트 | XSS 살균 |

## 환경 변수

- `.env` / `.env.example` 참고. Vite 는 `VITE_` 접두 변수만 클라이언트에 노출.
- 비밀은 BE 만 들고 있게 하고, FE 환경 변수에는 두지 않는다.

## 읽는 순서 (권장)

1. `src/main.tsx` → `src/App.tsx` — 진입과 라우팅
2. `src/api/client.ts` — 모든 HTTP 호출의 공통 처리
3. `src/api/blocks.ts` / `src/api/documents.ts` — 리소스별 호출 패턴
4. `src/pages/EditorPage.tsx` — 페이지 컴포넌트 구성
5. `src/test/setup.ts` 또는 `src/test/` 의 첫 테스트 — 테스트 구성

## 문서 작성 규약

- **언어**: 한국어 본문 + 영어 기술용어
- **링크**: 마크다운 파일 위치 기준 상대경로
- **다이어그램**: ASCII (Mermaid 미사용)
- **갱신**: 디렉터리 구조가 바뀌면 이 문서를 같은 PR 에서 함께 갱신
