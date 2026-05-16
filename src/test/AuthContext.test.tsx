// -- AuthContext 단위 테스트 --------------------------------------------------

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// fetch mock
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function TestConsumer() {
  const { authenticated, username, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{authenticated ? "yes" : "no"}</span>
      <span data-testid="username">{username ?? ""}</span>
      <button onClick={() => login("admin", "pass")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("마운트 시 fetchAuthStatus 를 호출하고 인증 상태를 반영한다", async () => {
    // 초기 상태 조회
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ authenticated: true, username: "admin" })),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("yes");
      expect(screen.getByTestId("username").textContent).toBe("admin");
    });
  });

  it("미인증 상태에서는 authenticated=false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ authenticated: false, username: null })),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("no");
    });
  });

  it("login 성공 시 인증 상태가 갱신된다", async () => {
    // 초기: 미인증
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ authenticated: false })),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("no");
    });

    // login API 응답
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ username: "admin" })),
    });
    // refresh 호출
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ authenticated: true, username: "admin" })),
    });

    await act(async () => {
      await userEvent.click(screen.getByText("login"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("yes");
    });
  });

  it("logout 호출 시 미인증 상태로 전환된다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ authenticated: true, username: "admin" })),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("yes");
    });

    // logout API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(""),
    });

    await act(async () => {
      await userEvent.click(screen.getByText("logout"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("no");
    });
  });
});
