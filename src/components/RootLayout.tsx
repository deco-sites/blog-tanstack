import type { ReactNode } from "react";
import { HeadContent, Scripts, ScrollRestoration } from "@tanstack/react-router";
import { LiveControls } from "../vendor/blocks/LiveControls";
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
        {/* v7's editor bridge: click-to-select sections in Studio's preview, and the "." shortcut. */}
        <LiveControls site={siteName} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
