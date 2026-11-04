import { defineConfig, devices } from "@playwright/test";

const executablePath = process.env.PW_CHROMIUM;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173", acceptDownloads: true, locale: "pt-BR", timezoneId: "America/Sao_Paulo" },
  webServer: { command: "npm run build && npx vite preview --port 4173 --strictPort", port: 4173, reuseExistingServer: !process.env.CI, timeout: 180_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, launchOptions } },
    { name: "celular", use: { ...devices["Pixel 7"], launchOptions } },
  ],
});
