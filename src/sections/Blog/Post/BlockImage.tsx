export interface Props {
  /** @title URL da imagem */
  src?: string;
  /** @title URL da imagem (alias) */
  url?: string;
  /** @title Texto alternativo */
  alt: string;
  /** @title Legenda */
  caption?: string;
  /** @title Largura máxima */
  maxWidth?: "full" | "large" | "medium" | "small";
}

const MAX_CLASSES: Record<string, string> = {
  full: "w-full",
  large: "max-w-[680px]",
  medium: "max-w-[480px]",
  small: "max-w-[320px]",
};

export default function BlockImage({ src, url, alt, caption, maxWidth = "full" }: Props) {
  const imgSrc = src ?? url ?? "";
  return (
    <figure className={`my-8 mx-auto ${MAX_CLASSES[maxWidth] ?? "w-full"}`}>
      <div className="overflow-hidden rounded bg-[#f0efeb]">
        <img
          src={imgSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-full h-auto block"
        />
      </div>
      {caption && (
        <figcaption className="mt-2.5 text-center text-sm text-[#7a7a74] italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
