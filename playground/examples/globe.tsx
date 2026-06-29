"use client";

import { Globe, type SatelliteInput } from "@plexusui/components/charts/globe";
import { useMemo } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Demo data
// ============================================================================

// Real Earth maps. Supplying all four (day + night + clouds + bump) switches the
// globe to its day/night terminator shader: lit geography on the sun side, city
// lights on the dark side, clouds, and relief — with the terminator placed at the
// real subsolar point for the current time.
const EARTH_TEXTURES = {
  textureUrl: "/textures/earth/day.webp",
  nightTextureUrl: "/textures/earth/night.webp",
  cloudsTextureUrl: "/textures/earth/clouds.webp",
  bumpTextureUrl: "/textures/earth/bump.webp",
};

// ISS (ZARYA) — a real TLE, propagated with SGP4.
const ISS: SatelliteInput = {
  id: "iss",
  label: "ISS (ZARYA)",
  color: "#22d3ee",
  tle: {
    line1: "1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9000",
    line2: "2 25544  51.6400 208.9163 0006317  69.9862 290.1962 15.49380999000009",
  },
};

// A handful of polar/high-latitude ground stations.
const GROUND_STATIONS = [
  { id: "svalbard", lat: 78.23, lng: 15.39, label: "Svalbard", color: "#f59e0b" },
  { id: "fairbanks", lat: 64.84, lng: -147.72, label: "Fairbanks", color: "#f59e0b" },
  { id: "punta-arenas", lat: -53.16, lng: -70.92, label: "Punta Arenas", color: "#f59e0b" },
  { id: "perth", lat: -31.95, lng: 115.86, label: "Perth", color: "#f59e0b" },
];

/**
 * Build a synthetic LEO constellation from Keplerian elements — `perPlane`
 * satellites evenly phased across `planes` orbital planes. Used to exercise the
 * GPU-points render path (kicks in above `pointsThreshold`, default 30).
 */
function makeConstellation(planes: number, perPlane: number): SatelliteInput[] {
  const sats: SatelliteInput[] = [];
  for (let p = 0; p < planes; p++) {
    const raan = (360 / planes) * p;
    for (let s = 0; s < perPlane; s++) {
      sats.push({
        id: `sat-${p}-${s}`,
        color: "#38bdf8",
        elements: {
          inclination: 53,
          raan,
          orbitalPeriod: 95,
          initialPhase: (360 / perPlane) * s,
          altitudeKm: 550,
        },
      });
    }
  }
  return sats;
}

// ============================================================================
// Examples
// ============================================================================

function SingleSatelliteExample() {
  return (
    <ComponentPreview
      title="Live Satellite Tracking"
      description="A photoreal Earth with a real-time day/night terminator, the ISS propagated with SGP4, its orbital path, sub-satellite ground track, and ground stations. Drag to orbit the camera."
      code={`import { Globe } from "@plexusui/components/charts/globe";

<Globe
  satellites={[
    { id: "iss", label: "ISS (ZARYA)", tle: { line1, line2 } },
  ]}
  groundStations={groundStations}
  textureUrl="/textures/earth/day.webp"
  nightTextureUrl="/textures/earth/night.webp"
  cloudsTextureUrl="/textures/earth/clouds.webp"
  bumpTextureUrl="/textures/earth/bump.webp"
  showOrbitalPaths
  showGroundTracks
  height={500}
/>`}
      preview={
        <div className="w-full">
          <Globe
            {...EARTH_TEXTURES}
            satellites={[ISS]}
            groundStations={GROUND_STATIONS}
            showOrbitalPaths
            showGroundTracks
            height={500}
            enableZoom={false}
          />
        </div>
      }
    />
  );
}

function ConstellationExample() {
  // 12 planes × 12 sats = 144 — well above the GPU-points threshold.
  const satellites = useMemo(() => makeConstellation(12, 12), []);

  return (
    <ComponentPreview
      title="Constellation (GPU Points)"
      description="144 satellites across 12 orbital planes from Keplerian elements. Above the points threshold the globe switches to a single GPU draw and propagates off the main thread."
      code={`import { Globe } from "@plexusui/components/charts/globe";

// 144 satellites across 12 planes
<Globe
  satellites={constellation}
  textureUrl="/textures/earth/day.webp"
  nightTextureUrl="/textures/earth/night.webp"
  cloudsTextureUrl="/textures/earth/clouds.webp"
  bumpTextureUrl="/textures/earth/bump.webp"
  showOrbitalPaths={false}
  pointsThreshold={30}
  height={500}
/>`}
      preview={
        <div className="w-full">
          <Globe
            {...EARTH_TEXTURES}
            satellites={satellites}
            showOrbitalPaths={false}
            height={500}
            enableZoom={false}
          />
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const globeProps: ApiProp[] = [
  {
    name: "satellites",
    type: "SatelliteInput[]",
    default: "[]",
    description: "Objects to plot, each via a TLE (SGP4) or Keplerian elements.",
  },
  {
    name: "groundStations",
    type: "GroundMarker[]",
    default: "[]",
    description: "Fixed surface markers ({ id, lat, lng, color?, label? }).",
  },
  {
    name: "showOrbitalPaths",
    type: "boolean",
    default: "true",
    description: "Draw each satellite's orbital path (identical orbits are deduped).",
  },
  {
    name: "showGroundTracks",
    type: "boolean",
    default: "false",
    description: "Draw sub-satellite ground tracks on the surface.",
  },
  {
    name: "pointsThreshold",
    type: "number",
    default: "30",
    description: "Switch to single-draw GPU points at/above this satellite count.",
  },
  {
    name: "useWorker",
    type: "boolean",
    default: "auto",
    description: "Propagate in a Web Worker. Defaults on above pointsThreshold.",
  },
  {
    name: "textureUrl",
    type: "string",
    default: "undefined",
    description: "Day-surface texture URL. Procedural shading is used if omitted.",
  },
  {
    name: "epochOverride",
    type: "number",
    default: "undefined",
    description: "Freeze propagation at this epoch (ms). Omit for live time.",
  },
  {
    name: "autoRotate",
    type: "boolean",
    default: "false",
    description: "Auto-rotate the camera.",
  },
  {
    name: "height",
    type: "number | string",
    default: '"500px"',
    description: "Container height.",
  },
  {
    name: "onSelectSatellite",
    type: "(id: string) => void",
    default: "undefined",
    description: "Called with a satellite id when its marker is clicked.",
  },
];

export function GlobeExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <SingleSatelliteExample />
        <ConstellationExample />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            3D Earth globe with real-time SGP4 satellite propagation, orbital paths, ground tracks,
            and ground stations.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Globe</h3>
          <ApiReferenceTable props={globeProps} />
        </div>
      </div>
    </div>
  );
}

export default GlobeExamples;
