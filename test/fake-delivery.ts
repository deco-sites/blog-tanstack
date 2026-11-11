// The delivery CDN, faked for the suite: the SDK reads
// `https://delivery.decocms.com/sites/<site>/latest.json` and `…/blocks/<hash>.json` with plain
// `fetch`, and this answers those two shapes from the content committed in `.deco/blocks`, as a
// release built the way Studio builds one (`indexEntry` from `@decocms/blocks/protocol`: the hash,
// `type`, `path`, `refs`, `noIndex`, and `CMS` inline). Routing, `entries()` and the reference walk
// behave as on a real release. Every delivery URL fetched is logged (`deliveryLog`), so a test can
// count what a request costs. Anything else goes to the real `fetch`. Import it before anything
// reads content: node:test runs each test file in its own process, so each file starts cold.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { indexEntry } from "@decocms/blocks/protocol";
import { CMS_SITE } from "../src/cms";

const BLOCKS_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "..", ".deco", "blocks");
const RELEASE_URL = `https://delivery.decocms.com/sites/${CMS_SITE}/`;
const REVISION = "000000000000-00000000-0000-7000-8000-000000000000";

/** The committed content: one saved block per file, named as `deco push` names it. */
export function committedBlocks(): Record<string, unknown> {
  const blocks: Record<string, unknown> = {};
  for (const file of readdirSync(BLOCKS_DIR)) {
    if (!file.endsWith(".json")) continue;
    blocks[decodeURIComponent(file.slice(0, -".json".length))] = JSON.parse(readFileSync(join(BLOCKS_DIR, file), "utf8"));
  }
  return blocks;
}

/** Every delivery path fetched since the last `resetDeliveryLog`, in order. */
export const deliveryLog: string[] = [];
export const resetDeliveryLog = () => void (deliveryLog.length = 0);

const nameOfHash = new Map<string, string>();

/** The names of the blocks whose bodies were fetched since the last `resetDeliveryLog`, in order. */
export function blockNamesRead(): string[] {
  return deliveryLog
    .map((path) => /^blocks\/([^/]+)\.json$/.exec(path)?.[1])
    .filter((hash): hash is string => hash !== undefined)
    .map((hash) => nameOfHash.get(hash) ?? hash);
}

async function build(blocks: Record<string, unknown>) {
  const names = Object.keys(blocks);
  const bodies = new Map<string, unknown>();
  const entries: Record<string, unknown> = {};
  for (const name of names) {
    const entry = await indexEntry(name, blocks[name], names, (ref) => blocks[ref]);
    entries[name] = entry;
    bodies.set(entry.version, blocks[name]);
    nameOfHash.set(entry.version, name);
  }
  return {
    index: { revision: REVISION, sequence: 1, metaVersion: 2, previewHosts: ["blog.test", "localhost", "127.0.0.1"], blocks: entries },
    bodies,
  };
}

const release = build(committedBlocks());
const realFetch = globalThis.fetch;

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "content-type": "application/json", etag: '"fake"' } });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (!url.startsWith(RELEASE_URL)) return realFetch(input, init);
  const path = url.slice(RELEASE_URL.length);
  deliveryLog.push(path);
  const { index, bodies } = await release;
  if (path === "latest.json") return json(index);
  const hash = /^blocks\/([^/]+)\.json$/.exec(path)?.[1];
  if (hash && bodies.has(hash)) return json(bodies.get(hash));
  return new Response("not found", { status: 404 });
}) as typeof fetch;
