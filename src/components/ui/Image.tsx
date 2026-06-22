import type { ImgHTMLAttributes } from "react";

// Hosts that should NOT be proxied through the deco image CDN
const BYPASS_PROXY_HOSTS = new Set([
  "decoassets.com",
  "blog-assets.decocms.com",
  "ozksgdmyrqcxcwhnbepg.supabase.co",
]);

function shouldBypassProxy(src: string): boolean {
  if (!src) return false;
  // SVG and GIF should never be processed (animation preservation)
  if (/\.(svg|gif)(\?|$)/i.test(src)) return true;
  try {
    const url = new URL(src);
    for (const host of BYPASS_PROXY_HOSTS) {
      if (url.hostname === host || url.hostname.endsWith(`.${host}`)) return true;
    }
  } catch {
    // relative URL — pass through as-is
    return true;
  }
  return false;
}

interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}

export default function Image({
  src,
  alt,
  width,
  height,
  loading = "lazy",
  fetchPriority,
  className,
  ...rest
}: ImageProps) {
  const bypass = shouldBypassProxy(src);

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={className}
      {...rest}
    />
  );
}
