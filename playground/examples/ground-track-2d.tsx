"use client";

import { GroundTrack2D } from "@plexusui/components/charts/ground-track-2d";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Demo data — a few real amateur-radio / weather satellites.
// ============================================================================

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
  {
    id: "metop-b",
    label: "MetOp-B",
    color: "#cbd5e1",
    tle: {
      line1: "1 38771U 12049A   24001.50000000  .00000020  00000-0  18000-4 0  9990",
      line2: "2 38771  98.7000  10.0000 0001500  90.0000 270.0000 14.21500000  9991",
    },
  },
];

const GROUND_STATIONS = [
  { id: "cph", lat: 55.62, lng: 12.65, label: "CPH" },
  { id: "svalbard", lat: 78.23, lng: 15.39, label: "Svalbard" },
];

// ============================================================================
// Examples
// ============================================================================

function TrackingMapExample() {
  return (
    <ComponentPreview
      title="Live Tracking Map"
      description="SGP4 ground tracks over a satellite basemap with coverage footprints, a live day/night terminator, pass time-ticks (UTC), ground stations, and a lat/lng graticule."
      code={`import { GroundTrack2D } from "@plexusui/components/charts/ground-track-2d";

<GroundTrack2D
  satellites={[
    { id: "iss", label: "ISS", tle: { line1, line2 } },
    { id: "noaa-19", label: "NOAA-19", tle: { line1, line2 } },
  ]}
  groundStations={[
    { id: "cph", lat: 55.62, lng: 12.65, label: "CPH" },
  ]}
  mapImageUrl="/textures/earth/day.webp"
/>`}
      preview={
        <div className="w-full">
          <GroundTrack2D
            satellites={SATELLITES}
            groundStations={GROUND_STATIONS}
            mapImageUrl="/textures/earth/day.webp"
          />
        </div>
      }
    />
  );
}

function NoTerminatorExample() {
  return (
    <ComponentPreview
      title="Tracks Only"
      description="The same map with the day/night terminator and time-ticks turned off — just ground tracks, footprints, and markers."
      code={`<GroundTrack2D
  satellites={satellites}
  mapImageUrl="/textures/earth/day.webp"
  showTerminator={false}
  showTimeTicks={false}
/>`}
      preview={
        <div className="w-full">
          <GroundTrack2D
            satellites={SATELLITES}
            groundStations={GROUND_STATIONS}
            mapImageUrl="/textures/earth/day.webp"
            showTerminator={false}
            showTimeTicks={false}
          />
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
    name: "satellites",
    type: "GroundTrack2DSatellite[]",
    default: "[]",
    description: "Satellites to track (TLE per object). Each may toggle its track/footprint.",
  },
  {
    name: "groundStations",
    type: "GroundStation2D[]",
    default: "[]",
    description: "Fixed station markers ({ id, lat, lng, color?, label? }).",
  },
  {
    name: "mapImageUrl",
    type: "string",
    default: "undefined",
    description: "Equirectangular (2:1) basemap image. Omit for a plain dark map.",
  },
  {
    name: "showGraticule",
    type: "boolean",
    default: "true",
    description: "Draw the lat/lng grid.",
  },
  {
    name: "showTerminator",
    type: "boolean",
    default: "true",
    description: "Shade the night side with a live day/night terminator.",
  },
  {
    name: "showTimeTicks",
    type: "boolean",
    default: "true",
    description: "Draw HH:MM (UTC) time-ticks along each ground track.",
  },
  {
    name: "trackDurationMin",
    type: "number",
    default: "100",
    description: "Total track length in minutes, centred on the current time.",
  },
  {
    name: "updateIntervalMs",
    type: "number",
    default: "1000",
    description: "Live recompute interval. Ignored when epochOverride is set.",
  },
  {
    name: "epochOverride",
    type: "number",
    default: "undefined",
    description: "Freeze the map at this epoch (ms). Omit for live tracking.",
  },
];

export function GroundTrack2DExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <TrackingMapExample />
        <NoTerminatorExample />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Equirectangular satellite tracking map with SGP4 ground tracks, coverage footprints, and
            a live day/night terminator.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">GroundTrack2D</h3>
          <ApiReferenceTable props={props} />
        </div>
      </div>
    </div>
  );
}

export default GroundTrack2DExamples;
