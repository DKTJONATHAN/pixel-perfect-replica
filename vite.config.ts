import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
  ],
  // Cloudflare Workers via Nitro (cloudflare_module matches `wrangler deploy`)
  // @ts-expect-error nitro is provided by TanStack Start / Nitro integration
  nitro: {
    preset: "cloudflare_module",
  },
});
