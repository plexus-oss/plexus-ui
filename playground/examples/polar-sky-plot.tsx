"use client";

import { PolarSkyPlot } from "@plexusui/components/charts/polar-sky-plot";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Demo data
// ============================================================================

const CPH = { lat: 55.62, lng: 12.65 };

const PASS_EPOCH = Date.UTC(2024, 0, 1, 12, 23, 0);

const SATELLITES = [
  {
    id: "iss",
    label: "ISS",
    color: "#e0457b",
    tle: {
      line1: "1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9000",
      line2: "2 25544  51.6400 208.9163 0006317  69.9862 290.1962 15.49380999000009",
    },
  },
  {
    id: "noaa-19",
    label: "NOAA-19",
    color: "#5b9bd5",
    tle: {
      line1: "1 33591U 09005A   24001.50000000  .00000098  00000-0  790-4 0  9991",
      line2: "2 33591  99.1890  45.2000 0014000 100.0000 260.2000 14.12500000  9990",
    },
  },
];

// ============================================================================
// Examples
// ============================================================================

function NextPassExample() {
  return (
    <ComponentPreview
      title="Next-Pass Sky Plot"
      description="The current or next pass for each satellite over a ground station — North up, the horizon at the rim, the zenith at the centre. Time-ticks are UTC; the filled marker is the live position."
      code={`import { PolarSkyPlot } from "@plexusui/components/charts/polar-sky-plot";

<PolarSkyPlot
  observer={{ lat: 55.62, lng: 12.65 }}
  satellites={[
    { id: "iss", label: "ISS", tle: { line1, line2 } },
    { id: "noaa-19", label: "NOAA-19", tle: { line1, line2 } },
  ]}
/>`}
      preview={
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <PolarSkyPlot observer={CPH} satellites={SATELLITES} epochOverride={PASS_EPOCH} />
          </div>
        </div>
      }
    />
  );
}

function ElevationMaskExample() {
  return (
    <ComponentPreview
      title="Elevation Mask"
      description="Only count a pass once the satellite clears 10° elevation — useful when terrain or antenna limits block the lower sky."
      code={`<PolarSkyPlot
  observer={{ lat: 55.62, lng: 12.65 }}
  satellites={satellites}
  minElevation={10}
/>`}
      preview={
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <PolarSkyPlot
              observer={CPH}
              satellites={SATELLITES}
              minElevation={10}
              epochOverride={PASS_EPOCH}
            />
          </div>
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const props: ApiProp[] = [
  {
    name: "observer",
    type: "{ lat: number; lng: number; altKm?: number }",
    default: "required",
    description: "Ground-station location the look-angles are computed from.",
  },
  {
    name: "satellites",
    type: "SkyPlotSatellite[]",
    default: "[]",
    description: "Satellites to plot (TLE per object), each with an optional colour/label.",
  },
  {
    name: "minElevation",
    type: "number",
    default: "0",
    description: "Minimum elevation (deg) that counts as a visible pass.",
  },
  {
    name: "searchForwardMin",
    type: "number",
    default: "360",
    description: "How far ahead (minutes) to search for the next pass.",
  },
  {
    name: "searchBackMin",
    type: "number",
    default: "20",
    description: "How far back (minutes) to catch an in-progress pass.",
  },
  {
    name: "epochOverride",
    type: "number",
    default: "undefined",
    description: "Freeze the plot at this epoch (ms). Omit for live tracking.",
  },
  {
    name: "updateIntervalMs",
    type: "number",
    default: "1000",
    description: "Live recompute interval. Ignored when epochOverride is set.",
  },
];

export function PolarSkyPlotExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <NextPassExample />
        <ElevationMaskExample />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Azimuth/elevation sky plot of satellite passes from a ground station, driven by SGP4
            look-angles.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">PolarSkyPlot</h3>
          <ApiReferenceTable props={props} />
        </div>
      </div>
    </div>
  );
}

export default PolarSkyPlotExamples;
