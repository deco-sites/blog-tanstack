// The Cloudflare Cache API (`caches.default`), faked in memory for the page cache
// (src/edge/page-cache.ts): `match` and `put` by URL, and `age(seconds)` to make every stored copy
// that much older. Import it before the worker serves anything.
interface Stored {
  body: ArrayBuffer;
  status: number;
  headers: [string, string][];
}

const STORED_AT = "x-edge-stored-at";
const entries = new Map<string, Stored>();

export const edgeCache = {
  async match(request: Request | string): Promise<Response | undefined> {
    const stored = entries.get(typeof request === "string" ? request : request.url);
    return stored && new Response(stored.body.slice(0), { status: stored.status, headers: stored.headers });
  },
  async put(request: Request | string, response: Response): Promise<void> {
    const key = typeof request === "string" ? request : request.url;
    entries.set(key, { body: await response.arrayBuffer(), status: response.status, headers: [...response.headers] });
  },
  /** How many copies are stored. */
  get size() {
    return entries.size;
  },
  clear: () => entries.clear(),
  /** Every stored copy, `seconds` older. */
  age(seconds: number) {
    for (const stored of entries.values()) {
      stored.headers = stored.headers.map(([name, value]) =>
        name === STORED_AT ? [name, String(Number(value) - seconds * 1000)] : [name, value],
      );
    }
  },
};

(globalThis as { caches?: unknown }).caches = { default: edgeCache };

/** An execution context whose `waitUntil` work a test can wait for. */
export function executionContext() {
  const pending: Promise<unknown>[] = [];
  return {
    waitUntil: (promise: Promise<unknown>) => void pending.push(promise),
    settled: () => Promise.allSettled(pending.splice(0)),
  };
}
