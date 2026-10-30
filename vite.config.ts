import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  // GitHub Pages serves this project from /compute-ledger/.
  // Change to "/" if using a custom domain or username.github.io root site.
  base: process.env.GITHUB_ACTIONS ? "/compute-ledger/" : "/",
  test: {
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
