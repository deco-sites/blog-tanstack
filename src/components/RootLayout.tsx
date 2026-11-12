import type { ReactNode } from "react";
import { HeadContent, Scripts, ScrollRestoration } from "@tanstack/react-router";
import { DecoPreview } from "@decocms/tanstack/react";
import { NavigationProgress } from "./NavigationProgress";
import { StableOutlet } from "./StableOutlet";

export interface RootLayoutProps {
  lang?: string;
  /** The site's name in deco Studio: the "." shortcut opens the page in Studio under it. */
  siteName: string;
  dataTheme?: string;
  bodyClassName?: string;
  children?: ReactNode;
}

export function RootLayout({
  lang = "pt-BR",
  siteName,
  dataTheme = "light",
  bodyClassName = "bg-white text-[#1a1a18]",
  children,
}: RootLayoutProps) {
  return (
    <html lang={lang} data-theme={dataTheme} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className={bodyClassName} suppressHydrationWarning>
        <a
          href="#main-content"
          className="skip-to-main"
        >
          Pular para o conteúdo principal
        </a>
        <NavigationProgress />
        <main id="main-content">
          <StableOutlet />
        </main>
        {children}
        {/* The v8 Studio bridge: Studio's editor channel (it selects the sections by their
            data-manifest-key), the draft notice and the "." shortcut that opens the page in Studio.
            Tailwind reads this file: a daisyUI component name in a comment adds its rules to the CSS. */}
        <DecoPreview site={siteName} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
