import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* /docs/:docId 또는 / 에서 AppShell 렌더링 */}
          <Route path="/docs/:docId" element={<AppShell />} />
          <Route path="/" element={<AppShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
