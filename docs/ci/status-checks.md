# Required Status Checks — 단일 소스 (FE)

이 문서는 PR 머지 게이트에 사용되는 Required status check 이름의 **단일 소스(Single Source of Truth)** 입니다.

## 명명 규칙

- 표의 `이름` 열에는 GitHub Ruleset 에 실제 등록된 체크 이름을 그대로 기재한다.
- 리네임 시 문서 / 워크플로 / Ruleset 3곳을 같은 PR 에서 동시 갱신해야 한다.

## 현재 등록된 체크

| 이름 | 워크플로 / Job | 설명 | Required |
|------|---------------|------|----------|
| `Lint` | `ci-quality.yml` / `lint` | `npm run lint` (ESLint) | Yes |
| `Typecheck` | `ci-quality.yml` / `typecheck` | `npm run typecheck` (`tsc --noEmit`) | Yes |
| `Build` | `ci-quality.yml` / `build` | `npm run build` (`tsc -b && vite build`) | Yes |
| `Test` | `ci-quality.yml` / `test` | `npm test` (`vitest run`) | Yes |
| `Commit Lint` | `ci-convention.yml` / `commit-lint` | 커밋 메시지 `[카테고리]:` 포맷 강제 | Yes |
| `PR Title Lint` | `ci-convention.yml` / `pr-title-lint` | PR 타이틀 `[카테고리#이슈번호] 제목` 엄격 강제 (PR only) | Yes |
| `Linked Issue Check` | `ci-convention.yml` / `linked-issue` | PR 에 closing reference 가 최소 1개 연결 (PR only) | Yes |

## 변경 절차

1. 이 문서를 먼저 업데이트한다.
2. 워크플로의 job name 을 문서에 맞춘다.
3. GitHub Ruleset 의 "Require status checks to pass" 목록을 문서에 맞춘다.
4. PR 본문에 변경된 체크 이름을 명시한다.
