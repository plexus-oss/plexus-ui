"use client";

import { ColorSchemeProvider } from "@/components/color-scheme-provider";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ColorSchemeProvider>{children}</ColorSchemeProvider>
    </ThemeProvider>
  );
}
