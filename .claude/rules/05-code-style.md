# 05. 코드 스타일 (TypeScript / React)

## TypeScript

- `strict: true` 를 전제로 작성. `any` 금지 — 정 필요하면 `unknown` + 좁히기.
- 공개 함수 / 컴포넌트 props 는 타입 명시. 로컬 변수는 추론에 맡겨도 됨.
- 인터페이스보다 `type` alias 선호 (일관성). 단, `extends`/declaration merging 이 필요하면 interface.
- `import type` 을 활용해 런타임 import 와 분리.

## 들여쓰기 / 포맷

- 들여쓰기: **공백 2칸**.
- 문자열: **쌍따옴표**.
- 세미콜론: 사용.
- 줄 길이: 100자 권장.
- ESLint 설정(`eslint.config.js`) 가 단일 소스 — 충돌 시 ESLint 가 우선.

## 네이밍

| 종류 | 규칙 | 예 |
|------|------|-----|
| 변수 / 함수 | `camelCase` | `documentId`, `loadBlocks` |
| 컴포넌트 / 타입 | `PascalCase` | `BlockPalette`, `type Document` |
| 상수 (모듈 스코프) | `UPPER_SNAKE_CASE` 또는 `camelCase` | `DEFAULT_PAGE_SIZE` |
| 훅 | `useXxx` | `useDocument`, `useDebouncedValue` |
| 파일 | 컴포넌트는 `PascalCase.tsx`, 그 외 `camelCase.ts` | `EditorPage.tsx`, `client.ts` |

## 주석 / JSDoc

- 코드가 명확하면 주석 금지.
- "WHAT" 이 아니라 "WHY" — 비자명한 의도 / 제약 / 워크어라운드만.
- 공개 함수에는 한 줄 JSDoc 권장 (꼭 필요할 때만).

## 모듈 / 임포트 순서

```ts
// 1. 표준 / 외부 라이브러리
import { useState } from "react";
import { useParams } from "react-router-dom";

// 2. 절대 경로 (@ alias)
import { documentsApi } from "@/api";
import type { Document } from "@/types/documents";

// 3. 상대 경로
import BlockPalette from "./BlockPalette";
```

- 가능하면 `@/` 절대 alias 사용 (vite.config 에 설정됨).
- 상대 경로는 같은 폴더 / 상위 한 단계까지만.

## 안티패턴

- **`any`, `as` 캐스팅 남발** — 타입 시스템 우회. 필요 시 좁히기로 풀어낸다.
- **거대한 컴포넌트** (300+ 라인) — 분리 신호.
- **prop drilling 4단계 이상** — context 또는 컴포지션 재설계.
- **죽은 코드 / 주석 처리된 코드** — 즉시 삭제.
- **magic number / string** — 의미 있는 상수로.

## 커밋 메시지

형식: `[카테고리]: 한국어 변경 의도`

| 카테고리 | 의미 |
|----------|------|
| `FEAT` | 새 기능 |
| `FIX` | 버그 수정 |
| `REFAC` | 리팩터링 |
| `DOCS` | 문서 / 주석 |
| `CHORE` | 빌드 / 설정 / 의존성 |
| `TEST` | 테스트 추가 / 수정 |

- **이슈 번호는 커밋 메시지에 포함하지 않는다** (PR 제목/본문에만 사용)

예:
```
[FEAT]: 슬래시 커맨드 팔레트 키보드 네비게이션 추가
[FIX]: 이미지 블록 업로드 후 미리보기 깜빡임 보정
[REFAC]: api/blocks.ts 응답 변환 헬퍼 분리
[DOCS]: README 에 dev 서버 프록시 설명 추가
```

## 브랜치 이름

`{카테고리}/#{이슈번호}/{핵심-변경-요약}`

- 카테고리: `feature` / `fix` / `refactor` / `docs` / `chore` / `test`
- 영문 소문자, 단어 구분은 하이픈, 30자 이내
- 예: `feature/#2/slash-command`, `fix/#9/image-upload-mime`

## PR 제목

`[카테고리#이슈번호] 한국어 제목`

- 카테고리: `FEAT` / `FIX` / `REFAC` / `DOCS` / `CHORE` / `TEST`
- 예: `[FEAT#2] 슬래시 커맨드 블록 추가 팔레트 구현`

CI 의 `PR Title Lint` 가 강제한다.

## 린트 / 타입체크

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # vitest
```

CI 가 위 명령들을 실행한다. 로컬에서 푸시 전에 통과 확인.
