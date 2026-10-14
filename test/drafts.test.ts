// Draft previews (src/cms.ts, src/start.ts, src/edge/headers.ts): a `?__draft=` link or the draft
// cookie picks the draft, a junk pointer is no draft, and a draft's response is never stored or indexed.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { client, cms, draftPointer } from "../src/cms";
import { withDraftHeaders } from "../src/edge/headers";

const POINTER = "blog.test/@abc123";

describe("draft pointer", () => {
  it("reads a ?__draft= link and the draft cookie", async () => {
    assert.equal(await draftPointer(new Request(`http://blog.test/?__draft=${encodeURIComponent(POINTER)}`)), POINTER);
    const cookie = new Request("http://blog.test/x", {
      headers: { cookie: `__deco_draft=${encodeURIComponent(POINTER)}` },
    });
    assert.equal(await draftPointer(cookie), POINTER);
  });

  it("is no draft without a pointer, with a junk one, or with ?__draft=off", async () => {
    assert.equal(await draftPointer(new Request("http://blog.test/")), null);
    assert.equal(await draftPointer(new Request("http://blog.test/?__draft=junk")), null);
    assert.equal(await draftPointer(new Request("http://blog.test/?__draft=")), null);
    const off = new Request("http://blog.test/?__draft=off", {
      headers: { cookie: `__deco_draft=${encodeURIComponent(POINTER)}` },
    });
    assert.equal(await draftPointer(off), null);
  });

  it("stores a ?__draft= link in a cookie the preview iframe sends, and ?__draft=off clears it", async () => {
    const set = await cms.draftCookie(new Request(`http://blog.test/?__draft=${encodeURIComponent(POINTER)}`));
    assert.match(set ?? "", /^__deco_draft=/);
    assert.match(set ?? "", /SameSite=None/);
    assert.match((await cms.draftCookie(new Request("http://blog.test/?__draft=off"))) ?? "", /Max-Age=0/);
    assert.equal(await cms.draftCookie(new Request("http://blog.test/?__draft=junk")), null);
  });
});

describe("draft client", () => {
  it("gets the release when the draft can't be read, as on v7 (no 500 while the cookie lasts)", async () => {
    // Port 9 (discard) on loopback: a draft host the CMS admits, with nothing listening.
    const unreadable = encodeURIComponent("127.0.0.1:9/drafts/gone@v1");
    const c = await client(new Request(`http://blog.test/?__draft=${unreadable}`));
    assert.equal(await c.revision(), await cms.forRelease().revision());
  });
});

describe("draft response headers", () => {
  it("are never stored and never indexed, as on v7", () => {
    const resp = withDraftHeaders(
      new Response("<html></html>", {
        headers: { "content-type": "text/html", "cache-control": "public, max-age=60", vary: "Accept-Encoding" },
      }),
    );
    assert.equal(resp.headers.get("cache-control"), "no-store, private");
    assert.equal(resp.headers.get("cdn-cache-control"), "no-store");
    assert.equal(resp.headers.get("vary"), "Accept-Encoding, Cookie");
    assert.equal(resp.headers.get("x-robots-tag"), "noindex, nofollow");
  });
});
