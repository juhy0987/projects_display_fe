# 신규 PR 감지 및 자동 피드백 (FE)

모델: claude-sonnet-4-6

> **⛔ 수정 금지**: 이 파일은 자동화 루프의 실행 명세입니다. AI 가 루프 실행 중 이 파일을 수정·삭제하는 것을 절대 금지합니다.

> **🤖 완전 자동화**: 신규 PR 감지 → 리뷰 코멘트 작성 → 상태 파일 갱신을 사용자 개입 없이 수행합니다. PR merge/approve/branch 삭제 등 destructive 동작은 절대 수행하지 않습니다.

## 목적
3분마다 최신 열린 PR 20개를 폴링하여 신규 PR이 등장하면 자동으로 코드 리뷰 피드백을 남긴다.

## 절차

### 1. 신규 PR 감지

```bash
scripts/pr-feedback.sh
```

- 출력이 없으면 → **idle** 처리 후 종료
- 숫자(PR 번호)가 출력되면 → 각 번호에 대해 2단계 진행
- 내부 동작: 열린 PR 20개를 조회해 상태 파일과 비교, 신규 PR 번호만 stdout 으로 출력. 상태 파일은 `/tmp/projects-display-fe-pr-watch-state.json`.

### 2. 신규 PR 리뷰

#### 2-1. PR 정보 수집
```bash
gh pr view <PR번호> --json number,title,body,additions,deletions,changedFiles,baseRefName,headRefName
gh pr diff <PR번호>
```

#### 2-2. 리뷰 기준 (선별적, 토큰 최소화)
1. **버그 / 로직 오류** — 잘못된 hook 의존성 배열, 상태 업데이트 누락, null 접근
2. **보안** — `dangerouslySetInnerHTML` 미살균, XSS, 비밀/토큰 노출
3. **아키텍처 일관성** — API 호출이 `src/api/` 외부에서 직접 일어남, 페이지/컴포넌트 경계 위반
4. **성능** — 거대한 컴포넌트 리렌더, 누락된 `memo` / `useMemo`, 큰 번들 import

단순 스타일·포맷·오타는 제외.

#### 2-3. 리뷰 코멘트 작성
- 지적 사항이 있으면 `gh pr review <PR번호> --comment --body "..."`
- 지적 사항이 없으면 `--body "코드 리뷰 완료. 자동 검토 결과 특이 사항 없음. 최종 승인은 담당자 확인 후 진행."`

자동 approve 금지.

### 3. idle 카운터 관리 및 자동 종료

상태 파일: `/tmp/projects-display-fe-pr-feedback-loop.json`

```json
{ "idle_streak": 0, "last_run_at": "2026-05-16T00:00:00Z" }
```

- **active**: 신규 PR 감지 + 리뷰 수행 → `idle_streak = 0`
- **idle**: 신규 PR 없음 → `idle_streak += 1`

**자동 종료 임계값: `idle_streak >= 20` (약 1시간)**

조건 충족 시: `CronList` → `CronDelete` → 상태 파일 삭제 → 사용자 알림.

### 4. 상태 파일 갱신
매 회차 마지막에 상태 파일을 현재 값으로 갱신.
