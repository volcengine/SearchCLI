import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  },
  server: {
    host: process.env.HOST ?? "127.0.0.1",
    proxy: {
      "/api": "http://127.0.0.1:3000"
    }
  }
});
