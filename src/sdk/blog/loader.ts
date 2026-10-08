/**
 * Shared building blocks for section loaders (`export async function loader`).
 */
import { getSiteConfig, type SiteConfig } from "./siteConfig";

/**
 * Request-derived context every blog section receives from its loader.
 * Must stay serializable — it is sent to the client as section props.
 */
export interface SiteContext {
  /** Origin used for absolute URLs — the canonical base when configured. */
  origin: string;
  pathname: string;
  siteConfig: SiteConfig;
}

export function getSiteContext(req: Request): SiteContext {
  const url = new URL(req.url);
  const siteConfig = getSiteConfig();
  return {
    origin: siteConfig.canonicalBaseUrl ?? url.origin,
    pathname: url.pathname,
    siteConfig,
  };
}

/** Last non-empty path segment, decoded (e.g. /authors/a%40b.com → a@b.com). */
export function lastPathSegment(req: Request): string {
  const segment = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  return segment ? decodeURIComponent(segment) : "";
}
