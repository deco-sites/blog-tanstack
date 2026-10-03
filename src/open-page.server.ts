import { notFound, redirect } from "@tanstack/react-router";
import { matchRoute, type Redirect } from "@decocms/blocks";
import { client } from "./cms";
import type { StoredPage } from "./model";
import { namesNothing } from "./not-found.server";
import { runWithRequestState } from "./request-state.server";
import type { PageSeo } from "./seo/types";

/** Where an unknown URL lands: the page saved for "/404" (here the post page, which shows "not found"). */
const NOT_FOUND_PATH = "/404";

export async function openPage<T>(href: string, request: Request) {
  const c = client(request);
  const url = new URL(href, request.url);
  const [pages, pagesError] = await c.list<StoredPage>("page");
  if (pagesError) throw pagesError;
  const [redirects, redirectsError] = await c.list<Redirect>("redirect");
  if (redirectsError) throw redirectsError;

  let match = matchRoute(url, { routes: pages, redirects });
  if (match.kind === "redirect") throw redirect({ href: match.location, statusCode: match.status });

  let status = 200;
  if (match.kind === "not-found") {
    // Unknown paths render the "/404" page, as on v7, but with a real 404 status.
    status = 404;
    match = matchRoute(new URL(NOT_FOUND_PATH, url), { routes: pages, redirects });
    if (match.kind !== "match") throw notFound();
  } else if (await namesNothing(match, c)) {
    status = 404;
  }

  const page = match.entry;
  const state = { url, params: match.params, client: c };
  // Variants of the whole list are one multivariate block: it resolves to the chosen list and streams as one.
  const sections = Array.isArray(page.sections) ? page.sections : [page.sections];
  const blocks = sections.map((block, index) => ({
    key: `${url.pathname}${url.search}:${index}`,
    value: runWithRequestState(state, () => c.resolve<T | T[] | undefined>(block)).then(([value, blockError]) => {
      if (blockError) console.error(blockError);
      return { value: value ?? undefined, failed: blockError !== null };
    }),
  }));

  // Every block has started before SEO is awaited.
  const [seo, seoError] = await runWithRequestState(state, () => c.resolve<PageSeo | undefined>(page.seo));
  if (seoError) throw seoError;

  // The guide streams each block as it resolves. This site's blocks only read
  // the content in memory, so they settle within the same tick: waiting for
  // them renders every section in the first HTML chunk, where the hero image's
  // <link rel="preload"> is hoisted into the head (LCP), as on v7. The promises
  // still travel as promises, so a block that later fetches upstream can stop
  // being awaited here without touching the routes. Marking them fulfilled the
  // way React's use() reads a settled promise lets <Await> render them inline.
  const settled = await Promise.all(blocks.map((block) => block.value));
  blocks.forEach((block, index) => Object.assign(block.value, { status: "fulfilled", value: settled[index] }));
  return { name: page.name, seo: seo ?? undefined, status, blocks };
}
