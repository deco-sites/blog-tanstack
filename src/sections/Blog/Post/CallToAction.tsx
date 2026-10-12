export interface Props {
  /** @title Título */
  title: string;
  /** @title Subtítulo / descrição */
  description?: string;
  /** @title Texto do botão principal */
  primaryLabel: string;
  /** @title URL do botão principal */
  primaryHref: string;
  /** @title Texto do botão secundário */
  secondaryLabel?: string;
  /** @title URL do botão secundário */
  secondaryHref?: string;
  /** @title Variante */
  variant?: "default" | "minimal" | "highlight";
}

export default function CallToAction({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = "default",
}: Props) {
  if (variant === "minimal") {
    return (
      <div className="my-8 flex flex-wrap items-center justify-between gap-4 border-l-4 border-[#ff6011] pl-5 py-2">
        <div>
          <p className="font-semibold text-[#1a1a18] leading-snug">{title}</p>
          {description && <p className="text-sm text-[#7a7a74] mt-0.5">{description}</p>}
        </div>
        <a
          href={primaryHref}
          className="text-sm font-semibold text-[#ff6011] hover:opacity-80 transition-opacity no-underline flex-shrink-0"
        >
          {primaryLabel} →
        </a>
      </div>
    );
  }

  if (variant === "highlight") {
    return (
      <div className="my-10 bg-[#1a1a18] text-white rounded-xl px-8 py-8 text-center">
        <h3 className="text-xl font-bold mb-2 text-white [text-wrap:balance]">{title}</h3>
        {description && <p className="text-[#c8c7c2] mb-6 text-[1.05rem] [text-wrap:balance]">{description}</p>}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={primaryHref}
            className="inline-block bg-[#ff6011] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#e8510a] transition-colors no-underline"
          >
            {primaryLabel}
          </a>
          {secondaryLabel && secondaryHref && (
            <a
              href={secondaryHref}
              className="inline-block border border-white/20 text-white/80 font-medium text-sm px-6 py-2.5 rounded hover:border-white/60 hover:text-white transition-colors no-underline"
            >
              {secondaryLabel}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="my-10 bg-[#f7f6f3] border border-[#e4e3df] rounded-xl px-8 py-7 text-center">
      <h3 className="text-xl font-bold text-[#1a1a18] mb-2 [text-wrap:balance]">{title}</h3>
      {description && <p className="text-[#4a4a46] mb-6 [text-wrap:balance]">{description}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={primaryHref}
          className="inline-block bg-[#ff6011] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#e8510a] transition-colors no-underline"
        >
          {primaryLabel}
        </a>
        {secondaryLabel && secondaryHref && (
          <a
            href={secondaryHref}
            className="inline-block border border-[#e4e3df] text-[#1a1a18] font-medium text-sm px-6 py-2.5 rounded hover:border-[#a0a09a] transition-colors no-underline"
          >
            {secondaryLabel}
          </a>
        )}
      </div>
    </div>
  );
}
