"use client";

import { EphemerisCard } from "@plexusui/components/charts/ephemeris-card";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Demo TLEs
// ============================================================================

const ISS_TLE = {
  line1: "1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9000",
  line2: "2 25544  51.6400 208.9163 0006317  69.9862 290.1962 15.49380999000009",
};

// GOES-16 — a geostationary weather satellite (near-zero inclination, ~1436 min period).
const GOES16_TLE = {
  line1: "1 41866U 16071A   24001.50000000 -.00000267  00000-0  00000-0 0  9994",
  line2: "2 41866   0.0184  85.3590 0000406 296.4827 138.6981  1.00271419 26475",
};

// ============================================================================
// Examples
// ============================================================================

function LowEarthOrbitExample() {
  return (
    <ComponentPreview
      title="Low Earth Orbit (ISS)"
      description="Classical orbital elements derived from a TLE — period, apogee/perigee, inclination, RAAN, eccentricity and more. Pure DOM/SVG, no canvas."
      code={`import { EphemerisCard } from "@plexusui/components/charts/ephemeris-card";

<EphemerisCard
  name="ISS (ZARYA)"
  tle={{
    line1: "1 25544U 98067A   24001.50000000 ...",
    line2: "2 25544  51.6400 208.9163 0006317 ...",
  }}
/>`}
      preview={
        <div className="w-full max-w-2xl">
          <EphemerisCard name="ISS (ZARYA)" tle={ISS_TLE} />
        </div>
      }
    />
  );
}

function GeostationaryExample() {
  return (
    <ComponentPreview
      title="Geostationary Orbit (GOES-16)"
      description="The same readout for a geostationary weather satellite — note the ~24h period, near-zero inclination, and ~35,800 km altitude."
      code={`import { EphemerisCard } from "@plexusui/components/charts/ephemeris-card";

<EphemerisCard
  name="GOES-16"
  tle={{
    line1: "1 41866U 16071A   24001.50000000 ...",
    line2: "2 41866   0.0184  85.3590 0000406 ...",
  }}
/>`}
      preview={
        <div className="w-full max-w-2xl">
          <EphemerisCard name="GOES-16" tle={GOES16_TLE} />
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const ephemerisCardProps: ApiProp[] = [
  {
    name: "tle",
    type: "{ line1: string; line2: string }",
    default: "required",
    description: "Two-Line Element set the orbital elements are derived from.",
  },
  {
    name: "name",
    type: "string",
    default: "undefined",
    description: "Optional object name shown in the card header.",
  },
  {
    name: "className",
    type: "string",
    default: "undefined",
    description: "Additional CSS classes for the container.",
  },
];

export function EphemerisCardExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <LowEarthOrbitExample />
        <GeostationaryExample />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            A SatCat-style readout of classical orbital elements derived from a TLE.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">EphemerisCard</h3>
          <ApiReferenceTable props={ephemerisCardProps} />
        </div>
      </div>
    </div>
  );
}

export default EphemerisCardExamples;
