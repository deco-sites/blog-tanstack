import type { ImageWidget } from "@decocms/blocks/types/widgets";

export interface CustomImage {
  /** @title Imagem */
  src: ImageWidget;
  /** @title Texto alternativo */
  alt: string;
}

export interface CustomItem {
  /** @title Título */
  label: string;
  /** @title Descrição */
  description?: string;
  /** @title Tom */
  tone?: "neutral" | "accent";
}

export interface Props {
  /** @title Texto */
  text: string;
  /** @title Imagem */
  image?: CustomImage;
  /** @title Itens */
  items?: CustomItem[];
  id?: string;
}

const TONE_CLASSES: Record<NonNullable<CustomItem["tone"]>, string> = {
  neutral: "border-[#e4e3df] bg-white",
  accent: "border-[#ff6011] bg-[#fff4ee]",
};

export default function CustomBlock({ text, image, items, id }: Props) {
  return (
    <div id={id} className="my-8 border border-[#e4e3df] rounded-lg overflow-hidden">
      {image?.src && (
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          className="w-full h-auto block bg-[#f0efeb]"
        />
      )}
      <div className="p-5">
        {text && <p className="m-0 text-[1rem] leading-relaxed text-[#2e2e2a]">{text}</p>}
        {!!items?.length && (
          <ul className="mt-4 mb-0 p-0 list-none grid gap-3 sm:grid-cols-2">
            {items.map((item, i) => (
              <li
                key={i}
                className={`px-4 py-3 rounded border ${TONE_CLASSES[item.tone ?? "neutral"]}`}
              >
                <span className="block font-semibold text-[#2e2e2a]">{item.label}</span>
                {item.description && (
                  <span className="block mt-1 text-sm text-[#7a7a74]">{item.description}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
