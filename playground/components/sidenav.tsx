"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { components } from "@/constants/components";

export const Sidenav = () => {
  const params = useParams();
  const componentId = params.component as string;
  const [query, setQuery] = useState("");

  const freeComponents = components.filter((comp) => comp.tier !== "pro");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return freeComponents;
    return freeComponents.filter(
      (comp) =>
        comp.name.toLowerCase().includes(q) ||
        comp.id.toLowerCase().includes(q) ||
        comp.category.toLowerCase().includes(q)
    );
  }, [freeComponents, query]);

  // Get unique categories from the filtered components
  const categories = Array.from(new Set(filtered.map((comp) => comp.category))).sort();

  return (
    <aside className="w-52 flex-shrink-0  bg-background overflow-y-auto">
      <nav className="p-4 pt-6">
        <div className="relative mb-2 px-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components"
            aria-label="Search components"
            className="w-full rounded-md border border-zinc-200 bg-transparent py-1.5 pl-8 pr-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
          />
        </div>

        <div className="space-y-1">
          {categories.length === 0 ? (
            <div className="px-3 py-4 text-xs text-zinc-400 dark:text-zinc-600">
              No components found.
            </div>
          ) : (
            categories.map((category) => (
              <div key={category}>
                <div className="mt-6 mb-2 px-3 text-xs font-geist-mono uppercase font-semibold text-zinc-400 dark:text-zinc-600 ">
                  {category}
                </div>
                <div className="flex flex-col gap-1">
                  {filtered
                    .filter((comp) => comp.category === category)
                    .map((comp) => (
                      <Link key={comp.id} href={`/${comp.id}`} className="w-full">
                        <Button
                          variant="ghost"
                          className={`${
                            comp.id === componentId ? "bg-zinc-200 dark:bg-zinc-800" : ""
                          } cursor-pointer`}
                          size="sm"
                        >
                          {comp.name}
                        </Button>
                      </Link>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </nav>
    </aside>
  );
};
