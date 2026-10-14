import { createCMS, parseDraftPointer } from "@decocms/blocks";
import blocks from "../.deco";
import content from "../.deco/blocks.gen";

// Serves the content module: the content of the commit this build was made from. Site-wide
// settings (analytics, telemetry, preview hosts) live in the saved block `CMS`, read with
// `cms.settings()`. Drafts need no hosted connection: `cms.forDraft` fetches what the draft's
// branch changed from the Studio the pointer names (/next/hosted-drafts).
export const cms = createCMS({ blocks, content });

/**
 * The client for this request: the draft a `?__draft=` link or the draft cookie points at, or the
 * release. On a host outside the `CMS` block's preview hosts the draft is ignored and the request
 * gets the release (/next/releases-and-drafts#allow-previews-per-host).
 */
export const client = async (request: Request) => {
  const pointer = await draftPointer(request);
  return pointer ? cms.forDraft(pointer) : cms.forRelease();
};

/**
 * The draft this request previews, or null. A pointer that doesn't parse (`?__draft=junk`) is no
 * draft: `cms.forDraft` would throw on it and answer 500.
 */
export const draftPointer = async (request: Request) => {
  const pointer = await cms.draftPointer(request);
  return pointer && parseDraftPointer(pointer) !== null ? pointer : null;
};
