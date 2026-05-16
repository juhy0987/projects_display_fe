# PR 피드백 순환 처리 (FE)

## 대상
현재 브랜치에 연결된 열린 PR의 CI 상태와 리뷰 코멘트를 처리한다.

## 초기 cron 등록

본 명세는 Claude Code 의 `CronCreate` 로 3분 주기 cron 으로 등록되어 동작한다.
PR 생성 직후 [`CLAUDE.md`](../CLAUDE.md#pr-생성-후-자동-동작) 의 자동 동작이 다음을 호출한다:

```
CronCreate({
  schedule: "*/3 * * * *",
  prompt: "@.claude/loop.md 절차에 따라 PR #<번호> 의 CI 와 코멘트를 점검하고 처리해줘.",
  recurring: true
})
```

- 수동 등록이 필요한 경우(예: PR 생성 흐름 외부에서 시작)에도 같은 형식 사용
- 동일 PR 번호에 대한 cron 이 이미 활성이면 추가 등록을 생략 (`CronList` 로 사전 확인)
- 자동 종료는 본 명세 하단 "자동 중단" 섹션이 처리

## 절차
1. `gh pr view --json number,url,statusCheckRollup` 로 현재 PR 과 CI rollup 을 함께 조회
2. **CI 실패 확인 (코멘트 처리보다 우선)**
   - `statusCheckRollup` 항목 중 `conclusion == "FAILURE"` 인 GitHub Actions check_run 이 있으면, 실패 job 의 로그를 수집해 우선 복구
     - 실패 job 식별: `gh pr checks <PR번호>`
     - 로그 수집: `gh run view <runId> --log-failed`
     - 원인 분석 → 코드/설정 수정 → 커밋 → 푸시
   - `IN_PROGRESS` / `QUEUED` / `PENDING` 만 있고 FAILURE 가 없으면 코멘트 처리는 계속 진행
   - 모두 `SUCCESS` / `NEUTRAL` / `SKIPPED` 면 정상 진행
3. `gh api repos/{owner}/{repo}/pulls/{number}/comments` 로 리뷰 코멘트 수집
4. 👀 리액션이 달린 코멘트는 처리 완료로 건너뛴다
5. 새 코멘트가 없으면 "새 피드백 없음" 출력 후 종료

## 선별 기준
1. 비즈니스 로직 오류 또는 버그 가능성
2. 보안 (XSS, dangerouslySetInnerHTML, 비밀 노출) 및 성능 (불필요 리렌더, 메모리 누수)
3. 아키텍처 일관성 (페이지/컴포넌트/훅/API 경계 위반)

단순 스타일·오타 지적은 제외한다.

## 처리 방식
- 의도가 명확한 피드백 → 코드 수정 + 커밋 + 푸시
- 의도가 불명확한 피드백 → PR 에 질문 코멘트, 질문 주체를 `@` 로 멘션
- 처리 완료한 코멘트에 👀 리액션 추가, Resolve conversation
  - **일괄 처리는 헬퍼 스크립트 사용** — 1회 호출로 reaction + resolve 모두 수행:
    ```bash
    scripts/pr-resolve-comments.sh <PR번호> <comment_id1> [<comment_id2> ...]
    ```
    예: `scripts/pr-resolve-comments.sh 2 3097643287 3097643293 3097643295`
    각 회차에서 처리한 모든 comment_id 를 한 번에 전달 — 개별 `gh api` 호출 회피.

## 커밋 규칙
- 메시지 형식
  - 리뷰 피드백 반영: `[FIX]: 피드백 반영, {변경 요약}`
  - CI 실패 복구: `[FIX]: CI 복구, {실패 job 이름} - {변경 요약}`
- 한국어로 작성

## 자동 중단 (CI 완료 후 2회 연속 무동작 시)

상태 파일: `/tmp/projects-display-fe-loop-state.json`

스키마:
```json
{
  "<PR번호>": {
    "idle_streak": 0,
    "last_run_at": "2026-05-16T00:00:00Z"
  }
}
```

### 회차 분류

- **active**: CI 복구 / 피드백 반영 / 새 질문 / 신규 코멘트에 👀 — `idle_streak = 0`
- **pending**: CI 진행 중 + 신규 코멘트 없음 — 카운터 동결
- **idle**: "새 피드백 없음" — `idle_streak += 1`

판단 모호 시 active.

### 카운터 갱신 + 종료

상태 파일 read / write 와 분류 적용은 헬퍼 스크립트로 일원화한다 — **인라인 jq heredoc 금지**:

```bash
scripts/loop-state.sh <PR번호> <active|pending|idle>
```

- stdout 으로 갱신 후 `idle_streak` 값 출력
- exit code `0` → 계속 진행
- exit code `10` → 자동 종료 임계값(`idle_streak ≥ 2`) 도달 — 호출자가 다음을 수행:
  1. `CronList` 로 본 PR 번호가 포함된 loop cron 식별
  2. 매칭 cron ID 로 `CronDelete`
  3. 사용자에게 한 줄 알림: `"CI 완료 후 <streak>회 연속 무동작으로 PR #<N> loop 자동 종료 (cron <id>)"`
