// Site-wide settings come from the saved block `CMS` (built-in type `cms-settings`), read from the
// release in memory: this site saves an empty analytics section, so every section is its default.
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
      errorSampleRate: 0.05,
      traceSampleRate: 0,
    });
    // No preview hosts in content or code: previews are allowed on every host, as before.
    assert.deepEqual(settings.preview, { hosts: ["*"] });
  });
});
