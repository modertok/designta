import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" + HashRouter => працює на GitHub Pages у будь-якому репозиторії без налаштувань
export default defineConfig({
  plugins: [react()],
  base: "./",
});
