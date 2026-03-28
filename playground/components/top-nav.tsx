import { Github } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ColorSchemeToggle } from "./color-scheme-toggle";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export const TopNav = () => {
  return (
    <div className="flex-shrink-0 flex flex-row w-full items-center justify-between gap-4 px-6 h-14 bg-background">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/line-chart"
            className="hover:text-foreground/80 transition-colors"
          >
            Components
          </Link>
          <Link
            href="/docs"
            className="hover:text-foreground/80 transition-colors"
          >
            Docs
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <ColorSchemeToggle />
        <ThemeToggle />
        <Link
          href="https://github.com/plexus-oss/ui"
          className="cursor-pointer"
          target="_blank"
        >
          <Button variant="ghost" size="sm">
            <Github />
          </Button>
        </Link>
      </div>
    </div>
  );
};
