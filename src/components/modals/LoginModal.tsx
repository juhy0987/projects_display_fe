// ── 로그인 모달 ──────────────────────────────────────────────────────────────
//
// 기존 loginModal.js 의 DOM 직접 조작을 선언형 React 컴포넌트로 전환한다.
// Escape 키·오버레이 클릭으로 닫기, 폼 유효성 검증, 에러 피드백을 동일하게 제공한다.

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // 모달 열릴 때 포커스 + 상태 초기화
  useEffect(() => {
    if (open) {
      setError("");
      // DOM 업데이트 이후 포커스를 잡기 위해 rAF 사용
      requestAnimationFrame(() => usernameRef.current?.focus());
    }
  }, [open]);

  // Escape 키로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const username = usernameRef.current?.value.trim() ?? "";
      const password = passwordRef.current?.value ?? "";

      if (!username || !password) {
        setError("아이디와 비밀번호를 입력해 주세요.");
        return;
      }

      const result = await login(username, password);
      if (result === true) {
        onClose();
      } else {
        setError(result);
        if (passwordRef.current) {
          passwordRef.current.value = "";
          passwordRef.current.focus();
        }
      }
    },
    [login, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="login-modal-overlay is-open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="login-modal" role="dialog" aria-label="관리자 로그인">
        <h2 className="login-modal-title">관리자 로그인</h2>

        {error && <p className="login-modal-error">{error}</p>}

        <form className="login-modal-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-field-label" htmlFor="login-username">
              아이디
            </label>
            <input
              ref={usernameRef}
              type="text"
              id="login-username"
              name="username"
              className="login-field-input"
              required
              autoComplete="username"
            />
          </div>
          <div className="login-field">
            <label className="login-field-label" htmlFor="login-password">
              비밀번호
            </label>
            <input
              ref={passwordRef}
              type="password"
              id="login-password"
              name="password"
              className="login-field-input"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-modal-submit">
            로그인
          </button>
        </form>

        <button
          type="button"
          className="login-modal-close"
          aria-label="닫기"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
