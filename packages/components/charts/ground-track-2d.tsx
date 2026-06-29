"use client";

/**
 * GroundTrack2D — an equirectangular world map for satellite tracking.
 *
 * A flat (plate-carrée) projection over a satellite basemap with a lat/lng
 * graticule, a live day/night terminator, sub-satellite ground tracks, coverage
 * footprints, pass time-ticks, and ground-station markers. Tracks are propagated
 * with SGP4 from each satellite's TLE. Pure SVG — no WebGL.
 *
 * @example
 * ```tsx
 * import { GroundTrack2D } from "@plexusui/components/charts/ground-track-2d";
 *
 * <GroundTrack2D
 *   satellites={[{ id: "iss", label: "ISS", tle: { line1, line2 } }]}
 *   groundStations={[{ id: "cph", lat: 55.6, lng: 12.6, label: "CPH" }]}
 *   mapImageUrl="/textures/earth/day.webp"
 * />
 * ```
 *
 * @module ground-track-2d
 */

import { useEffect, useId, useMemo, useState } from "react";
import {
  EARTH_RADIUS_KM,
  generateGroundTrack,
  getOrbitalElements,
  type LatLng,
  subsolarPoint,
} from "../lib/orbital";
import { cn } from "../lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface GroundTrack2DSatellite {
  /** Stable identifier. */
  id: string;
  /** Two-Line Element set — propagated with SGP4. */
  tle: { line1: string; line2: string };
  /** Marker / track colour (CSS). */
  color?: string;
  /** Optional label drawn next to the marker. */
  label?: string;
  /** Draw the sub-satellite ground track. @default true */
  showTrack?: boolean;
  /** Draw the coverage footprint around the sub-point. @default true */
  showFootprint?: boolean;
}

export interface GroundStation2D {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  label?: string;
}

export interface GroundTrack2DProps {
  /** Satellites to track. */
  satellites?: GroundTrack2DSatellite[];
  /** Fixed ground-station markers. */
  groundStations?: GroundStation2D[];
  /** Equirectangular basemap image URL (2:1). Omit for a plain dark map. */
  mapImageUrl?: string;
  /** Container width. @default "100%" */
  width?: number | string;
  /** Container height. Omit to derive a 2:1 box from the width. */
  height?: number | string;
  /** Draw the lat/lng graticule. @default true */
  showGraticule?: boolean;
  /** Shade the night side with a live day/night terminator. @default true */
  showTerminator?: boolean;
  /** Draw HH:MM time-ticks along each ground track. @default true */
  showTimeTicks?: boolean;
  /** Total track length, minutes (centred on the current time). @default 100 */
  trackDurationMin?: number;
  /** Live recompute interval, ms. @default 1000 */
  updateIntervalMs?: number;
  /** Freeze time at this epoch (ms). Omit for live tracking. */
  epochOverride?: number;
  /** Draw the lat/lng degree labels along the edges. @default true */
  showLabels?: boolean;
  /** Optional observer/context label drawn top-left (e.g. a station name). */
  observerLabel?: string;
  /** Map background colour (shown if no basemap). @default "#0a0f1a" */
  backgroundColor?: string;
  /** Container class name. */
  className?: string;
}

// ============================================================================
// Projection (plate carrée) — SVG user space is the 360×180 lng/lat grid.
// ============================================================================

const W = 360;
const H = 180;
const DEFAULT_SAT_COLOR = "#22d3ee";
const DEFAULT_STATION_COLOR = "#f59e0b";

const projX = (lng: number) => lng + 180;
const projY = (lat: number) => 90 - lat;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Wrap a longitude into [-180, 180]. */
function wrapLng(lng: number): number {
  let l = ((lng + 180) % 360) - 180;
  if (l < -180) l += 360;
  return l;
}

/**
 * Project a lat/lng polyline to SVG paths, splitting wherever it crosses the
 * antimeridian (a >180° jump in longitude) so lines don't streak across the map.
 */
