// ── 인증 상태 Context ──────────────────────────────────────────────────────
//
// 기존 auth.js 의 Observer 패턴 싱글턴을 React Context 로 전환한다.
// 앱 전역에서 useAuth() 훅으로 인증 상태를 읽고, login/logout 액션을 호출한다.
// (Ref: https://react.dev/learn/passing-data-deeply-with-context)

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AuthState } from "@/types";
import * as authApi from "@/api/auth";

interface AuthContextValue extends AuthState {
  /** 서버에서 현재 세션 상태를 다시 조회한다. */
  refresh: () => Promise<void>;
  /** 로그인. 성공 시 true, 실패 시 에러 메시지. */
  login: (username: string, password: string) => Promise<true | string>;
  /** 로그아웃. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    username: null,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.fetchAuthStatus();
      setState({
        authenticated: data.authenticated,
        username: data.username ?? null,
      });
    } catch {
      // 네트워크 / 파싱 오류 시 명시적으로 미인증 상태로 강등한다.
      // (이전 state 가 authenticated=true 였더라도 안전 측면에서 false 로 reset)
      setState({ authenticated: false, username: null });
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await authApi.login(username, password);
      if (result === true) await refresh();
      return result;
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({ authenticated: false, username: null });
  }, []);

  // 앱 마운트 시 세션 상태 조회
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refresh, login, logout }),
    [state, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 는 AuthProvider 내부에서 사용해야 합니다.");
  return ctx;
}
