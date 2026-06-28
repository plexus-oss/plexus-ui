/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
"use client";

import { useParams } from "next/navigation";
import { lazy, Suspense, useMemo } from "react";
import { CopyButton } from "@/components/copy-button";
import { Footer } from "@/components/footer";
import { components } from "@/constants/components";

/**
 * Auto-discover example components by convention
 * Converts component-id to PascalCase + "Examples"
 * Falls back to default export if named export doesn't exist
 */
function loadExampleComponent(componentId: string): React.ComponentType | null {
  const exportName =
    componentId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") + "Examples";

  return lazy(() =>
    import(`@/examples/${componentId}`)
      .then((module) => ({
        // Try the named export first, fall back to default export
        default: module[exportName] || module.default,
      }))
      .catch(() => ({
        default: () => null,
      }))
  );
}

export default function ComponentPage() {
  const params = useParams();
  const componentId = params.component as string;

  const component = useMemo(() => components.find((c) => c.id === componentId), [componentId]);

  const ExampleComponent = useMemo(() => loadExampleComponent(componentId), [componentId]);
  if (!component) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Component not found</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            The component "{componentId}" does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{component.name}</h1>
        {component.description && (
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl">
            {component.description}
          </p>
        )}
      </div>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Installation</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-zinc-600  dark:text-zinc-400 mb-2">
              Copy and paste the following code into your project.
            </p>
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md p-2">
              <div className="flex items-center justify-between gap-2">
                <pre className="text-sm font-geist-mono text-emerald-600 dark:text-emerald-400">
                  npx plexus-ui add {componentId}
                </pre>
                <CopyButton hideText copyText={`npx plexus-ui add ${componentId}`} />
              </div>
            </div>
          </div>
          <div>
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Manual Installation
              </summary>
              <div className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  1. Copy the component code from{" "}
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded">
                    components/{componentId}.tsx
                  </code>
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">2. Install dependencies:</p>
                <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3">
                  <pre className="text-xs">npm install react@latest</pre>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  3. Copy any required primitive components
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {ExampleComponent ? (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Examples</h2>
          <Suspense fallback={<div className="text-zinc-500">Loading example...</div>}>
            <ExampleComponent />
          </Suspense>
        </section>
      ) : null}
      {component.textures && component.textures.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Texture Maps</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Download the required texture maps for this component.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {component.textures.map((texture: string) => {
              const textureName = texture.split("/").pop() || texture;
              return (
                <a
                  key={texture}
                  href={texture}
                  download={textureName}
                  className="group relative aspect-square border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                >
                  <img src={texture} alt={textureName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg
                        className="w-8 h-8 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      <span className="text-xs font-medium">{textureName}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
}
