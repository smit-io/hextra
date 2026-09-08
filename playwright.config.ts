import { defineConfig } from "@playwright/test";

// 127.0.0.1, not localhost. In the devcontainer /etc/hosts maps localhost to
// both 127.0.0.1 and ::1; Node resolves verbatim and binds `serve` to ::1 only,
// which Chromium reaches but Node's fetch (accessibility.spec.ts) does not.
const baseURL = process.env.BASE_URL || "http://127.0.0.1:1313";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  reporter: [["list"], ["html"]],
  use: {
    baseURL,
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npx serve docs/public -l tcp://127.0.0.1:1313 --no-clipboard",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
