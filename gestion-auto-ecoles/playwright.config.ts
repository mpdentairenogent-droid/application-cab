import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // PLAYWRIGHT_TEST_CHROMIUM_PATH : override local optionnel (non nécessaire après un
    // simple `npx playwright install` — utile uniquement pour certains environnements
    // sandbox où une version de Chromium différente est déjà préinstallée).
    launchOptions: process.env.PLAYWRIGHT_TEST_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_TEST_CHROMIUM_PATH }
      : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Nécessite que `npm run db:seed` ait été exécuté au préalable (comptes de démonstration).
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
