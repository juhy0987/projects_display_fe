# projects-display FE — Development Rules

`projects-display` 프론트엔드(React 18 + TypeScript + Vite) 개발 시 따라야 하는 규칙 모음입니다.

## 구성

- [01-architecture.md](01-architecture.md) — 페이지 / 컴포넌트 / 훅 / API 레이어 구조
- [02-react-conventions.md](02-react-conventions.md) — 컴포넌트·훅·상태 관리 규약
- [03-api-and-data.md](03-api-and-data.md) — `src/api/` 호출 경로, fetch / 에러 / 인증 처리
- [04-testing.md](04-testing.md) — Vitest + Testing Library 사용 패턴
- [05-code-style.md](05-code-style.md) — TypeScript 스타일, 네이밍, 커밋·브랜치 규약
- [06-workflow.md](06-workflow.md) — AI 협업 워크플로 (issue-first, commit-per-TODO, PR 자동화)

## 핵심 원칙

1. **단순함 우선** — Notion 스타일 에디터 수준의 SPA. 과도한 상태 라이브러리 도입 금지.
2. **레이어 분리** — UI 컴포넌트는 API 를 직접 호출하지 않고 `src/api/` 또는 hook 을 통한다.
3. **타입 안전성** — `any` 금지, 응답 타입은 `src/types/` 에 정의.
4. **테스트 동반** — 변경되는 핵심 동작에는 회귀 테스트 추가.

## 빠른 시작

새 페이지 / 기능을 추가할 때:

1. [01-architecture.md](01-architecture.md) 에서 신규 코드가 어디에 들어가는지 확인
2. [02-react-conventions.md](02-react-conventions.md) 의 컴포넌트 규약 적용
3. API 호출은 [03-api-and-data.md](03-api-and-data.md) 의 `src/api/` 경로 사용
4. [04-testing.md](04-testing.md) 에 따라 테스트 추가
5. [05-code-style.md](05-code-style.md) 의 커밋·브랜치 규약으로 PR

새 블록 타입을 UI 에 노출할 때:

1. `src/types/` 에 타입 정의 추가 (BE 모델과 일치)
2. `src/components/` 에 블록 렌더러 + 편집기 컴포넌트
3. 슬래시 커맨드 팔레트가 있다면 거기에 등록
4. `src/api/blocks.ts` 에 필요한 호출이 이미 있는지 확인 (대개 재사용 가능)
5. `src/test/` 에 회귀 테스트 추가
