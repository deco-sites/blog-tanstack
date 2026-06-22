export interface Props {
  /** @title Nível do título */
  level?: "h2" | "h3" | "h4" | "2" | "3" | "4";
  /** @title Texto */
  text: string;
  /** HTML id for TOC anchoring — injected by BlogPostSection */
  id?: string;
}

const CLASSES: Record<string, string> = {
  h2: "text-[clamp(1.3rem,2.2vw,1.75rem)] font-bold text-[#1a1a18] leading-snug tracking-tight mt-10 mb-4",
  h3: "text-[clamp(1.1rem,1.8vw,1.35rem)] font-semibold text-[#1a1a18] leading-snug mt-8 mb-3",
  h4: "text-base font-semibold text-[#1a1a18] leading-snug uppercase tracking-wide mt-6 mb-2",
};

export default function Heading({ level = "h2", text, id }: Props) {
  const tag = (level === "2" ? "h2" : level === "3" ? "h3" : level === "4" ? "h4" : level) as "h2" | "h3" | "h4";
  const cls = CLASSES[tag] ?? CLASSES.h2;
  const Tag = tag;
  return (
    <Tag id={id} className={cls} dangerouslySetInnerHTML={{ __html: text }} />
  );
}
