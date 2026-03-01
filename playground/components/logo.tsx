"use client";

import { clsx } from "clsx";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Logo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const darkMode = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fix: Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <SimpleLogo darkMode={darkMode} />
      <span className={clsx(className, "text-md font-semibold")}>Plexus</span>
    </div>
  );
}

export function SimpleLogo({ darkMode = false }: { darkMode?: boolean }) {
  return (
    <Image src={darkMode ? "/white.png" : "/black.png"} alt="Plexus Logo" width={20} height={20} />
  );
}
