import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/modals/LoginModal";

export default function AuthButton() {
  const { authenticated, username, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = useCallback(async () => {
    if (authenticated) {
      await logout();
      window.location.reload();
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
