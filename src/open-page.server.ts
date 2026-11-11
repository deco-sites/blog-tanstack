/**
 * Finds the page for a URL and starts every block on it (/next/tanstack-start-descriptors#3-match-the-url-to-a-page).
 *
 * Routing reads only the release index: the pages' paths (`client.routes()`), then the one redirects
 * block (`client.redirects()`, nothing when the content has none). The matched page's blocks start
 * downloading with the redirects block, in one wave (`prefetch`). Nothing else is read to route:
 * never `client.list()`, never another page's body.
 */
import { notFound, redirect } from "@tanstack/react-router";
import { matchRoute, type Route } from "@decocms/blocks";
import { client } from "./cms";
import type { StoredPage } from "./model";
import { namesNothing } from "./not-found.server";
import { type RequestState, runWithRequestState } from "./request-state.server";
import { type PageSeo, withSiteSeo } from "./seo/types";
import type { SiteSettings } from "./utils/site-config";

/** Where an unknown URL lands: the page saved for "/404" (here the post page, which shows "not found"). */
const NOT_FOUND_PATH = "/404";

export async function openPage<T>(href: string, request: Request) {
  const url = new URL(href, request.url);
  // Blocks read the page URL: it must stay on this site's origin.
  if (url.origin !== new URL(request.url).origin) throw notFound();
  const c = await client(request);

  const [routes, routesError] = await c.routes();
  if (routesError) throw routesError;
  let match = matchRoute<Route>(url, { routes });
  // The page's blocks download with the redirects block and the config blocks every page reads
  // (`site`; `deco-blog`, the header's and the SEO's settings), in one wave.
  if (match.kind === "match") c.prefetch(match.entry.name);
  c.prefetch("site");
  c.prefetch("deco-blog");
  // The worker already answers redirects for page navigations; a client-side navigation reaches
  // this as a server-function call, which the worker doesn't redirect.
  const [redirects, redirectsError] = await c.redirects();
  if (redirectsError) throw redirectsError;
  const moved = matchRoute(url, { routes: [], redirects });
  if (moved.kind === "redirect") throw redirect({ href: moved.location, statusCode: moved.status });

  let status = 200;
  if (match.kind !== "match") {
    // Unknown paths render the "/404" page, as on v7, but with a real 404 status.
    status = 404;
    match = matchRoute<Route>(new URL(NOT_FOUND_PATH, url), { routes });
    if (match.kind !== "match") throw notFound();
    c.prefetch(match.entry.name);
  }

  const state: RequestState = { url, params: match.params, client: c };
  if (status === 200 && (await runWithRequestState(state, () => namesNothing(match)))) status = 404;

  // The saved page, its saved blocks expanded, nothing run.
  const [page, pageError] = await c.resolve<StoredPage>(match.entry.name, { run: false });
  if (pageError) throw pageError;

  // Variants of the whole list are one multivariate block: it resolves to the chosen list and streams as one.
  const sections = Array.isArray(page.sections) ? page.sections : [page.sections];
  const blocks = sections.map((block, index) => {
    // The saved section type: what Studio knows the section by (its data-manifest-key).
    const component = typeOf(block);
    return {
      // Keyed by type and position, as in demo-storefront, never by URL: a save in Studio moves the
      // page to its new `?__draft=` (StudioRefresh), and a section still on the page is patched in
      // place. Remounted, it would lose what its inline scripts set up when the HTML was parsed
      // (the cards' reveal, the table of contents), which no client render runs again.
      key: `${component ?? "block"}-${index}`,
      component,
      value: runWithRequestState(state, () => c.resolve<T | T[] | undefined>(block)).then(([value, blockError]) => {
        if (blockError) console.error(blockError);
        return { value: value ?? undefined, failed: blockError !== null };
      }),
    };
  });

  // Every block has started before SEO is awaited. `site` is a config block named in code. Either
  // failing leaves its part to the defaults and marks the page degraded, as a failed block does.
  const [[seo, seoError], [site, siteError]] = await Promise.all([
    runWithRequestState(state, () => c.resolve<PageSeo | undefined>(page.seo)),
    c.resolve<SiteSettings>("site"),
  ]);
  for (const error of [seoError, siteError]) {
    if (error === null) continue;
    console.error(error);
    state.degraded = true;
  }

  // The guide streams each block as it resolves. This site's blocks only read
  // CMS content, so they settle together: waiting for them renders every
  // section in the first HTML chunk, where the hero image's
  // <link rel="preload"> is hoisted into the head (LCP), as on v7. The promises
  // still travel as promises, so a block that later fetches upstream can stop
  // being awaited here without touching the routes. Marking them fulfilled the
  // way React's use() reads a settled promise lets <Await> render them inline.
  const settled = await Promise.all(blocks.map((block) => block.value));
  blocks.forEach((block, index) => Object.assign(block.value, { status: "fulfilled", value: settled[index] }));
  // Without its own SEO (the post's title, canonical and robots) or with no section rendered, the
  // page can't stand for itself: a 503, which search engines retry instead of indexing, and which
  // the page cache answers from a stale copy when it has one.
  if (seoError !== null || (settled.length > 0 && settled.every((block) => block.failed))) status = 503;
  return {
    name: page.name,
    // As on v7, what the page's SEO leaves empty comes from the site's SEO.
    seo: withSiteSeo(seo ?? undefined, site?.seo),
    status,
    // Some content failed to load (a block, the SEO, the site settings, or a read a block caught):
    // the page renders, but no cache keeps it (`pageHeaders`).
    degraded: state.degraded === true || settled.some((block) => block.failed),
    blocks,
    // The page's path template and name: Studio's "." shortcut opens this page in the editor (DecoPreview).
    pathTemplate: match.entry.path,
    pageId: match.entry.name,
  };
}

/** A saved block's type, if it is one. */
function typeOf(block: unknown): string | undefined {
  const type = block && typeof block === "object" ? (block as { __resolveType?: unknown }).__resolveType : undefined;
  return typeof type === "string" ? type : undefined;
}
