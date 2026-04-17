import type { AuthState } from "@/types";
import { get, post } from "./client";

export function fetchAuthStatus(): Promise<AuthState> {
  return get<AuthState>("/api/auth/status");
}

/** 성공 시 `true`, 실패 시 에러 메시지를 반환한다. */
export async function login(
  username: string,
  password: string,
): Promise<true | string> {
  try {
    await post<{ username: string }>("/api/auth/login", { username, password });
    return true;
  } catch (e) {
    return e instanceof Error ? e.message : "로그인에 실패했습니다.";
  }
}

export function logout(): Promise<void> {
  return post<void>("/api/auth/logout");
}
