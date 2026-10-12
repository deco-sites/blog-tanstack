/** Formats a post date ("YYYY-MM-DD") in pt-BR, e.g. "12 de março de 2025". */
export function formatDate(
  dateStr: string | undefined,
  month: "long" | "short" = "long",
): string {
  if (!dateStr) return "";
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR", {
      year: "numeric",
      month,
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** ISO timestamp for a post date, used in <time dateTime> and JSON-LD. */
export function toIsoDate(dateStr: string): string {
  return `${dateStr}T00:00:00+00:00`;
}

/** Up to two initials from a name, e.g. "Ana Luiza Costa" → "AL". */
export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}
