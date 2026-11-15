/**
 * Reads a list prop stored either as an array or as JSON text (`"[…]"`), the
 * encoding deco Studio's blog editor writes for Steps and Checklist.
 */
export function jsonList<T>(value: T[] | string | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
