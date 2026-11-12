// Unused files and dependencies (`bun run knip`, CI's "No unused code or dependencies"), as osklen
// gates on: not unused exports, which the vendored blog app keeps on purpose.
import type { KnipConfig } from "knip";

export default {
  include: ["files", "dependencies", "devDependencies", "optionalPeerDependencies", "unlisted", "binaries", "unresolved"],
  entry: [".deco/index.ts", "scripts/**/*.mjs", "parity/**/*.{mjs,ts,js}", "test/**/*.ts"],
  project: ["src/**/*.{ts,tsx,css}", "tailwind.css", ".deco/**/*.ts", "scripts/**/*.mjs", "parity/**/*.{mjs,ts,js}", "test/**/*.ts"],
  compilers: {
    // Tailwind v4 is configured in CSS: its `@import`s and `@plugin`s are imports too.
    css: (text: string) =>
      [...text.matchAll(/@(?:import|plugin)\s+["']([^"']+)["']/g)].map(([, from]) => `import "${from}";`).join("\n"),
  },
} satisfies KnipConfig;
