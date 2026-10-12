export interface Props {
  /** @title URL do vídeo (YouTube, Vimeo ou arquivo direto) */
  url: string;
  /** @title Título / legenda */
  title?: string;
  /** @title Aspect ratio */
  aspectRatio?: "16:9" | "4:3" | "1:1";
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&\s]{11})/);
  return m?.[1] ?? null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] ?? null;
}

const ASPECT_PADDING: Record<string, string> = {
  "16:9": "56.25%",
  "4:3": "75%",
  "1:1": "100%",
};

export default function Video({ url, title, aspectRatio = "16:9" }: Props) {
  const ytId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);
  const padding = ASPECT_PADDING[aspectRatio] ?? "56.25%";

  let embedSrc: string | null = null;
  if (ytId) embedSrc = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`;
  else if (vimeoId) embedSrc = `https://player.vimeo.com/video/${vimeoId}?dnt=1`;

  return (
    <figure className="my-8">
      <div className="overflow-hidden rounded bg-[#1a1a18]" style={{ position: "relative", paddingTop: padding }}>
        {embedSrc ? (
          <iframe
            src={embedSrc}
            title={title ?? "Video"}
            loading="lazy"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        ) : (
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            title={title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />
        )}
      </div>
      {title && (
        <figcaption className="mt-2.5 text-center text-sm text-[#7a7a74] italic">
          {title}
        </figcaption>
      )}
    </figure>
  );
}
