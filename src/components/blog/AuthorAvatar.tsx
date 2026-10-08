import type { Author } from "@decocms/apps-blog/types";
import { initials } from "../../sdk/blog/format";

const SIZES = {
  sm: { box: "w-8 h-8", text: "text-xs" },
  md: { box: "w-14 h-14", text: "text-xl" },
  lg: { box: "w-16 h-16", text: "text-xl" },
} as const;

export interface Props {
  author: Pick<Author, "name" | "avatar">;
  size?: keyof typeof SIZES;
}

/** Author photo, or their initials on the brand color when there's no avatar. */
export default function AuthorAvatar({ author, size = "md" }: Props) {
  const { box, text } = SIZES[size];
  if (author.avatar) {
    return (
      <img
        src={author.avatar}
        alt={author.name}
        loading="lazy"
        decoding="async"
        className={`${box} rounded-full object-cover block flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${box} ${text} rounded-full bg-[#ff6011] text-white flex items-center justify-center flex-shrink-0 font-bold select-none`}
      aria-hidden="true"
    >
      {initials(author.name) || "?"}
    </div>
  );
}
