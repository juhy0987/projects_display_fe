# 02. React 컨벤션

## 컴포넌트

- **함수 컴포넌트만 사용.** 클래스 컴포넌트 금지.
- 파일 1개당 컴포넌트 1개 (default export). 같은 파일에 보조 컴포넌트 두는 건 작을 때만.
- 파일명 / 컴포넌트명: `PascalCase.tsx`. 폴더는 `lowercase`.

```tsx
type Props = {
  documentId: string;
  onClose: () => void;
};

export default function BlockPalette({ documentId, onClose }: Props) {
  // ...
}
```

## Props

- `Props` 타입을 컴포넌트 위에 정의. 인터페이스보다 type alias 선호 (일관성).
- Optional props 는 명시적 `?` 표기.
- props 변형이 많아지면 컴포넌트를 분리하는 신호.

## 상태 / 부수효과

- 로컬 상태는 `useState`. 객체 상태는 `useReducer` 도 고려.
- `useEffect` 는 부수효과만 — 데이터 변환은 렌더 또는 `useMemo`.
- effect 의 의존성 배열은 정직하게. 누락 시 lint(react-hooks) 가 잡지만, 의도적으로 비웠다면 코멘트로 이유 명시.
- 데이터 페칭은 가능한 한 hook 으로 분리: `useDocument`, `useBlocks`.

```tsx
function useDocument(id: string) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    documentsApi.get(id)
      .then((d) => { if (!cancelled) setDoc(d); })
      .catch((e) => { if (!cancelled) setError(e); });
    return () => { cancelled = true; };
  }, [id]);

  return { doc, error };
}
```

## Context

- 전역 상태 (인증 사용자, 테마, 토스트) 전용. 도메인 데이터는 props / hook 으로.
- Provider 는 `src/contexts/<Name>Context.tsx` 에 정의 + 같은 파일에서 hook export (`useAuth`).
- Context 값이 자주 바뀌면 분리해서 리렌더 폭증을 막는다.

## 메모이제이션

- 기본은 안 쓴다. 측정 또는 명백한 성능 문제가 보일 때만 `useMemo` / `useCallback` / `React.memo`.
- 거대한 트리(블록 리스트) 렌더는 key 안정성 + 컴포넌트 분리 우선, 그 다음 memo.

## 이벤트 핸들러

- 이름은 `handleX` (내부) / `onX` (props).
- 인라인 화살표 함수 자체는 문제 없음 (메모 필요 시만 회피).

## 조건부 렌더

- 단순: `{condition && <X />}` 또는 `{value ? <X /> : <Y />}`.
- 복잡: early return 으로 컴포넌트 자체를 분기.
- `null` / `false` / `""` 등 falsy 값이 `{value && ...}` 패턴에서 잘못 렌더되지 않도록 주의 (`Boolean(value) && ...`).

## DOM / 보안

- HTML 삽입은 `dangerouslySetInnerHTML` 만 사용 — **반드시 `dompurify` 살균 거친 결과만**.
- 사용자 입력 텍스트는 React 가 자동 escape 하므로 직접 다루지 않는다.
- 외부 URL 은 `target="_blank"` 시 `rel="noopener noreferrer"`.

## 폼

- controlled 컴포넌트 우선.
- 디바운스가 필요한 입력(예: 자동 저장)은 hook 으로 캡슐화 (`useDebouncedValue`).

## 안티패턴

- props drilling 4단계 이상 → context 또는 컴포지션 재설계 신호.
- `useEffect` 안에서 setState → 또 effect 가 발동되는 무한 루프.
- 거대한 컴포넌트 (300+ 라인) → 분리.
- `any` 사용 → 정확한 타입 또는 `unknown` + 좁히기.
