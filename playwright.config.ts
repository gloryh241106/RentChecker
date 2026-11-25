import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// An installed browser, so no download is needed. Set E2E_CHANNEL to use another one.
const channel = process.env.E2E_CHANNEL ?? 'msedge';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: true,
  reporter: 'list',
  use: { baseURL: `http://localhost:${String(PORT)}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'phone', use: { ...devices['Pixel 7'], channel } },
  ],
  webServer: {
    // The built app, as in Docker. Without a key, no test can reach the real AI service.
    command: 'npm run build && node dist-server/server/src/index.js',
    env: {
      PORT: String(PORT),
      STATIC_DIR: 'client/dist',
      GEMINI_API_KEY: '',
      GEMINI_MODEL: '',
      DATABASE_URL: '',
    },
    url: `http://localhost:${String(PORT)}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
