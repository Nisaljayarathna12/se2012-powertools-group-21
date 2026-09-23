import { defineConfig } from "@playwright/test"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url))

function loadDotEnv() {
  const result: Record<string, string> = {}
  const file = path.resolve(workspaceRoot, "..", ".env")
  if (!fs.existsSync(file)) return result
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.*)\s*$/)
    if (m) result[m[1]] = m[2]
  }
  return result
}

const dotenv = loadDotEnv()

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: "http://localhost:3100",
    navigationTimeout: 60_000,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "mvnw.cmd spring-boot:run",
      cwd: "../api",
      url: "http://localhost:8081/api/health",
      reuseExistingServer: false,
      timeout: 300_000,
      env: {
        ...dotenv,
        DB_NAME: "powertools_it",
        SERVER_PORT: "8081",
        CORS_ALLOWED_ORIGINS: "http://localhost:3100",
      },
    },
    {
      command: "pnpm exec next dev -p 3100",
      cwd: ".",
      url: "http://localhost:3100/products",
      reuseExistingServer: false,
      timeout: 240_000,
      env: {
        NEXT_PUBLIC_API_URL: "http://localhost:8081",
      },
    },
  ],
})