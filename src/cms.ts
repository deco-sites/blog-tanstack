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
  if (!pointer) return cms.forRelease();
  // A draft that can't be read (its branch is gone, Studio is unreachable, a host no draft host
  // admits) gets the release, as on v7, instead of a 500 on every page while the cookie lasts.
  const draft = cms.forDraft(pointer);
  try {
    await draft.revision();
    return draft;
  } catch (error) {
    console.warn("draft preview: serving the release, the draft could not be read", error);
    return cms.forRelease();
  }
};

/**
 * The draft this request previews, or null. A pointer that doesn't parse (`?__draft=junk`) is no
 * draft: `cms.forDraft` would throw on it and answer 500.
 */
export const draftPointer = async (request: Request) => {
  const pointer = await cms.draftPointer(request);
  return pointer && parseDraftPointer(pointer) !== null ? pointer : null;
};
