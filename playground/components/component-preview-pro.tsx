"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ComponentPreviewProProps {
  preview: React.ReactNode;
  title?: string;
  description?: string;
}

export function ComponentPreviewPro({ preview, title, description }: ComponentPreviewProProps) {
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
          <Lock className="inline-block ml-1.5 w-3.5 h-3.5" />
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
          <div className="border border-zinc-200 dark:border-zinc-950 rounded-lg p-12 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-center space-y-4">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Pro Component
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
                This component is part of our Pro tier. Source code and CLI installation are
                available with a Pro license.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Learn More About Pro
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
