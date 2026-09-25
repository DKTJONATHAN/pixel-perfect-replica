// Cloudflare Workers deployment for the TanStack Start application.
// Nitro emits a Worker + static assets that `wrangler deploy` understands.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Keep the existing SSR error wrapper as the application entry point.
    server: { entry: "server" },
  },
  // Cloudflare Workers is the deployment target. Matches the CI deploy
  // command (`npx wrangler deploy`) used by this project's Cloudflare build.
  nitro: {
    preset: "cloudflare_module",
  },
});
