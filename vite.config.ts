import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Ref: https://vite.dev/config/
//
// base 처리:
//   - 로컬(`vite dev` / `vite build` / `vite preview`) 에서는 항상 "/" —
//     로컬 빌드 결과를 `npm run preview` 로 검증할 때 자산 경로(/assets/...)와
//     preview 서버 base 가 일치해야 동작한다. (`command === "build"` 분기로 분리하면
//     preview 가 깨진다 — PR #11 gemini 피드백 반영)
//   - GitHub Actions(CI) 빌드에서만 GitHub Pages 의 project subpath ("/projects_display_fe/") 적용 —
//     산출물 자산 경로가 `<base>/assets/...` 로 prefix 되어 Pages 도메인에서 정상 로드된다.
//   - repo 이름이 하드코딩됨 — repo rename 또는 custom domain 채택 시 이 문자열도 함께 갱신 필요.
//   - GitHub Pages 가 아닌 다른 정적 호스트(custom domain 등)로 옮기면 분기 제거하고 "/" 고정.
export default defineConfig(() => ({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/projects_display_fe/" : "/",
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    // 개발 시 BE API 프록시 — CORS 없이 쿠키 기반 세션을 유지한다.
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/static": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
}));
