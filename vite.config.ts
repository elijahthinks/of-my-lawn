import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build works inside the Capacitor iOS shell (file-served).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "dist", sourcemap: true },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
  },
});
