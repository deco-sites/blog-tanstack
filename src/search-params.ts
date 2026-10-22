import type { SearchParser, SearchSerializer } from "@tanstack/react-router";

// Search params as plain URLSearchParams (?q=react&page=2), not TanStack's JSON
// encoding, so URLs keep the shape links and the server use.
export const parseSearch: SearchParser = (searchStr) => {
  const str = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
  if (!str) return {};
  const params = new URLSearchParams(str);
  const result: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length === 1 ? values[0] : values;
  }
  return result;
};

/**
 * Serializes the router's search object back to a query string. It must give back what
 * {@link parseSearch} read: on the server, TanStack Router compares the request's href with
 * `stringifySearch(parseSearch(...))` and answers a 307 to the normalized URL when they differ. A
 * value-less parameter (`?utm_source=`) parses to `""`, so dropping `""` here turned every such link
 * into an extra redirect (v7's #646). `undefined`/`null` still remove a param, which is how
 * `navigate({ search: { q: undefined } })` clears one.
 */
export const stringifySearch: SearchSerializer = (search) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v));
    } else {
      params.append(key, String(value));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : "";
};
