"use client";

import Link from "next/link";
import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";

const TelemetryDemo = lazy(() =>
  import("@/components/telemetry-demo").then((m) => ({
    default: m.TelemetryDemo,
  })),
);

function DemoLoader() {
  return (
    <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
      Loading...
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="py-12">
            <h1 className="text-4xl md:text-5xl mb-4">
              Components for Physical Systems
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-2">
              Handle 100k+ data points at 60fps. Built for real-time sensor
              data, telemetry, and streaming hardware systems.
            </p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              WebGPU-powered • Zero-copy buffers • Free & Open Source
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <Suspense fallback={<DemoLoader />}>
          <TelemetryDemo />
        </Suspense>

        <div className="max-w-3xl mx-auto text-center pt-12 space-y-4">
          <p className="text-lg">
            Ready to use these components in your project?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild variant="default" size="lg">
              <Link href="https://github.com/plexus-oss/ui">
                View on GitHub
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="https://plexus.company">See Full Platform</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Free & Open Source (MIT) • Copy-paste components • WebGPU
            accelerated
          </p>
        </div>
      </div>
    </div>
  );
}
