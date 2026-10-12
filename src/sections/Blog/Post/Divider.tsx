export interface Props {
  /** @title Estilo */
  style?: "line" | "dots" | "ornament";
}

export default function Divider({ style = "line" }: Props) {
  if (style === "dots") {
    return (
      <div className="my-10 flex items-center justify-center gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#c8c7c2]" />
        ))}
      </div>
    );
  }
  if (style === "ornament") {
    return (
      <div className="my-10 flex items-center justify-center" aria-hidden="true">
        <span className="text-2xl text-[#e4e3df]">✦</span>
      </div>
    );
  }
  return <hr className="my-10 border-none border-t border-[#e4e3df]" aria-hidden="true" />;
}
