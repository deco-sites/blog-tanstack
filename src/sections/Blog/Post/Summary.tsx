import Callout from "./Callout";

export interface Props {
  /** @title Título (opcional; sem título, mostra "Resumo") */
  title?: string;
  /**
   * @title Texto
   * @format rich-text
   */
  body?: string;
}

/** The "Resumo" box: the post's answer in a few lines, near the top. */
export default function Summary(props: Props) {
  return <Callout {...props} variant="summary" />;
}
