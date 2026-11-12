#!/usr/bin/env node
/**
 * The deploy's guard, run by `prebuild`: on Cloudflare Workers Builds (`WORKERS_CI` is set), or with
 * `REQUIRE_RELEASE=1` (CI's production build, `bun run deploy`), the build fails unless the Studio
 * site's hosted release exists. The worker reads its content from that release and answers 500 on
 * every page without one, so a merge before the first publish keeps the live worker instead of
 * replacing it. Anywhere else (a local build) it does nothing.
 *
 *   REQUIRE_RELEASE=1 node scripts/require-release.mjs
 */
const SITE = "blog-tanstack"; // src/cms.ts's CMS_SITE (test/settings.test.ts keeps them equal)
const url = `https://delivery.decocms.com/sites/${SITE}/latest.json`;
const ATTEMPTS = 3;

if (!process.env.WORKERS_CI && process.env.REQUIRE_RELEASE !== "1") process.exit(0);

let problem = "";
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (res.status === 404) {
      console.error(
        `[require-release] ${url} answered 404: the site has no release, and this build would answer ` +
          "500 on every page. Publish the release first (README.md, Deployment).",
      );
      process.exit(1);
    }
    const index = res.ok ? await res.json().catch(() => null) : null;
    if (typeof index?.revision === "string") {
      console.log(`[require-release] ${SITE}: release ${index.revision}`);
      process.exit(0);
    }
    problem = res.ok ? "answered 200 without a release index" : `answered ${res.status}`;
  } catch (error) {
    problem = `could not be read: ${error}`;
  }
  // A CDN hiccup: try again before failing the deploy.
  if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 2_000 * attempt));
}
console.error(`[require-release] ${url} ${problem} (${ATTEMPTS} attempts). Retry the build.`);
process.exit(1);
