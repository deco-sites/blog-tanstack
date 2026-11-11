#!/usr/bin/env node
/**
 * A local delivery CDN for parity runs and fetch counts: serves the content committed in
 * `.deco/blocks` as a hosted release (`/sites/<site>/latest.json` and `/sites/<site>/blocks/<hash>.json`),
 * built the way Studio builds one (`indexEntry` from `@decocms/blocks/protocol`). The parity build
 * (parity/vite.config.ts) points the worker's SDK at it; production reads delivery.decocms.com.
 *
 *   node parity/delivery.mjs [--port 4329] [--log <file>]
 *
 * Every request is appended to the log (one `<path>` per line), so a run can count what a cold
 * start and a first render fetch from the CDN.
 */
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { indexEntry } from "@decocms/blocks/protocol";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const port = Number(arg("port", process.env.PARITY_DELIVERY_PORT ?? "4329"));
const log = arg("log", process.env.PARITY_DELIVERY_LOG);
const site = "blog-tanstack";

const dir = join(root, ".deco", "blocks");
const blocks = {};
for (const file of readdirSync(dir)) {
  if (file.endsWith(".json")) blocks[decodeURIComponent(file.slice(0, -5))] = JSON.parse(readFileSync(join(dir, file), "utf8"));
}
const names = Object.keys(blocks);
const entries = {};
const bodies = new Map();
const nameOf = new Map();
for (const name of names) {
  const entry = await indexEntry(name, blocks[name], names, (ref) => blocks[ref]);
  entries[name] = entry;
  bodies.set(entry.version, blocks[name]);
  nameOf.set(entry.version, name);
}
const index = {
  revision: "000000000000-00000000-0000-7000-8000-000000000000",
  sequence: 1,
  metaVersion: 2,
  previewHosts: ["localhost", "127.0.0.1"],
  blocks: entries,
};

const prefix = `/sites/${site}/`;
createServer((req, res) => {
  const path = (req.url ?? "").split("?")[0];
  const rest = path.startsWith(prefix) ? path.slice(prefix.length) : null;
  const hash = rest && /^blocks\/([^/]+)\.json$/.exec(rest)?.[1];
  if (log) appendFileSync(log, `${rest ?? path}${hash ? ` ${nameOf.get(hash) ?? "?"}` : ""}\n`);
  let body;
  if (rest === "latest.json") body = index;
  else if (hash && bodies.has(hash)) body = bodies.get(hash);
  if (body === undefined) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": "application/json", etag: '"local"' }).end(JSON.stringify(body));
}).listen(port, "127.0.0.1", () => console.log(`[delivery] ${names.length} blocks on http://127.0.0.1:${port}${prefix}`));
