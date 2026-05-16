import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";

// HashRouter Trade-off (PR #11 gemini 피드백 — 향후 재논의 대상):
//   - 채택 이유: GitHub Pages 가 정적 호스팅이라 BrowserRouter 사용 시 404 fallback 트릭(`public/404.html=index.html`)이 필요.
//     HashRouter 는 `index.html` 만 서빙해도 라우팅이 동작.
//   - 한계: URL fragment(`#block-id`) 가 라우팅 식별자로 점유됨 → 블록 단위 anchor 링크 도입 시 충돌.
//     블록 anchor 가 필수 요건이 되면 BrowserRouter + 404.html 트릭으로 회귀하거나 hash 인코딩 규칙을 별도 설계.
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* /docs/:docId 또는 / 에서 AppShell 렌더링 */}
          <Route path="/docs/:docId" element={<AppShell />} />
          <Route path="/" element={<AppShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
