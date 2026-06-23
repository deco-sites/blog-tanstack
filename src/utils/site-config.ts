/**
 * Site configuration utility — reads from .deco/blocks/site.json via
 * siteGlobalsBlocks so all JSON-LD, SEO and GEO data is driven by the CMS.
 *
 * To update: edit .deco/blocks/site.json in the admin, then run
 *   npm run generate:site-globals
 * to sync site-globals.gen.ts.
 */
import { siteGlobalsBlocks } from "../server/cms/site-globals.gen";

export interface SiteConfig {
    /** Site title (e.g. "Blog — Engenharia, Performance, Design e Produto") */
    title: string;
    /** Short tagline / description */
    description: string;
    /** Absolute URL of the favicon / logo image */
    favicon: string;
    /** Short display name derived from title (before the first em-dash) */
    name: string;
    noIndexing: boolean;
}

function parseSite(): SiteConfig {
    const site = (siteGlobalsBlocks as Record<string, Record<string, unknown>>)[
        "site"
    ] ?? {};
    const raw = (site["seo"] as Record<string, unknown>) ?? {};

    const title = (raw["title"] as string) ?? "Blog";
    const name = title.replace(/\s*[—–-].*/, "").trim() || "Blog";

    return {
        title,
        name,
        description: (raw["description"] as string) ?? "",
        favicon: (raw["favicon"] as string) ?? "",
        noIndexing: (raw["noIndexing"] as boolean) ?? false,
    };
}

/** Returns site configuration derived from .deco/blocks/site.json. */
export function getSiteConfig(): SiteConfig {
    return parseSite();
}
