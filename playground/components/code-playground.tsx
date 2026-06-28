"use client";

import { CopyButton } from "@/components/copy-button";

type CodePlaygroundProps = {
  initialCode: string;
};

export default function CodePlayground({ initialCode = `` }: CodePlaygroundProps) {
  const lines = initialCode.split("\n");

  return (
    <div className="relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      {/* Copy button */}
      <div className="absolute top-3 right-3 z-10">
        <CopyButton copyText={initialCode} />
      </div>

      {/* Code content */}
      <div className="flex text-sm font-mono">
        {/* Line numbers */}
        <div className="flex-shrink-0 text-right py-4 px-4 text-zinc-400 dark:text-zinc-600 bg-zinc-100/50 dark:bg-zinc-950/50 border-r border-zinc-200 dark:border-zinc-800 select-none">
          <div className="flex flex-col">
            {lines.map((_, i) => (
              <div key={i} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Code */}
        <div className="flex-1 overflow-x-auto py-4 px-4">
          <div className="flex flex-col">
            {lines.map((line, i) => (
              <div key={i} className="leading-6 whitespace-pre text-zinc-800 dark:text-zinc-200">
                {line || "\u00A0"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
