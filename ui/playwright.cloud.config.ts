import { defineConfig } from "@playwright/test";

// Local-only cloud login tests; no device, production account, or IdP required.
export default defineConfig({
  testDir: "./e2e-cloud",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:55443",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: [
    {
      command: "node e2e-cloud/provider-fixture.mjs",
      url: "http://127.0.0.1:55442/auth/providers",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npx vite --mode cloud-development --host 127.0.0.1 --port 55443 --strictPort",
      url: "http://127.0.0.1:55443/login",
      reuseExistingServer: !process.env.CI,
      env: { VITE_CLOUD_API: "http://127.0.0.1:55442" },
    },
  ],
});
