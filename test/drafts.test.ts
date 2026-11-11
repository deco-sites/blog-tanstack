// Draft previews: a `?__draft=` link or the draft cookie picks the draft and a junk pointer is no
// draft. `createDecoWorker` decides it once per request and sends a draft no-store and noindex.
import "./fake-delivery";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { client, cms } from "../src/cms";

const versionOf = async (request: Request) => (await cms.readVersion(request))?.version ?? null;

const POINTER = "blog.test/@abc123";

describe("draft version (cms.readVersion)", () => {
  it("reads a ?__draft= link and the draft cookie", async () => {
    assert.equal(await versionOf(new Request(`http://blog.test/?__draft=${encodeURIComponent(POINTER)}`)), POINTER);
    const cookie = new Request("http://blog.test/x", {
      headers: { cookie: `__deco_draft=${encodeURIComponent(POINTER)}` },
    });
    assert.equal(await versionOf(cookie), POINTER);
  });

  it("reads a preview link's moment and switched tests as the client's options", async () => {
    // The preview's parameters ride in the pointer's query, before the `@<version>`.
    const link = `blog.test/?__at=${encodeURIComponent("2026-01-01T12:00:00Z")}&__test=hero=on@abc123`;
    const read = await cms.readVersion(new Request(`http://blog.test/?__draft=${encodeURIComponent(link)}`));
    assert.equal(read?.version, POINTER);
    assert.equal(read?.date?.toISOString(), "2026-01-01T12:00:00.000Z");
    assert.deepEqual({ ...read?.experiments }, { hero: true });
  });

  it("is no draft without a pointer, with a junk one, or with ?__draft=off", async () => {
    assert.equal(await versionOf(new Request("http://blog.test/")), null);
    assert.equal(await versionOf(new Request("http://blog.test/?__draft=junk")), null);
    assert.equal(await versionOf(new Request("http://blog.test/?__draft=")), null);
    const off = new Request("http://blog.test/?__draft=off", {
      headers: { cookie: `__deco_draft=${encodeURIComponent(POINTER)}` },
    });
    assert.equal(await versionOf(off), null);
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
    assert.equal(await c.revision(), await cms.client().revision());
  });
});
