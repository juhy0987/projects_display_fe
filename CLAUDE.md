# projects-display FE — AI 협업 가이드

이 파일은 AI(Claude, Copilot 등) 가 본 저장소를 이해하기 위한 **목차이자 진입점**입니다.
모든 정보를 여기에 담지 않고, 필요한 시점에 해당 문서를 참조하도록 설계했습니다.

## 프로젝트 한 줄 요약

노션 스타일 블록 문서 관리 도구의 프론트엔드. React 18 + TypeScript + Vite SPA, 같은 워크스페이스의 `be/` (FastAPI) HTTP API 를 소비.

## 빠른 참조 (목차)

작업 유형별로 필요한 문서만 읽으세요. **전부 읽지 마세요.**

| 작업 | 참조 문서 | 핵심 내용 |
|------|-----------|-----------|
| 아키텍처 이해 | [`.claude/rules/01-architecture.md`](.claude/rules/01-architecture.md) | 페이지 / 컴포넌트 / 훅 / API 레이어 |
| React 컨벤션 | [`.claude/rules/02-react-conventions.md`](.claude/rules/02-react-conventions.md) | 함수 컴포넌트 / 훅 / Context |
| API 호출 | [`.claude/rules/03-api-and-data.md`](.claude/rules/03-api-and-data.md) | `src/api/` 단일 진입점, 에러 정규화 |
| 테스트 작성 | [`.claude/rules/04-testing.md`](.claude/rules/04-testing.md) | Vitest + Testing Library |
| 코드 스타일 | [`.claude/rules/05-code-style.md`](.claude/rules/05-code-style.md) | 2-space, 쌍따옴표, 한국어 커밋 |
| **AI 작업 진행** | [`.claude/rules/06-workflow.md`](.claude/rules/06-workflow.md) | **issue-first / commit-per-TODO / PR 자동 / 권한 최소화** |
| CI / 머지 게이트 | [`docs/ci/conventions.md`](docs/ci/conventions.md) | Required checks, CODEOWNERS, Ruleset |
| Status check 이름 | [`docs/ci/status-checks.md`](docs/ci/status-checks.md) | 단일 소스, 변경 절차 |

## 반드시 지킬 규칙 (CI 가 강제함)

이 규칙을 어기면 CI 가 실패하여 머지가 차단됩니다. "하지 마" 가 아니라 **못 합니다.**

1. **커밋 메시지**: `[FEAT]:` / `[FIX]:` / `[REFAC]:` / `[DOCS]:` / `[CHORE]:` / `[TEST]:` 로 시작. 한국어. **이슈 번호는 커밋에 포함하지 않음**.
2. **PR 타이틀**: `[카테고리#이슈번호] 제목` 엄격 패턴. 카테고리 오타 / 이슈번호 누락 / 소문자 시 머지 차단.
3. **Linked Issue Check**: PR 본문에 `Closes #N` (또는 Development sidebar 의 "Will close this issue when merged") 최소 1개.
4. **Lint**: `npm run lint` 통과.
5. **Typecheck**: `npm run typecheck` 통과.
6. **Build**: `npm run build` 통과.
7. **Test**: `npm test` 통과.

## 빌드 / 테스트 명령어

```bash
npm run dev         # Vite dev 서버 (5173, /api·/static 프록시)
npm run build       # tsc -b && vite build → dist/
npm run preview     # dist/ 정적 프리뷰
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest 1회
npm run test:watch  # Vitest 워치
```

## 디렉터리 구조 (요약)

```
src/
├── main.tsx / App.tsx       # 진입점 + 라우팅
├── api/                     # HTTP 호출 단일 진입점 (컴포넌트에서 fetch 직접 호출 금지)
├── pages/                   # 라우트 단위 페이지
├── components/              # 재사용 UI / 블록 / 팔레트
├── hooks/                   # 커스텀 훅
├── contexts/                # 전역 상태 (인증, 테마 등)
├── types/                   # 도메인 / API 타입
├── utils/                   # 순수 헬퍼
├── styles/                  # 전역 CSS
└── test/                    # Vitest 테스트 + setup

.claude/rules/               # 상세 개발 규칙 (위 목차 참조)
.claude/loop.md              # PR 피드백 처리 cron 명세
.claude/pr-feedback.md       # 신규 PR 자동 리뷰 cron 명세
docs/ci/                     # CI 운영 규약 / status check 단일 소스
scripts/                     # gh-meta / pr-feedback / pr-resolve-comments
```

## 작업 전 체크리스트

- [ ] 관련 규칙 문서를 **목차에서 찾아** 읽었는가? (전체 읽기 금지)
- [ ] 커밋 메시지가 `[카테고리]: 한국어 설명` 형식인가?
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` 를 로컬에서 통과했는가?

## AI 작업 진행 규약

상세는 [`.claude/rules/06-workflow.md`](.claude/rules/06-workflow.md). 핵심 6 규약 요약:

1. **이슈 먼저 생성** — 코드 수정 시작 전 GitHub 이슈 생성. 큰 작업은 메인 + sub-issue 분할.
2. **자율 진행** — 시스템 변경 / destructive 권한 (`push --force`, branch 삭제, `reset --hard`) / 외부 영향 / 모호 영역만 사용자 확인. 그 외는 자율.
3. **Commit-per-TODO** — 논리적 변경 단위 완성 → **즉시 커밋** (다음 단위 시작 전). 작업 끝나고 몰아서 커밋 금지.
4. **PR 자동 생성** — 작업 완료 직후 [`PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) 모든 섹션 채워서 `Closes #N` 포함 PR 생성.
5. **권한 최소화** — 새 permission / 외부 의존성은 작업 완수에 불가피한 경우에만.
6. **Label 부여** — `scripts/gh-meta.sh issue <N>` / `scripts/gh-meta.sh pr <N>` 로 자동 부여. 매핑은 [§6](.claude/rules/06-workflow.md) 표 참조.

## PR 생성 후 자동 동작

`gh pr create` 가 성공한 직후 사용자가 별도 지시하지 않아도 다음을 자동 수행한다:

1. **`@.claude/loop.md` 를 3분 주기 cron 으로 등록** — `CronCreate` 호출
   - schedule: `*/3 * * * *`
   - prompt: `@.claude/loop.md 절차에 따라 PR #N 의 CI 와 코멘트를 점검하고 처리해줘.` (N = 방금 생성한 PR 번호)
   - recurring: `true`
2. 사용자에게 한 줄 보고 — cron job ID 와 본 PR URL 포함

자동 등록 예외:
- 사용자가 명시적으로 "loop 등록하지 마" 라고 지시하면 생략
- draft PR 등 후속 polling 이 무의미한 케이스가 명백하면 사용자에게 묻고 진행

자동 종료는 [`.claude/loop.md`](.claude/loop.md) 의 "자동 중단 (CI 완료 후 2회 연속 무동작 시)" 섹션이 처리한다 — idle 누적 시 cron 본인이 자체 정리.

## 신규 PR 자동 감지 cron

[`.claude/pr-feedback.md`](.claude/pr-feedback.md) 는 저장소 차원에서 **상시 운영되는 cron** 으로, 3분마다 최신 열린 PR 20개를 폴링하여 신규 PR 에 자동 코드 리뷰 피드백을 남긴다. 운영 정책 / 등록 절차는 해당 파일 상단 참조.
