import Callout from "./Callout";

export interface Props {
  /** @title Termo (opcional; sem termo, mostra "Definição") */
  title?: string;
  /**
   * @title Definição
   * @format rich-text
   */
  body?: string;
}

/** The "Definição" box, marked up as a schema.org DefinedTerm. */
export default function Definition(props: Props) {
  return <Callout {...props} variant="definition" />;
}
