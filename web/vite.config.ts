import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves from /guessWho/ sub-path in production.
  // In dev mode, keep root "/" so the proxy and HMR work normally.
  base: mode === "production" ? "/guessWho/" : "/",
  server: {
    port: 5173,
    proxy: {
      // In Docker the backend container is reachable via the service
      // name "server". Outside Docker it falls back to localhost.
      "/socket.io": {
        target: process.env.VITE_WS_PROXY ?? "http://localhost:3001",
        ws: true,
      },
    },
  },
}));
