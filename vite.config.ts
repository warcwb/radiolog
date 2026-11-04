/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

process.env.TZ = "America/Sao_Paulo";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,woff2}"] },
      manifest: {
        name: "RadioLog – Log de Rádio Emergência",
        short_name: "RadioLog",
        lang: "pt-BR",
        display: "standalone",
        start_url: "./",
        background_color: "#111111",
        theme_color: "#b00020",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/ui/camera.ts", "src/test/**", "src/**/*.test.{ts,tsx}"],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
    },
  },
});
