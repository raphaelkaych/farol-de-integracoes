import { defineConfig, devices } from "@playwright/test";

const external = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = external || "http://127.0.0.1:18790";

export default defineConfig({
  testDir: "./e2e",
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: external ? undefined : {
    command: "node scripts/preview-e2e.mjs",
    url: baseURL,
    timeout: 90_000,
    reuseExistingServer: false,
  },
});
