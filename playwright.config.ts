import { defineConfig } from "@playwright/test";

const port = 4173;
export default defineConfig({
  workers: 1,
  testDir: "./tests",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npx react-router build && npx vite preview --port ${port}`,
    port: port,
    reuseExistingServer: !process.env.CI,
  },
});
