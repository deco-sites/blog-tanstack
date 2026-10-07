import type { ReactNode } from "react";
import { HeadContent, Scripts, ScrollRestoration } from "@tanstack/react-router";
import { NavigationProgress } from "./NavigationProgress";
import { StableOutlet } from "./StableOutlet";

export interface RootLayoutProps {
  lang?: string;
  dataTheme?: string;
  bodyClassName?: string;
  children?: ReactNode;
}

export function RootLayout({
  lang = "pt-BR",
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
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
