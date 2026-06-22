import { createFileRoute } from "@tanstack/react-router";
import {
  cmsRouteConfig,
  withSiteGlobals,
  deferredSectionLoader,
} from "@decocms/start/routes";
import { DecoPageRenderer } from "@decocms/start/hooks";

const baseConfig = cmsRouteConfig({
  siteName: "Blog",
  defaultTitle: "Blog",
});

const routeConfig = withSiteGlobals(baseConfig);

export const Route = createFileRoute("/")({
  ...routeConfig,
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData() as Record<string, any> | null;
  if (!data) return null;

  return (
    <DecoPageRenderer
      sections={data.resolvedSections ?? []}
      deferredSections={data.deferredSections ?? []}
      deferredPromises={data.deferredPromises}
      pagePath={data.pagePath}
      pageUrl={data.pageUrl}
      loadDeferredSectionFn={deferredSectionLoader}
    />
  );
}
