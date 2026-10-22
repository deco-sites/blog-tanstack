import { createCMS } from "@decocms/blocks";
import blocks from "../.deco";
import content from "../.deco/blocks.gen";

// Serves the content module: the content of the commit this build was made from. Site-wide
// settings (analytics, telemetry, preview hosts) live in the saved block `CMS`, read with
// `cms.settings()`. Drafts need no hosted connection: `cms.client({ version })` with a draft
// pointer fetches what the draft's branch changed from the Studio the pointer names (/next/hosted-drafts).
export const cms = createCMS({ blocks, content });

/**
 * The client for this request: `cms.client` with what a Studio link asks for (`cms.readVersion`: the
 * draft or release a `?__draft=` link or the draft cookie points at, with the preview's moment and
 * switched tests and campaigns), or the release. On a host outside the `CMS` block's preview hosts,
 * and for a value that doesn't parse (`?__draft=junk`), the link is ignored and the request gets the
 * release (/next/releases-and-drafts#allow-previews-per-host).
 */
export const client = async (request: Request) => {
  const version = await cms.readVersion(request);
  if (!version) return cms.client();
  // A draft that can't be read (its branch is gone, Studio is unreachable, a host no draft host
  // admits) gets the release, as on v7, instead of a 500 on every page while the cookie lasts.
  const preview = cms.client(version);
  try {
    await preview.revision();
    return preview;
  } catch (error) {
    console.warn("draft preview: serving the release, the draft could not be read", error);
    return cms.client();
  }
};
