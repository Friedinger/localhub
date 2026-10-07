import { defineConfig } from "vite";

export default defineConfig({
  base: "/localhub/",
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
