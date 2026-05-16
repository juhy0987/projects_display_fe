import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Ref: https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
});
