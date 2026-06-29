"use client";

import { lazy, Suspense } from "react";

const MissionDashboard = lazy(() =>
  import("@/components/mission-dashboard").then((m) => ({
    default: m.MissionDashboard,
  }))
);

function DashboardLoader() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center bg-[#06080c] font-mono text-sm text-zinc-500">
      <span className="animate-pulse">Acquiring mission link…</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-full bg-[#06080c]">
      <Suspense fallback={<DashboardLoader />}>
        <MissionDashboard />
      </Suspense>
    </div>
  );
}
