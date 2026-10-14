import { useEffect, useRef } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

/**
 * Keeps the content area's height while the next page loads, so the page
 * below doesn't jump up. Carried over from @decocms/start 6.x.
 */
export function StableOutlet() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const ref = useRef<HTMLDivElement>(null);
  const savedHeight = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isLoading && ref.current) {
      savedHeight.current = ref.current.offsetHeight;
    }
    if (!isLoading) {
      savedHeight.current = undefined;
    }
  }, [isLoading]);

  return (
    <div ref={ref} style={savedHeight.current ? { minHeight: savedHeight.current } : undefined}>
      <Outlet />
    </div>
  );
}
