#!/usr/bin/env bash
#
# loop-state.sh
#
# .claude/loop.md 의 회차 분류(active / pending / idle) 에 따라 PR 별 상태 파일을 갱신한다.
# 인라인 shell 로 매번 jq heredoc 을 쓰지 않도록 추출.
#
# Usage:
#   scripts/loop-state.sh <PR번호> <category>
#     category: active | pending | idle
#
# 출력:
#   stdout: 갱신 후 idle_streak 값
#
# Exit code:
#   0  → 계속 진행 (idle_streak < THRESHOLD)
#   10 → 자동 종료 임계값 도달 (idle_streak ≥ THRESHOLD) — 호출자가 cron 을 정리해야 함
#
# 상태 파일:
#   /tmp/projects-display-fe-loop-state.json
#   { "<PR번호>": { "idle_streak": N, "last_run_at": "ISO8601" } }

set -euo pipefail

STATE_FILE="/tmp/projects-display-fe-loop-state.json"
THRESHOLD=2

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <PR번호> <active|pending|idle>" >&2
  exit 1
fi

pr=$1
category=$2

# 기존 PR 항목 로드 (없으면 idle_streak=0)
if [[ -f "$STATE_FILE" ]]; then
  cur=$(jq --arg pr "$pr" '.[$pr] // {idle_streak: 0, last_run_at: ""}' "$STATE_FILE")
else
  cur='{"idle_streak": 0, "last_run_at": ""}'
fi
streak=$(echo "$cur" | jq -r '.idle_streak // 0')

case "$category" in
  active)  streak=0 ;;                          # 의미 있는 작업 발생 → reset
  pending) ;;                                   # CI 진행 중 → 카운터 동결
  idle)    streak=$((streak + 1)) ;;            # 무동작 → +1
  *)
    echo "ERROR: category must be active|pending|idle" >&2
    exit 1
    ;;
esac

now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
tmp=$(mktemp)
if [[ -f "$STATE_FILE" ]]; then
  jq --arg pr "$pr" --argjson streak "$streak" --arg now "$now" \
    '.[$pr] = {idle_streak: $streak, last_run_at: $now}' "$STATE_FILE" > "$tmp"
else
  jq -n --arg pr "$pr" --argjson streak "$streak" --arg now "$now" \
    '{($pr): {idle_streak: $streak, last_run_at: $now}}' > "$tmp"
fi
mv "$tmp" "$STATE_FILE"

echo "$streak"
[[ "$streak" -ge "$THRESHOLD" ]] && exit 10 || exit 0
