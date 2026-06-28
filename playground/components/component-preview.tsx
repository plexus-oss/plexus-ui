"use client";

import { useState } from "react";
import CodePlayground from "@/components/code-playground";

interface ComponentPreviewProps {
  preview: React.ReactNode;
  code: string;
  title?: string;
  description?: string;
}

export function ComponentPreview({ preview, code, title, description }: ComponentPreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  return (
    <div className="space-y-3 w-full">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {description && <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "preview"
              ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
              : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("code")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "code"
              ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
              : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          Code
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "preview" && (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-white dark:bg-zinc-950 overflow-auto">
            {preview}
          </div>
        )}
        {activeTab === "code" && (
          <div className="rounded-lg overflow-hidden">
            <CodePlayground initialCode={code} />
          </div>
        )}
      </div>
    </div>
  );
}