function polylineToPaths(points: LatLng[]): string[] {
  const paths: string[] = [];
  let cur: string[] = [];
  let prevX: number | null = null;
  for (const p of points) {
    const x = projX(wrapLng(p.lng));
    const y = projY(p.lat);
    if (prevX !== null && Math.abs(x - prevX) > W / 2) {
      if (cur.length > 1) paths.push(cur.join(" "));
      cur = [];
    }
    cur.push(`${cur.length === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
    prevX = x;
  }
  if (cur.length > 1) paths.push(cur.join(" "));
  return paths;
}

/** Boundary of a small circle of angular radius `radiusDeg` around (lat,lng). */
function smallCircle(lat: number, lng: number, radiusDeg: number, steps = 96): LatLng[] {
  const lat0 = rad(lat);
  const lng0 = rad(lng);
  const c = rad(radiusDeg);
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const b = (i / steps) * 2 * Math.PI;
    const sinLat = Math.sin(lat0) * Math.cos(c) + Math.cos(lat0) * Math.sin(c) * Math.cos(b);
    const latP = Math.asin(Math.max(-1, Math.min(1, sinLat)));
    const lngP =
      lng0 +
      Math.atan2(
        Math.sin(b) * Math.sin(c) * Math.cos(lat0),
        Math.cos(c) - Math.sin(lat0) * Math.sin(latP)
      );
    pts.push({ lat: deg(latP), lng: deg(lngP) });
  }
  return pts;
}

/** Footprint angular radius (deg) for a circular orbit at `altKm`. */
function footprintRadiusDeg(altKm: number): number {
  return deg(Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + Math.max(altKm, 1))));
}

/**
 * Night-side polygon from the analytic terminator. For each longitude the
 * day/night boundary latitude is `atan(-cos(Δlng) / tan(subsolarLat))`; the dark
 * hemisphere is closed off along the appropriate pole edge.
 */
function terminatorNightPath(date: Date): string | null {
  const sun = subsolarPoint(date);
  const tanSun = Math.tan(rad(sun.lat));
  if (Math.abs(tanSun) < 1e-3) return null; // sun near equator → degenerate
  const pts: Array<[number, number]> = [];
  for (let lng = -180; lng <= 180; lng += 2) {
    const latTerm = deg(Math.atan(-Math.cos(rad(lng - sun.lng)) / tanSun));
    pts.push([projX(lng), projY(latTerm)]);
  }
  // Sun in the north → south is dark (close along the bottom edge), and vice versa.
  const poleY = sun.lat >= 0 ? H : 0;
  const d = [`M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`];
  for (let i = 1; i < pts.length; i++) d.push(`L${pts[i][0].toFixed(2)},${pts[i][1].toFixed(2)}`);
  d.push(`L${W},${poleY}`, `L0,${poleY}`, "Z");
  return d.join(" ");
}

function fmtUTC(ms: number): string {
  return new Date(ms).toISOString().slice(11, 16);
}

// ============================================================================
// Component
// ============================================================================

export function GroundTrack2D({
  satellites = [],
  groundStations = [],
  mapImageUrl,
  width = "100%",
  height,
  showGraticule = true,
  showTerminator = true,
  showTimeTicks = true,
  showLabels = true,
  observerLabel,
  trackDurationMin = 100,
  updateIntervalMs = 1000,
  epochOverride,
  backgroundColor = "#0a0f1a",
  className,
}: GroundTrack2DProps) {
  const reactId = useId();
  const basemapFilterId = `gt-basemap-${reactId}`;
  const [now, setNow] = useState(() => epochOverride ?? 0);

  // Live clock (frozen when epochOverride is set). Seeds `now` on mount so SSR
  // and first paint agree (Date is only read inside the effect).
  useEffect(() => {
    if (epochOverride != null) {
      setNow(epochOverride);
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), updateIntervalMs);
    return () => clearInterval(id);
  }, [epochOverride, updateIntervalMs]);

  const tracks = useMemo(() => {
    if (!now) return [];
    const start = now - trackDurationMin * 30_000; // centre the track on `now`
    return satellites.map((sat) => {
      const color = sat.color ?? DEFAULT_SAT_COLOR;
      const segments = 160;
      const pts = generateGroundTrack(sat.tle, trackDurationMin, segments, start);
      const sub = generateGroundTrack(sat.tle, 0, 1, now)[0] ?? null;
      let footprintDeg = 0;
      try {
        footprintDeg = footprintRadiusDeg(
          getOrbitalElements(sat.tle.line1, sat.tle.line2).altitude
        );
      } catch {
        footprintDeg = 0;
      }
      // Time-ticks at a few evenly spaced points along the track.
      const ticks =
        showTimeTicks && pts.length > 1
          ? [0.0, 0.25, 0.5, 0.75, 1.0].map((f) => {
              const idx = Math.min(pts.length - 1, Math.round(f * (pts.length - 1)));
              return { p: pts[idx], t: start + f * trackDurationMin * 60_000 };
            })
          : [];
      return { sat, color, pts, sub, footprintDeg, ticks };
    });
  }, [satellites, now, trackDurationMin, showTimeTicks]);

  const nightPath = useMemo(
    () => (showTerminator && now ? terminatorNightPath(new Date(now)) : null),
    [showTerminator, now]
  );

  const style: React.CSSProperties = {
    width,
    height,
    aspectRatio: height ? undefined : "2 / 1",
    backgroundColor,
  };

  // Label outline so text stays legible over any basemap.
  const textOutline = { paintOrder: "stroke" as const };
  const lngLabels = [-120, -90, -60, -30, 0, 30, 60, 90, 120];
  const latLabels = [60, 30, -30, -60];

  return (
    <div
      className={cn("relative overflow-hidden rounded-md border border-white/[0.08]", className)}
      style={style}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Satellite ground-track map"
      >
        <title>Satellite ground-track map</title>

        <defs>
          {/* Mute + darken the basemap to a dark satellite-imagery look. */}
          <filter id={basemapFilterId} x="0" y="0" width="100%" height="100%">
            <feColorMatrix type="saturate" values="0.42" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.66" />
              <feFuncG type="linear" slope="0.7" />
              <feFuncB type="linear" slope="0.82" />
            </feComponentTransfer>
          </filter>
        </defs>

        {mapImageUrl ? (
          <image
            href={mapImageUrl}
            x={0}
            y={0}
            width={W}
            height={H}
            preserveAspectRatio="none"
            filter={`url(#${basemapFilterId})`}
          />
        ) : (
          <rect x={0} y={0} width={W} height={H} fill="#0a0f1a" />
        )}

        {/* Day/night terminator */}
        {nightPath && <path d={nightPath} fill="#02040a" opacity={0.35} />}

        {/* Graticule */}
        {showGraticule && (
          <g stroke="#9fb3d0" strokeOpacity={0.16} vectorEffect="non-scaling-stroke">
            {Array.from({ length: 11 }, (_, i) => -150 + i * 30).map((lng) => (
              <line
                key={`v${lng}`}
                x1={projX(lng)}
                y1={0}
                x2={projX(lng)}
                y2={H}
                strokeWidth={0.6}
              />
            ))}
            {Array.from({ length: 5 }, (_, i) => -60 + i * 30).map((lat) => (
              <line
                key={`h${lat}`}
                x1={0}
                y1={projY(lat)}
                x2={W}
                y2={projY(lat)}
                strokeWidth={0.6}
              />
            ))}
            <line
              x1={0}
              y1={projY(0)}
              x2={W}
              y2={projY(0)}
              strokeWidth={0.8}
              strokeOpacity={0.32}
            />
          </g>
        )}

        {/* Coverage footprints — the hero layer. Filled only when the boundary
            doesn't wrap (a wrapped/pole footprint is split into open arcs). */}
        {tracks.map(({ sat, color, sub, footprintDeg }) => {
          if (sat.showFootprint === false || !sub || footprintDeg <= 0) return null;
          const paths = polylineToPaths(smallCircle(sub.lat, sub.lng, footprintDeg));
          const single = paths.length === 1;
          return (
            <g key={`fp-${sat.id}`}>
              {paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill={single ? color : "none"}
                  fillOpacity={single ? 0.13 : 0}
                  stroke={color}
                  strokeOpacity={0.95}
                  strokeWidth={1.4}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          );
        })}

        {/* Ground tracks (subtle, under the markers) */}
        {tracks.map(({ sat, color, pts }) =>
          sat.showTrack !== false
            ? polylineToPaths(pts).map((d, i) => (
                <path
                  key={`tr-${sat.id}-${i}`}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.55}
                  strokeWidth={1}
                  strokeDasharray="3 2.5"
                  vectorEffect="non-scaling-stroke"
                />
              ))
            : null
        )}

        {/* Time-tick dots */}
        {tracks.flatMap(({ sat, color, ticks }) =>
          ticks.map((tk, i) => (
            <circle
              key={`tk-${sat.id}-${i}`}
              cx={projX(wrapLng(tk.p.lng))}
              cy={projY(tk.p.lat)}
              r={0.6}
              fill={color}
              opacity={0.85}
            />
          ))
        )}

        {/* Ground stations — crosshair reticle */}
        {groundStations.map((gs) => {
          const x = projX(wrapLng(gs.lng));
          const y = projY(gs.lat);
          const color = gs.color ?? DEFAULT_STATION_COLOR;
          return (
            <g key={`gs-${gs.id}`} vectorEffect="non-scaling-stroke">
              <circle
                cx={x}
                cy={y}
                r={2}
                fill="none"
                stroke={color}
                strokeOpacity={0.85}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={x} cy={y} r={0.7} fill={color} />
            </g>
          );
        })}

        {/* Satellite sub-points */}
        {tracks.map(({ sat, color, sub }) => {
          if (!sub) return null;
          const x = projX(wrapLng(sub.lng));
          const y = projY(sub.lat);
          return (
            <g key={`sat-${sat.id}`}>
              <circle cx={x} cy={y} r={2.4} fill={color} opacity={0.22} />
              <circle
                cx={x}
                cy={y}
                r={1}
                fill="#fff"
                stroke={color}
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}

        {/* ── Labels (drawn last, on top) ── */}

        {/* Longitude / latitude degree labels */}
        {showLabels && (
          <g fill="#7c8ba1" fontSize={3} className="font-mono">
            {lngLabels.map((lng) => (
              <text key={`lx${lng}`} x={projX(lng)} y={H - 2} textAnchor="middle">
                {lng}°
              </text>
            ))}
            {latLabels.map((lat) => (
              <text key={`ly${lat}`} x={2} y={projY(lat) - 1}>
                {lat}°
              </text>
            ))}
          </g>
        )}

        {/* Time-tick labels */}
        {showTimeTicks &&
          tracks.flatMap(({ sat, ticks }) =>
            ticks.map((tk, i) => (
              <text
                key={`tkl-${sat.id}-${i}`}
                x={projX(wrapLng(tk.p.lng)) + 1.6}
                y={projY(tk.p.lat) - 1.2}
                fontSize={2.6}
                fill="#cbd5e1"
                className="font-mono"
                stroke="#000"
                strokeWidth={0.6}
                style={textOutline}
              >
                {fmtUTC(tk.t)}
              </text>
            ))
          )}

        {/* Ground-station labels */}
        {groundStations.map((gs) =>
          gs.label ? (
            <text
              key={`gsl-${gs.id}`}
              x={projX(wrapLng(gs.lng)) + 2.8}
              y={projY(gs.lat) + 1.1}
              fontSize={3}
              fill="#e2e8f0"
              stroke="#000"
              strokeWidth={0.7}
              style={textOutline}
            >
              {gs.label}
            </text>
          ) : null
        )}

        {/* Satellite labels */}
        {tracks.map(({ sat, color, sub }) =>
          sub && sat.label ? (
            <text
              key={`satl-${sat.id}`}
              x={projX(wrapLng(sub.lng)) + 3}
              y={projY(sub.lat) + 1.1}
              fontSize={3.4}
              fontWeight={600}
              fill={color}
              stroke="#000"
              strokeWidth={0.7}
              style={textOutline}
            >
              {sat.label}
            </text>
          ) : null
        )}

        {/* Observer / context label, top-left */}
        {observerLabel && (
          <text
            x={3}
            y={5.5}
            fontSize={3.4}
            fill="#e2e8f0"
            stroke="#000"
            strokeWidth={0.7}
            style={textOutline}
          >
            {observerLabel}
          </text>
        )}
      </svg>
    </div>
  );
}

export default GroundTrack2D;
