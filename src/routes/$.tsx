import { useEffect, useRef } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageBlocks, pageHeaders, pageHref, pageLoaderDeps } from "../components/PageBlocks";
import { loadPage } from "../page.functions";
import { pageHead } from "../seo/head";

export const Route = createFileRoute("/$")({
  // Keep every search param, so they reach loaderDeps (?q=, ?page=).
  validateSearch: (search: Record<string, unknown>) => search as Record<string, string>,
  loaderDeps: pageLoaderDeps,
  loader: ({ params, deps }) => loadPage({ data: { href: pageHref(`/${params._splat ?? ""}`, deps.search) } }),
  pendingMs: 200,
  pendingMinMs: 300,
  staleTime: 60_000,
  gcTime: 300_000,
  headers: pageHeaders,
  head: ({ loaderData }) => pageHead(loaderData, "Blog", "Blog"),
  component: CmsPage,
  notFoundComponent: NotFoundFallback,
});

function CmsPage() {
  const page = Route.useLoaderData();
  const router = useRouter();
  const isPopNavigation = useRef(false);

  useEffect(() => {
    const onPop = () => { isPopNavigation.current = true; };
    window.addEventListener("popstate", onPop);

    const unsub = router.subscribe("onBeforeNavigate", (event) => {
      if (!event.pathChanged) return;
      if (isPopNavigation.current) {
        isPopNavigation.current = false;
        return;
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });

    return () => {
      window.removeEventListener("popstate", onPop);
      unsub();
    };
  }, [router]);

  return <PageBlocks blocks={page.blocks} />;
}

function NotFoundFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-6">
        <h1 className="text-7xl font-bold text-[#e4e3df] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-[#1a1a18] mb-2">Página não encontrada</h2>
        <p className="text-[#7a7a74] mb-8">Esta página não existe ou foi movida.</p>
        <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a18] text-white text-sm font-semibold tracking-wide hover:bg-[#ff6011] transition-colors duration-150 no-underline">
          ← Voltar para o Blog
        </a>
      </div>
    </div>
  );
}
