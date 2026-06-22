export interface Props {
  /** @title Conteúdo HTML */
  html?: string;
  /** @title Conteúdo HTML (alias) */
  content?: string;
}

export default function Paragraph({ html, content }: Props) {
  const body = html ?? content ?? "";
  return (
    <p
      className="text-[#2e2e2a] text-[1.05rem] leading-[1.78] mb-5 [text-wrap:pretty]"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
