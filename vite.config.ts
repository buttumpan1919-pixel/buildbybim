/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/storageAdapter.ts",
        "src/storage.ts",
        "src/sheets.ts",
        "src/membership.ts",
        "src/cashflow.ts",
        "src/workspace/apps/boq-data/boqDataService.ts",
        "src/workspace/apps/defects/defectService.ts",
        "src/workspace/apps/employees/employeeService.ts",
        "src/workspace/apps/social-feed/socialFeedService.ts",
        "src/workspace/shell/workspaceLanguage.ts",
        "src/workspace/shell/workspaceRouting.ts",
        "src/boqTaskLinkage.ts",
        "src/boqAllocation.ts"
      ]
    }
  }
});
