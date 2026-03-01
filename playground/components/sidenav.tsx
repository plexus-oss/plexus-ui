"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { components } from "@/constants/components";

export const Sidenav = () => {
  const params = useParams();
  const componentId = params.component as string;

  const freeComponents = components.filter((comp) => comp.tier !== "pro");

  // Get unique categories from components
  const categories = Array.from(new Set(freeComponents.map((comp) => comp.category))).sort();

  return (
    <aside className="w-52 flex-shrink-0  bg-background overflow-y-auto">
      <nav className="p-4 pt-6">
        <div className="space-y-1">
          {categories.map((category) => (
            <div key={category}>
              <div className="mt-6 mb-2 px-3 text-xs font-geist-mono uppercase font-semibold text-zinc-400 dark:text-zinc-600 ">
                {category}
              </div>
              <div className="flex flex-col gap-1">
                {freeComponents
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
          ))}
        </div>
      </nav>
    </aside>
  );
};
