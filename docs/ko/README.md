# projects-display FE

한국어 | (English version TBD)

> 노션 스타일 블록 문서 관리 도구의 프론트엔드 (React + Vite SPA).

## 개요

`projects-display` 의 프론트엔드. 블록 트리 기반 에디터 UI 를 제공하며, `be/` (FastAPI) 의 HTTP API 를 호출합니다.

## 기술 스택

- React 18 + TypeScript (strict)
- Vite 6 (dev / build)
- react-router-dom v6
- dompurify
- Vitest + @testing-library/react

## 빠른 시작

### 사전 요구사항

- Node.js 20+ 권장
- BE (`be/`) 가 8000 포트에서 실행 중이어야 API 호출이 정상 동작

### 설치 / 실행

```bash
npm install
npm run dev
```

기본 포트 `5173`. `/api`, `/static` 요청은 `http://localhost:8000` (BE) 로 자동 프록시.

### 빌드 / 프리뷰

```bash
npm run build      # tsc -b && vite build → dist/
npm run preview    # dist/ 를 정적 서버로 프리뷰
```

### 품질 체크

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # vitest 1회 실행
npm run test:watch # vitest 워치
```

## 디렉터리 구조

```
fe/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/              # HTTP 호출 단일 진입점
│   ├── pages/            # 라우트 단위 페이지
│   ├── components/       # 재사용 UI
│   ├── hooks/            # 커스텀 훅
│   ├── contexts/         # React Context
│   ├── types/            # 도메인 / API 타입
│   ├── utils/            # 순수 헬퍼
│   ├── styles/           # 전역 CSS
│   └── test/             # Vitest 테스트 + setup
└── docs/
    ├── architecture/
    ├── ci/
    └── ko/
```

자세한 구조는 [`docs/architecture/README.md`](../architecture/README.md) 참고.

## 핵심 개념

### API 호출 단일 진입점

모든 HTTP 호출은 `src/api/` 를 거칩니다. 컴포넌트에서 `fetch` 직접 호출 금지.

```
컴포넌트 → hook → src/api/<resource>.ts → src/api/client.ts → BE
```

### 레이어 분리

- `pages` 는 라우트 한 화면.
- `components` 는 재사용 가능한 UI 조각.
- `hooks` 는 재사용 가능한 로직 (데이터 페칭, 디바운스 등).
- `contexts` 는 전역 상태 (인증 / 테마 / 토스트).

## 배포

본 저장소는 GitHub Pages 로 자동 배포됩니다.

- **배포 URL**: `https://juhy0987.github.io/projects_display_fe/`
- **트리거**: `main` 브랜치 push (`.github/workflows/deploy-pages.yml`)
- **수동 재배포**: Actions 탭 → "Deploy to GitHub Pages" → `Run workflow`
- **소스 모드**: GitHub Actions (legacy "Deploy from a branch" 미사용)
- **라우터**: `HashRouter` — `/#/docs/<id>` 형태. 새로고침 / 직접 진입 시에도 404 없이 동작.

### BE API 도메인 주입

워크플로는 빌드 시 `VITE_API_BASE_URL` 을 Repository Variables 에서 읽어 주입합니다.

1. Settings → Secrets and variables → Actions → **Variables** 탭
2. `New repository variable` → 이름 `VITE_API_BASE_URL` / 값: BE 배포 도메인 (예: `https://api.example.com`)
3. 새 main push 또는 수동 `workflow_dispatch` 로 재빌드

미설정 시 `src/api/client.ts` 의 `BASE = ""` 가 적용되어 상대 경로 호출 — Pages 도메인에 BE 가 없으므로 API 호출은 실패하지만 정적 화면(라우팅 / 레이아웃)은 정상 동작.

### 최초 1회 설정

- Settings → Pages → **Source = "GitHub Actions"** 로 전환 (이후 워크플로가 자동 처리)
- 또는 CLI:
  - 최초 활성화: `gh api -X POST repos/<owner>/<repo>/pages -F build_type=workflow`
  - 기존 legacy(branch) → workflow 로 전환: `gh api -X PUT repos/<owner>/<repo>/pages -F build_type=workflow`

## 개발 규칙

- AI 협업 / 코드 규칙: [`.claude/rules/`](../../.claude/rules/) — 6개 문서.
- CI 규약: [`docs/ci/conventions.md`](../ci/conventions.md), [`docs/ci/status-checks.md`](../ci/status-checks.md).

## 기여

- 이슈 먼저 (issue-first) → branch → commit → PR
- 커밋 메시지: `[FEAT|FIX|REFAC|DOCS|CHORE|TEST]: 한국어 변경 의도`
- 브랜치: `{카테고리}/#{이슈번호}/{요약}`
- PR 제목: `[카테고리#이슈번호] 한국어 제목`

자세한 워크플로는 [`.claude/rules/06-workflow.md`](../../.claude/rules/06-workflow.md) 참고.
