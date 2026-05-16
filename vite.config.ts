import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Ref: https://vite.dev/config/
//
// base 처리:
//   - dev(`vite dev` / `vite preview`) 에서는 "/" — 로컬 프록시와 dev 도구 호환
//   - build 에서는 GitHub Pages 의 project subpath ("/projects_display_fe/") —
//     산출물 자산 경로가 `<base>/assets/...` 로 prefix 되어야 Pages 도메인에서 정상 로드
//   - GitHub Pages 가 아닌 다른 정적 호스트(custom domain 등)로 옮길 경우엔
//     `command === "build"` 분기에서 base 를 "/" 로 되돌리고 `public/CNAME` 등을 추가
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/projects_display_fe/" : "/",
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
