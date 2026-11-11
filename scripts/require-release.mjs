#!/usr/bin/env node
/**
 * The deploy's guard, run by `prebuild`: on Cloudflare Workers Builds (`WORKERS_CI` is set), or with
 * `REQUIRE_RELEASE=1` (CI's production build), the build fails unless the Studio site's hosted
 * release exists. The worker reads its content from that release and answers 500 on every page
 * without one, so a merge before the first publish keeps the live worker instead of replacing it.
 * Anywhere else (a local build) it does nothing.
 *
 *   REQUIRE_RELEASE=1 node scripts/require-release.mjs
 */
const SITE = "blog-tanstack"; // src/cms.ts's CMS_SITE (test/settings.test.ts keeps them equal)
const url = `https://delivery.decocms.com/sites/${SITE}/latest.json`;

if (!process.env.WORKERS_CI && process.env.REQUIRE_RELEASE !== "1") process.exit(0);

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  const index = res.ok ? await res.json().catch(() => null) : null;
  if (typeof index?.revision === "string") {
    console.log(`[require-release] ${SITE}: release ${index.revision}`);
    process.exit(0);
  }
  console.error(
    `[require-release] ${url} answered ${res.status}: the site has no release, and this build would ` +
      "answer 500 on every page. Publish the release first (README.md, Deployment).",
  );
} catch (error) {
  console.error(`[require-release] ${url} could not be read: ${error}`);
}
process.exit(1);
