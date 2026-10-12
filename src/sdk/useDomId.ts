import { useId } from "react";

/** `useId()` made safe for DOM ids and CSS/querySelector lookups (no colons). */
export function useDomId(): string {
  return useId().replace(/:/g, "-");
}
