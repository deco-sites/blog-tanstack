export interface Props {
  /** @title Citação */
  quote?: string;
  /** @title Citação (alias) */
  text?: string;
  /** @title Autor da citação */
  attribution?: string;
  /** @title URL da fonte */
  sourceUrl?: string;
}

export default function Quote({ quote, text: textProp, attribution, sourceUrl }: Props) {
  const text = quote ?? textProp ?? "";
  return (
    <figure className="my-8 border-l-4 border-[#ff6011] pl-6 ml-0">
      <blockquote className="text-xl text-[#1a1a18] font-medium italic leading-relaxed [text-wrap:balance] m-0">
        "{text}"
      </blockquote>
      {attribution && (
        <figcaption className="mt-3 text-sm text-[#7a7a74] not-italic">
          {sourceUrl ? (
            <a href={sourceUrl} className="hover:text-[#ff6011] transition-colors underline underline-offset-2" target="_blank" rel="noopener noreferrer">
              — {attribution}
            </a>
          ) : (
            <>— {attribution}</>
          )}
        </figcaption>
      )}
    </figure>
  );
}
