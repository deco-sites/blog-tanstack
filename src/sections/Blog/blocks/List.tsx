import React from "react";

export interface ListItem {
  /** @title Texto do item (HTML permitido) */
  text: string;
  /** @title Sub-items */
  children?: ListItem[];
}

export interface Props {
  /** @title Tipo de lista */
  type?: "unordered" | "ordered";
  /** @title Estilo (alias para type) */
  style?: "unordered" | "ordered";
  /**
   * @title Itens
   * @description Array de objetos OR string separada por \n
   */
  items: ListItem[] | string;
}

function parseItems(items: ListItem[] | string): ListItem[] {
  if (typeof items === "string") {
    return items.split("\n").filter((s) => s.trim()).map((s) => ({ text: s.trim() }));
  }
  return items;
}

function renderItems(items: ListItem[], type: "unordered" | "ordered", depth = 0): React.ReactElement {
  const Tag = type === "ordered" ? "ol" : "ul";
  const baseClass = depth === 0 ? "mb-5 space-y-1.5 pl-0" : "mt-1.5 space-y-1 pl-4";
  const markerClass = type === "ordered" ? "list-decimal list-inside" : "list-disc list-inside";

  return (
    <Tag className={`${baseClass} ${markerClass}`}>
      {items.map((item, i) => (
        <li key={i} className="text-[#2e2e2a] text-[1.05rem] leading-relaxed marker:text-[#ff6011]">
          <span dangerouslySetInnerHTML={{ __html: item.text }} />
          {item.children && item.children.length > 0 && renderItems(item.children, type, depth + 1)}
        </li>
      ))}
    </Tag>
  );
}

export default function List({ type, style, items }: Props) {
  if (!items) return null;
  const listType = type ?? style ?? "unordered";
  const parsed = parseItems(items);
  if (!parsed.length) return null;
  return renderItems(parsed, listType);
}
