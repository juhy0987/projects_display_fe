# GitHub Copilot / AI 협업 지침 (FE)

이 문서는 GitHub Copilot · Claude · Codex 등 AI 협업 도구가 본 저장소(`fe/`) 에서 코드를 작성할 때 따라야 할 **단일 진입 지침** 입니다. 자세한 영역별 규칙은 [`.claude/rules/`](../.claude/rules/) 의 6개 문서에 분리되어 있습니다.

## 프로젝트 한 줄

React 18 + TypeScript SPA. Vite 로 번들링되며, 같은 저장소 트리 아래쪽의 `be/` (FastAPI) HTTP API 를 소비합니다.

## 기술 스택

- React 18 + TypeScript (strict)
- Vite 6
- react-router-dom v6
- dompurify
- Vitest + @testing-library/react

## 디렉터리 약도

```
fe/
├── index.html
├── vite.config.ts             # dev 5173 + /api·/static 프록시 → BE:8000
├── src/
│   ├── main.tsx               # 진입점
│   ├── App.tsx                # 라우트 정의
│   ├── api/                   # HTTP 호출 단일 진입점
│   ├── pages/                 # 라우트 단위 페이지
│   ├── components/            # 재사용 UI
│   ├── hooks/                 # 커스텀 훅
│   ├── contexts/              # React Context
│   ├── types/                 # 도메인 / API 타입
│   ├── utils/                 # 순수 헬퍼
│   ├── styles/                # 전역 CSS
│   └── test/                  # Vitest 테스트 + setup
└── dist/                      # 빌드 산출물
```

자세한 아키텍처는 [`docs/architecture/README.md`](../docs/architecture/README.md).

## 작성 원칙

1. **API 호출 단일 진입점** — 모든 HTTP 호출은 `src/api/` 를 거친다. 컴포넌트에서 `fetch` 직접 호출 금지.
2. **레이어 경계 유지** — `pages → components → hooks → api / utils`. 역방향 의존 금지.
3. **타입 안전성** — `strict: true` 전제. `any` 금지, 정 필요하면 `unknown` + 좁히기.
4. **테스트 동반** — 컴포넌트 / 훅 변경 시 Vitest 케이스 함께.
5. **보안** — HTML 삽입은 반드시 `dompurify` 살균. 외부 링크는 `rel="noopener noreferrer"`.

## 코드 스타일 (요약)

- 들여쓰기: **공백 2칸**
- 문자열: **쌍따옴표**
- 세미콜론: 사용
- 줄 길이: 100자 권장
- 네이밍: 변수/함수 `camelCase`, 컴포넌트/타입 `PascalCase`, 훅 `useXxx`
- 주석: WHY 만, 코드가 명확하면 생략
- ESLint 설정이 단일 소스 — 충돌 시 ESLint 가 우선
- 자세한 규칙: [`.claude/rules/05-code-style.md`](../.claude/rules/05-code-style.md)

## React 컨벤션 (요약)

- **함수 컴포넌트만 사용** — 클래스 컴포넌트 금지
- `Props` 타입을 컴포넌트 위에 정의 (type alias 선호)
- 로컬 상태는 `useState` / `useReducer`. 전역은 Context
- `useEffect` 는 부수효과만 — 데이터 변환은 렌더 또는 `useMemo`
- 메모이제이션은 측정 또는 명백한 성능 문제가 보일 때만
- 자세한 규칙: [`.claude/rules/02-react-conventions.md`](../.claude/rules/02-react-conventions.md)

## API 호출 / 데이터 흐름

```
Component → hook → src/api/<resource>.ts → src/api/client.ts → BE
```

- `src/api/client.ts` 에 공통 baseURL / 인증 / 에러 정규화
- 응답 타입은 `src/types/` 에 정의
- 자세한 규칙: [`.claude/rules/03-api-and-data.md`](../.claude/rules/03-api-and-data.md)

## 테스트

- `vitest` + `@testing-library/react` + `@testing-library/user-event`
- 사용자 관점으로 작성 — `getByRole` / `getByText` 우선
- API 호출은 `vi.mock("@/api/...")` 또는 MSW 로 가로채기
- 실제 네트워크 호출 금지
- 자세한 규칙: [`.claude/rules/04-testing.md`](../.claude/rules/04-testing.md)

## Git 워크플로

### 커밋

형식: `[카테고리]: 한국어 변경 의도`

- 카테고리: `FEAT` / `FIX` / `REFAC` / `DOCS` / `CHORE` / `TEST`
- **이슈 번호는 커밋 메시지에 포함하지 않는다** — PR 제목/본문에만 사용
- 논리적 변경 단위(TODO) 마다 즉시 커밋. 작업 끝나고 몰아서 커밋 금지

### 브랜치

`{카테고리}/#{이슈번호}/{핵심-변경-요약}` (소문자, 하이픈)
예: `feature/#2/slash-command`, `fix/#9/image-upload-mime`

### PR 제목

`[카테고리#이슈번호] 한국어 제목` (CI 강제)
예: `[FEAT#2] 슬래시 커맨드 블록 추가 팔레트 구현`

### PR 본문

[`PULL_REQUEST_TEMPLATE.md`](PULL_REQUEST_TEMPLATE.md) 의 모든 섹션 작성. `Closes #<이슈번호>` 필수.

## 자율 진행 / 사용자 확인 (AI 협업 한정)

자세한 규칙: [`.claude/rules/06-workflow.md`](../.claude/rules/06-workflow.md).

**자율 진행 (승인 불필요)**: 코드 / 테스트 / 의존성 변경, branch / commit / push, PR 본문 작성, `npm run lint`·`typecheck`·`test`·`build` 실행.

**사용자 확인 필수**: 시스템 변경 (`apt-get`, `sudo`), destructive git (`push --force`, branch 삭제, `reset --hard`), 외부 영향 (PR merge, issue close, 배포), 모호한 작업 범위.

## CI / 머지 게이트

PR 머지 게이트는 [`docs/ci/status-checks.md`](../docs/ci/status-checks.md) 가 단일 소스.

필수 통과: `Commit Lint` · `PR Title Lint` · `Linked Issue Check` · `Lint` · `Typecheck` · `Build` · `Test`.

## 안 하기로 한 것 (Non-Goals)

- Redux / Zustand 등 전역 상태 라이브러리
- SSR / Next.js
- CSS-in-JS 라이브러리
- gRPC / GraphQL

이 경계를 넘는 변경은 별도 이슈로 합의 후 진행.
