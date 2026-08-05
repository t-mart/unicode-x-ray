import { defineConfig } from "vitest/config";

/**
 * Separate from vite.config.ts on purpose. The tests need no router and no
 * Nitro, and loading them costs a second per run.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
