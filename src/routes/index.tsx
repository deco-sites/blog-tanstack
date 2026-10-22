import { createFileRoute } from "@tanstack/react-router";
import { PageBlocks, pageHeaders, pageHref, pageLoaderDeps } from "../components/PageBlocks";
import { loadPage } from "../page.functions";
import { pageHead } from "../seo/head";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => search as Record<string, string>,
  loaderDeps: pageLoaderDeps,
  loader: ({ deps }) => loadPage({ data: { href: pageHref("/", deps.search) } }),
  pendingMs: 200,
  pendingMinMs: 300,
  staleTime: 300_000,
  gcTime: 1_800_000,
  headers: pageHeaders,
  head: ({ loaderData }) => pageHead(loaderData, "Blog", "Blog"),
  component: HomePage,
  notFoundComponent: NoHomePage,
});

function HomePage() {
  const page = Route.useLoaderData();
  return <PageBlocks blocks={page.blocks} />;
}

function NoHomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-sm text-base-content/40 mt-2">No CMS page found for /</p>
      </div>
    </div>
  );
}
