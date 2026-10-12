export interface Step {
  /** @title Título do passo */
  title: string;
  /** @title Conteúdo HTML */
  content: string;
}

export interface Props {
  /** @title Título (usado no TOC) */
  title?: string;
  /** @title Passos */
  steps: Step[];
  id?: string;
}

export default function Steps({ title, steps, id }: Props) {
  if (!steps?.length) return null;
  return (
    <div className="my-8">
      {title && (
        <p id={id} className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#a0a09a] mb-5">
          {title}
        </p>
      )}
      <ol className="m-0 p-0 list-none flex flex-col gap-0 relative">
        {/* Connector line */}
        <span
          aria-hidden="true"
          className="absolute left-[17px] top-8 bottom-8 w-px bg-[#e4e3df]"
          style={{ zIndex: 0 }}
        />
        {steps.map((step, i) => (
          <li key={i} className="relative flex gap-5">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white border-2 border-[#e4e3df] flex items-center justify-center z-10 mt-[2px]">
              <span className="text-[13px] font-bold text-[#ff6011] leading-none">{i + 1}</span>
            </div>
            <div className={`flex-1 pb-8 ${i === steps.length - 1 ? "pb-0" : ""}`}>
              <h4 className="font-semibold text-[#1a1a18] mb-1.5 mt-1.5 leading-snug">{step.title}</h4>
              <div className="text-[#4a4a46] text-[1rem] leading-relaxed" dangerouslySetInnerHTML={{ __html: step.content }} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
