import { cloudflare } from "@cloudflare/vite-plugin";
import { decoTanstack } from "@decocms/tanstack/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "path";

const srcDir = path.resolve(__dirname, "src");

export default defineConfig({
  server: {
    port: parseInt(process.env.PORT ?? "5173", 10),
    host: process.env.PORT ? "0.0.0.0" : undefined,
    allowedHosts: [".decocdn.com", ".deco.host", ".deco.studio", ".decocms.com"],
    // No CSP here: Vite would only add it to the files it serves itself. The worker
    // (`createDecoWorker`) sends Studio's frame-ancestors on every page, in dev too.
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({ server: { entry: "server" } }),
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", { target: "19" }],
        ],
      },
    }),
    tailwindcss(),
    // `__BUILD_HASH__` (the commit: Workers Builds' sha, else git's) for the page cache's key, the
    // browser stub for `node:async_hooks` and one copy of React and TanStack.
    decoTanstack({ buildHash: process.env.WORKERS_CI_COMMIT_SHA }),
  ],
  build: {
    sourcemap: "hidden",
    rollupOptions: {
      onLog(level, log, handler) {
        if (
          log.code === "PLUGIN_WARNING" &&
          log.plugin === "vite:reporter" &&
          log.message?.includes("dynamic import will not move module")
        ) {
          return;
        }
        handler(level, log);
      },
    },
  },
  define: {
    "process.env.DECO_SITE_NAME": JSON.stringify(
      process.env.DECO_SITE_NAME || "blog-tanstack"
    ),
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    dedupe: [
      "@tanstack/react-start",
      "@tanstack/react-router",
      "@tanstack/react-start-server",
      "@tanstack/start-server-core",
      "@tanstack/start-client-core",
      "@tanstack/start-plugin-core",
      "@tanstack/start-storage-context",
      "react",
      "react-dom",
    ],
    alias: {
      "~": srcDir,
    },
  },
});
