/**
 * Parity build config: the site's own vite.config.ts plus one plugin that prepends
 * parity/runtime/delivery-shim.js to the worker entry, so the build reads its content from the
 * local delivery CDN (parity/delivery.mjs, `PARITY_DELIVERY_ORIGIN`, default http://127.0.0.1:4329)
 * instead of delivery.decocms.com. Site source is untouched; the production build never has it.
 *
 *   PARITY_DELIVERY_ORIGIN=http://127.0.0.1:4329 npx vite build --config parity/vite.config.ts
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig, type Plugin, type UserConfig } from "vite";
import siteConfig from "../vite.config";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const shim = path.join(here, "runtime/delivery-shim.js");
const workerEntry = path.join(root, "src/worker-entry.ts");

const injectShim: Plugin = {
  name: "parity-delivery-shim",
  enforce: "pre",
  transform(code, id) {
    if (id.split("?")[0] !== workerEntry) return;
    return { code: `import ${JSON.stringify(shim)};\n${code}`, map: null };
  },
};

export default mergeConfig(siteConfig as UserConfig, {
  root,
  plugins: [injectShim],
  define: {
    __PARITY_DELIVERY_ORIGIN__: JSON.stringify(process.env.PARITY_DELIVERY_ORIGIN ?? "http://127.0.0.1:4329"),
  },
});
