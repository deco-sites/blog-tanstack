export interface CheckItem {
  /** @title Texto */
  text: string;
  /** @title Marcado como completo */
  checked?: boolean;
}

export interface Props {
  /** @title Título da lista (usado no TOC) */
  title?: string;
  /** @title Itens */
  items: CheckItem[];
  id?: string;
}

export default function Checklist({ title, items, id }: Props) {
  if (!items?.length) return null;
  return (
    <div className="my-6 border border-[#e4e3df] rounded-lg overflow-hidden">
      {title && (
        <div id={id} className="px-5 py-3 bg-[#f7f6f3] border-b border-[#e4e3df]">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#7a7a74]">{title}</span>
        </div>
      )}
      <ul className="m-0 p-0 list-none divide-y divide-[#f0efeb]">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3">
            <span
              className={`mt-0.5 w-4.5 h-4.5 rounded flex-shrink-0 flex items-center justify-center border ${item.checked ? "bg-[#ff6011] border-[#ff6011]" : "border-[#c8c7c2]"}`}
              aria-hidden="true"
            >
              {item.checked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4l3 3L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className={`text-[1rem] leading-relaxed ${item.checked ? "text-[#7a7a74] line-through decoration-[#c8c7c2]" : "text-[#2e2e2a]"}`}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
