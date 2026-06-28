"use client";

import { ColorSchemeProvider } from "@/components/color-scheme-provider";
import { Sidenav } from "@/components/sidenav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopNav } from "@/components/top-nav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ColorSchemeProvider>{children}</ColorSchemeProvider>
    </ThemeProvider>
  );
}
