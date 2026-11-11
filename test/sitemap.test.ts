// The sitemap's CDN budget, in a cold process (node:test runs each file in its own): it lists the
// pages from the content index (`entries("page")`) and reads no block body.
import { blockNamesRead, deliveryLog, resetDeliveryLog } from "./fake-delivery";
import assert from "node:assert/strict";
import { it } from "node:test";
import { Route } from "../src/routes/sitemap[.]xml";

type Handler = (ctx: { request: Request }) => Promise<Response>;

it("the sitemap reads the content index only, never a page body", async () => {
  resetDeliveryLog();
  const { GET } = (Route.options as unknown as { server: { handlers: { GET: Handler } } }).server.handlers;
  const res = await GET({ request: new Request("http://blog.test/sitemap.xml") });
  const xml = await res.text();
  assert.match(xml, /<loc>http:\/\/blog\.test\/topics<\/loc>/);
  assert.doesNotMatch(xml, /:slug|:email/);
  assert.deepEqual(deliveryLog, ["latest.json"]);
  assert.deepEqual(blockNamesRead(), []);
});
