// Site-wide settings come from the saved block `CMS` (built-in type `cms-settings`), read from the
// index (it is inline in `latest.json`): this site saves an empty analytics section, so every
// section is its default, and the telemetry defaults are src/cms.ts's.
import "./fake-delivery";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cms } from "../src/cms";

describe("CMS settings", () => {
  it("fills in the defaults for the sections CMS.json leaves out", async () => {
    const settings = await cms.settings();
    assert.equal(settings.analytics.enabled, true);
    assert.match(settings.analytics.collector, /^https:\/\//);
    assert.deepEqual(settings.telemetry, {
      enabled: true,
      metrics: true,
      errorSampleRate: 1, // src/cms.ts sends every CMS error log by default, as osklen and demo-storefront do
      traceSampleRate: 0,
    });
    // Preview hosts are the release's (Studio writes them into `latest.json`), not content's.
  });
});
