"use client";

import { usePathname } from "next/navigation";
import { Sidenav } from "@/components/sidenav";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  if (isHomePage) {
    return <main className="flex-1 overflow-y-auto bg-background">{children}</main>;
  }

  return (
    <>
      <Sidenav />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </>
  );
}
