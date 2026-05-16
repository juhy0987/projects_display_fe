#!/usr/bin/env bash
# gh-meta.sh — 이슈 / PR 의 title prefix 를 읽어 Label 을 자동 부여합니다.
#
# 사용법:
#   scripts/gh-meta.sh issue <NUMBER>   # 이슈 label 부여
#   scripts/gh-meta.sh pr    <NUMBER>   # PR label 부여 (닫는 이슈의 label 와 동기화)
#
# prefix → label 매핑 (.claude/rules/06-workflow.md §6):
#   이슈 title:  [FEATURE] / [FIX] / [HOTFIX] / [REFACTOR] / [CHORE] / [DOCS] / [TEST]
#   PR  title:   [FEAT#N]  / [FIX#N]  / [REFAC#N] / [CHORE#N] / [DOCS#N] / [TEST#N]
#                — prefix 부분([A-Z]+) 만 추출해 매핑
#
# Note:
#   원본(IssueTracker)에는 GitHub native Issue Type 부여 기능이 있었으나,
#   본 저장소는 Issue Type 을 사용하지 않으므로 Label 만 부여한다.

set -euo pipefail

usage() {
  echo "Usage: $0 issue <NUMBER> | pr <NUMBER>" >&2
  exit 1
}

# title 의 prefix 를 읽어 적용할 label 문자열(여러 개면 콤마 구분) 을 출력한다.
# 이슈 [FEATURE] 와 PR [FEAT#N] 양쪽을 모두 처리.
resolve_label() {
  local title="$1"
  local prefix
  # [FEATURE], [FEAT#123], [DOCS] 등에서 대괄호 안의 알파벳 부분만 추출
  # POSIX 호환: ] 를 문자 클래스 첫 자리에 놓아 리터럴로 인식
  prefix=$(echo "$title" | sed -En 's/^\[([A-Z]+)[]#].*/\1/p' || true)

  case "$prefix" in
    FEATURE|FEAT)    echo "enhancement" ;;
    BUG|FIX)         echo "bug" ;;
    HOTFIX)          echo "bug,hotfix" ;;
    REFACTOR|REFAC)  echo "refactor" ;;
    CHORE)           echo "chore" ;;
    DOCS)            echo "documentation" ;;
    TEST)            echo "test" ;;
    *)
      echo "ERROR: unrecognized prefix '$prefix' in title: $title" >&2
      exit 1
      ;;
  esac
}

apply_issue_label() {
  local number="$1"
  local title
  title=$(gh issue view "$number" --json title --jq .title)
  echo "Issue #$number: $title"

  local label
  label=$(resolve_label "$title")
  gh issue edit "$number" --add-label "$label"
  echo "  label: $label"
}

apply_pr_label() {
  local number="$1"
  local pr_title
  pr_title=$(gh pr view "$number" --json title --jq .title)
  echo "PR #$number: $pr_title"

  # PR 이 닫는 이슈 번호 추출 — closingIssuesReferences 가 우선
  local closing_issue
  closing_issue=$(gh pr view "$number" \
    --json closingIssuesReferences --jq '.closingIssuesReferences[0].number // empty')

  local label
  if [[ -n "$closing_issue" ]]; then
    echo "  closing issue: #$closing_issue"
    local issue_title
    issue_title=$(gh issue view "$closing_issue" --json title --jq .title)
    label=$(resolve_label "$issue_title")
  else
    # 닫는 이슈가 없으면 PR title prefix 로 직접 추론
    echo "  (no closing issue found, inferring from PR title)"
    label=$(resolve_label "$pr_title")
  fi

  gh pr edit "$number" --add-label "$label"
  echo "  label: $label"
}

[[ $# -lt 2 ]] && usage

SUBCOMMAND="$1"
NUMBER="$2"

case "$SUBCOMMAND" in
  issue) apply_issue_label "$NUMBER" ;;
  pr)    apply_pr_label "$NUMBER" ;;
  *)     usage ;;
esac
