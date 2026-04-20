import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/modals/LoginModal";

export default function AuthButton() {
  const { authenticated, username, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // 로그아웃 시 페이지를 새로고침하지 않는다. AuthContext 의 authenticated 값이
  // 갱신되면 AppShell 이 viewer-mode 클래스를 토글하고, 문서 목록이 재로드되어
  // UI 가 자연스럽게 전환된다.
  const handleClick = useCallback(async () => {
    if (authenticated) {
      await logout();
    } else {
      setModalOpen(true);
    }
  }, [authenticated, logout]);

  return (
    <>
      <button
        type="button"
        className={`auth-btn${authenticated ? " is-authenticated" : ""}`}
        title={authenticated ? `${username} (로그아웃)` : "관리자 로그인"}
        onClick={handleClick}
      >
        {authenticated ? "로그아웃" : "로그인"}
      </button>
      <LoginModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
