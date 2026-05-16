# 04. 테스트 (Vitest + Testing Library)

## 도구

- `vitest` — 테스트 러너 (`vitest.config.ts`).
- `@testing-library/react` + `@testing-library/user-event` — 컴포넌트 동작 테스트.
- `@testing-library/jest-dom` — DOM 매처.
- `jsdom` — 브라우저 환경 시뮬레이션.

## 위치

- 테스트는 `src/test/` 또는 컴포넌트와 같은 디렉터리의 `*.test.tsx`.
- setup 파일은 `src/test/setup.ts` (vitest config 의 `setupFiles`).

## 작성 규칙

- **사용자 관점** 으로 테스트. 구현 세부보다 "사용자가 무엇을 보고/하고/얻는가".
- `screen.getByRole` / `getByText` 우선. `data-testid` 는 최후 수단.
- `userEvent` 를 `fireEvent` 보다 우선 — 실제 사용자 인터랙션에 가깝다.

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("새 블록을 추가하면 목록에 표시된다", async () => {
  render(<EditorPage documentId="doc-1" />);

  await userEvent.click(screen.getByRole("button", { name: /블록 추가/ }));
  await userEvent.click(screen.getByRole("menuitem", { name: /텍스트/ }));

  expect(await screen.findByPlaceholderText("내용 입력")).toBeInTheDocument();
});
```

## 네트워크 모킹

- API 호출은 `vi.mock("@/api/...")` 또는 MSW 로 가로챈다.
- 실제 네트워크 호출은 테스트에서 금지 — flaky / 느림.
- 모킹은 가능한 한 `src/api/<resource>.ts` 레이어에서. 컴포넌트 내부 `fetch` 모킹은 의존성이 새는 신호.

## 커스텀 훅 테스트

- `@testing-library/react` 의 `renderHook` 사용.
- 의존성 (context / API) 은 wrapper 로 주입.

## 비동기

- 항상 `await screen.findBy*` / `await userEvent.*` / `await waitFor(...)`.
- `act()` 경고가 뜨면 비동기 처리를 놓친 것 — 무시하지 않는다.

## 커버리지

- 새 컴포넌트 / hook 은 happy path + 주요 에러 케이스 1~2 개.
- 전체 임계값 강제는 없지만, CI 의 `Test` 잡은 통과해야 머지.
- 회귀 테스트: 버그 수정 PR 은 해당 버그를 재현하는 테스트 동반.

## 빠른 명령

```bash
npm test                  # 1회 실행
npm run test:watch        # 워치 모드
npm test -- -t "create"   # 이름 필터
```

## 안티패턴

- 구현 디테일 (state 이름 / private 메서드) 테스트 → 리팩터링 시 깨진다.
- 스냅샷 남발 → 의미 없는 diff. UI 핵심에만 제한적으로.
- 시간 / 랜덤 의존 → flaky. `vi.useFakeTimers()` 또는 의존성 주입으로 격리.
- 한 테스트에 모든 시나리오 → 실패 위치 파악 어려움. 시나리오 단위 분할.
