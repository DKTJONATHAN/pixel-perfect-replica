// Cloudflare Pages deployment for the TanStack Start application.
// Nitro emits the Pages Function as dist/_worker.js and static assets under dist/.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Keep the existing SSR error wrapper as the application entry point.
    server: { entry: "server" },
  },
  // Cloudflare Pages is the deployment target. Nitro generates the Pages
  // worker, _routes.json and redirects/headers metadata automatically.
  nitro: {
    preset: "cloudflare-pages",
  },
});
