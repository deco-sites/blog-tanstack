export type CalloutVariant = "info" | "warning" | "success" | "summary" | "definition";

export interface Props {
  /** @title Variante */
  variant?: CalloutVariant;
  /** @title Título opcional */
  title?: string;
  /** @title Conteúdo HTML */
  body?: string;
  /** @title Conteúdo HTML (alias) */
  content?: string;
}

const VARIANTS: Record<CalloutVariant, { border: string; bg: string; icon: string; label: string }> = {
  info: {
    border: "border-[#3b82f6]",
    bg: "bg-[#eff6ff]",
    icon: `<path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>`,
    label: "Nota",
  },
  warning: {
    border: "border-[#f59e0b]",
    bg: "bg-[#fffbeb]",
    icon: `<path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>`,
    label: "Atenção",
  },
  success: {
    border: "border-[#10b981]",
    bg: "bg-[#ecfdf5]",
    icon: `<path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>`,
    label: "Dica",
  },
  summary: {
    border: "border-[#ff6011]",
    bg: "bg-[#fff8f5]",
    icon: `<path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>`,
    label: "Resumo",
  },
  definition: {
    border: "border-[#8b5cf6]",
    bg: "bg-[#f5f3ff]",
    icon: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>`,
    label: "Definição",
  },
};

export default function Callout({ variant = "info", title, body, content }: Props) {
  const resolvedContent = body ?? content ?? "";
  const v = VARIANTS[variant];
  return (
    <aside className={`my-6 border-l-4 ${v.border} ${v.bg} rounded-r-lg px-5 py-4`}>
      <div className="flex items-start gap-3">
        <svg
          width="18" height="18"
          viewBox="0 0 24 24"
          fill="none"
          className={`flex-shrink-0 mt-0.5 ${variant === "info" ? "text-[#3b82f6]" : variant === "warning" ? "text-[#f59e0b]" : variant === "success" ? "text-[#10b981]" : variant === "summary" ? "text-[#ff6011]" : "text-[#8b5cf6]"}`}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: v.icon }}
        />
        <div className="flex-1 min-w-0">
          {(title || true) && (
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase mb-1.5 opacity-60 text-current">
              {title || v.label}
            </p>
          )}
          <div
            className="text-[0.98rem] leading-relaxed text-[#2e2e2a]"
            dangerouslySetInnerHTML={{ __html: resolvedContent }}
          />
        </div>
      </div>
    </aside>
  );
}
