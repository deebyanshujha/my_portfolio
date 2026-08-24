import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
  // Spotify's redirect URI must match the dashboard entry exactly, so the dev
  // origin cannot be allowed to drift onto the next free port. 127.0.0.1
  // rather than localhost: Spotify only accepts the literal loopback IP for
  // insecure (http) redirect URIs.
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // the landing page needs React + Motion and nothing else; every
          // application is code-split behind React.lazy on its own
          motion: ["motion"],
        },
      },
    },
  },
});
