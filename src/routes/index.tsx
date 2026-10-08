import { createFileRoute } from "@tanstack/react-router";
import { cmsHomeRouteConfig, DecoPageRenderer } from "@decocms/tanstack";
import { deferredSectionLoader } from "@decocms/tanstack/sdk/deferredSectionLoader";

const routeConfig = cmsHomeRouteConfig({
  siteName: "Blog",
  defaultTitle: "Blog",
});

export const Route = createFileRoute("/")({
  ...routeConfig,
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData() as Record<string, any> | null;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-sm text-base-content/40 mt-2">No CMS page found for /</p>
        </div>
      </div>
    );
  }

  return (
    <DecoPageRenderer
      device={data.device}
      sections={data.resolvedSections ?? []}
      deferredSections={data.deferredSections ?? []}
      deferredPromises={data.deferredPromises}
      pagePath={data.pagePath}
      pageUrl={data.pageUrl}
      loadDeferredSectionFn={deferredSectionLoader}
    />
  );
}
