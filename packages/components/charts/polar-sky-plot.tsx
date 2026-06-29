"use client";

/**
 * PolarSkyPlot — an azimuth/elevation sky chart for satellite passes.
 *
 * A radar-style polar plot of the local sky as seen from a ground station:
 * North at the top, the horizon (0° elevation) at the rim, the zenith (90°) at
 * the centre. For each satellite it finds the current or next pass and draws the
 * arc across the sky with UTC time-ticks, a live position marker, and an Az/El
 * readout. Pass geometry comes from SGP4 look-angles. Pure SVG — no WebGL.
 *
 * @example
 * ```tsx
 * import { PolarSkyPlot } from "@plexusui/components/charts/polar-sky-plot";
 *
 * <PolarSkyPlot
 *   observer={{ lat: 55.62, lng: 12.65 }}
 *   satellites={[{ id: "iss", label: "ISS", tle: { line1, line2 } }]}
 * />
 * ```
 *
 * @module polar-sky-plot
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { getLookAngle } from "../lib/orbital";
import { cn } from "../lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface SkyPlotSatellite {
  /** Stable identifier. */
  id: string;
  /** Two-Line Element set — propagated with SGP4. */
  tle: { line1: string; line2: string };
  /** Arc / marker colour (CSS). */
  color?: string;
  /** Optional label drawn at the live position. */
  label?: string;
}

export interface SkyPlotObserver {
  lat: number;
  lng: number;
  /** Observer altitude, km. @default 0 */
  altKm?: number;
}

export interface PolarSkyPlotProps {
  /** Observer ground station. */
  observer: SkyPlotObserver;
  /** Satellites whose passes to plot. */
  satellites?: SkyPlotSatellite[];
  /** Minimum elevation (deg) that counts as a visible pass. @default 0 */
  minElevation?: number;
  /** How far back to look for an in-progress pass, minutes. @default 20 */
  searchBackMin?: number;
  /** How far ahead to look for the next pass, minutes. @default 360 */
  searchForwardMin?: number;
  /** Square size. @default "100%" (height derived as a square) */
  width?: number | string;
  /** Draw cardinal + elevation labels and the Az/El readout. @default true */
  showLabels?: boolean;
  /** Live recompute interval, ms. @default 1000 */
  updateIntervalMs?: number;
  /** Freeze time at this epoch (ms). Omit for live tracking. */
  epochOverride?: number;
  /** Card background colour. @default "#000000" */
  backgroundColor?: string;
  /** Container class name. */
  className?: string;
}

// ============================================================================
// Geometry — viewBox is a 200×200 square; the sky disk is centred in it.
// ============================================================================

const SIZE = 200;
const CX = 100;
const CY = 100;
const R = 86; // horizon radius
const DEFAULT_SAT_COLOR = "#22d3ee";

function clampEl(el: number): number {
  return Math.max(0, Math.min(90, el));
}

/** Project (azimuth, elevation) in degrees to an x/y point in the disk. */
function project(azDeg: number, elDeg: number): [number, number] {
  const r = ((90 - clampEl(elDeg)) / 90) * R;
  const a = (azDeg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
}

function fmtUTC(ms: number): string {
  return new Date(ms).toISOString().slice(11, 16);
}

/** Format a positive duration (ms) as M:SS or H:MM. */
function fmtDur(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

interface PassSample {
  t: number;
  az: number;
  el: number;
}

/**
 * Find the pass (run of samples with elevation ≥ minEl) that is either in
 * progress at `centerMs` or the next one after it. Returns null if none.
 */
function findPass(
  tle: { line1: string; line2: string },
  observer: SkyPlotObserver,
  centerMs: number,
  backMin: number,
  forwardMin: number,
  minEl: number,
  stepSec = 20
): PassSample[] | null {
  const start = centerMs - backMin * 60_000;
  const end = centerMs + forwardMin * 60_000;
  const stepMs = stepSec * 1000;

  const runs: PassSample[][] = [];
  let cur: PassSample[] | null = null;
  for (let t = start; t <= end; t += stepMs) {
    const la = getLookAngle(tle, observer, new Date(t));
    if (la && la.elevation >= minEl) {
      if (!cur) cur = [];
      cur.push({ t, az: la.azimuth, el: la.elevation });
    } else if (cur) {
      runs.push(cur);
      cur = null;
    }
  }
  if (cur) runs.push(cur);
  if (runs.length === 0) return null;

  const containing = runs.find((r) => r[0].t <= centerMs && r[r.length - 1].t >= centerMs);
  if (containing) return containing;
  return runs.find((r) => r[0].t >= centerMs) ?? null;
}

// ============================================================================
// Component
// ============================================================================

export function PolarSkyPlot({
  observer,
  satellites = [],
  minElevation = 0,
  searchBackMin = 20,
  searchForwardMin = 360,
  width = "100%",
  showLabels = true,
  updateIntervalMs = 1000,
  epochOverride,
  backgroundColor = "#000000",
  className,
}: PolarSkyPlotProps) {
  const [now, setNow] = useState(() => epochOverride ?? 0);

  // Live clock (frozen when epochOverride is set). Date is only read in the
  // effect so SSR and first client paint agree.
  useEffect(() => {
    if (epochOverride != null) {
      setNow(epochOverride);
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), updateIntervalMs);
    return () => clearInterval(id);
  }, [epochOverride, updateIntervalMs]);

  // Pass arcs recompute on a coarse (15s) cadence — the geometry changes slowly.
  // Keyed on `coarse` (not `now`) so the heavier pass search is throttled.
  const coarse = now ? Math.floor(now / 15_000) : 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: throttled by `coarse`, not `now`
  const passes = useMemo(() => {
    if (!now) return [];
    const center = coarse * 15_000;
    return satellites.map((sat) => {
      const color = sat.color ?? DEFAULT_SAT_COLOR;
      let run: PassSample[] | null = null;
      try {
        run = findPass(sat.tle, observer, center, searchBackMin, searchForwardMin, minElevation);
      } catch {
        run = null;
      }
      return { sat, color, run };
    });
  }, [satellites, observer, coarse, searchBackMin, searchForwardMin, minElevation]);

  // Live marker / readout: current look-angle per satellite at `now`.
  const live = useMemo(() => {
    if (!now) return [];
    return passes.map(({ sat, color, run }) => {
      let la: { azimuth: number; elevation: number } | null = null;
      try {
        la = getLookAngle(sat.tle, observer, new Date(now));
      } catch {
        la = null;
      }
      const up = !!la && la.elevation >= minElevation;
      const losMs = up && run ? run[run.length - 1].t - now : null;
      return { sat, color, la, up, losMs };
    });
  }, [passes, observer, now, minElevation]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  function onHoverMove(e: React.PointerEvent, id: string) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ id, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const rings = [0, 30, 60]; // elevation rings (90 is the centre point)
  const style: React.CSSProperties = { width, backgroundColor };

  return (
    <div
      ref={containerRef}
      className={cn("relative rounded-xl border border-white/10 p-4 shadow-sm", className)}
      style={style}
    >
      <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Azimuth/elevation sky plot"
        >
          <circle cx={CX} cy={CY} r={R} fill="#000000" stroke="#8aa0c0" strokeOpacity={0.22} />
          <g stroke="#8aa0c0" strokeOpacity={0.15} fill="none" vectorEffect="non-scaling-stroke">
            {rings.map((el) => (
              <circle key={el} cx={CX} cy={CY} r={((90 - el) / 90) * R} strokeWidth={0.6} />
            ))}
            {Array.from({ length: 12 }, (_, i) => i * 30).map((az) => {
              const [x, y] = project(az, 0);
              return <line key={az} x1={CX} y1={CY} x2={x} y2={y} strokeWidth={0.4} />;
            })}
            <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} strokeWidth={0.6} strokeOpacity={0.26} />
            <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} strokeWidth={0.6} strokeOpacity={0.26} />
          </g>
          {passes.map(({ sat, color, run }) => {
            if (!run || run.length < 2) return null;
            const d = run
              .map((s, i) => {
                const [x, y] = project(s.az, s.el);
                return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
              })
              .join(" ");
            const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
              const idx = Math.min(run.length - 1, Math.round(f * (run.length - 1)));
              return run[idx];
            });
            return (
              <g key={`arc-${sat.id}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.6}
                  strokeOpacity={0.95}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={7}
                  vectorEffect="non-scaling-stroke"
                  style={{ cursor: "pointer", pointerEvents: "stroke" }}
                  onPointerMove={(e) => onHoverMove(e, sat.id)}
                  onPointerLeave={() => setHover(null)}
                />
                {ticks.map((s, i) => {
                  const [x, y] = project(s.az, s.el);
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r={0.9} fill={color} opacity={0.85} />
                      {showLabels && (
                        <text
                          x={x + 1.8}
                          y={y - 1.2}
                          fontSize={4}
                          fill="#cbd5e1"
                          className="font-mono"
                          stroke="#000"
                          strokeWidth={0.7}
                          style={{ paintOrder: "stroke" }}
                        >
                          {fmtUTC(s.t)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Live position markers */}
          {live.map(({ sat, color, la, up }) => {
            if (!up || !la) return null;
            const [x, y] = project(la.azimuth, la.elevation);
            return (
              <g key={`live-${sat.id}`}>
                <circle cx={x} cy={y} r={3} fill={color} opacity={0.25} />
                <circle
                  cx={x}
                  cy={y}
                  r={1.6}
                  fill="#fff"
                  stroke={color}
                  strokeWidth={1.4}
                  vectorEffect="non-scaling-stroke"
                />
                {showLabels && sat.label && (
                  <text
                    x={x + 3}
                    y={y + 1.4}
                    fontSize={5}
                    fontWeight={600}
                    fill={color}
                    stroke="#000"
                    strokeWidth={0.9}
                    style={{ paintOrder: "stroke" }}
                  >
                    {sat.label}
                  </text>
                )}
                {/* Invisible hit area for hover */}
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onPointerMove={(e) => onHoverMove(e, sat.id)}
                  onPointerLeave={() => setHover(null)}
                />
              </g>
            );
          })}

          {/* Cardinal labels */}
          {showLabels && (
            <g
              fill="#94a3b8"
              fontSize={6}
              fontWeight={600}
              textAnchor="middle"
              className="font-mono"
            >
              <text x={CX} y={CY - R + 6.5}>
                N
              </text>
              <text x={CX} y={CY + R - 2.5}>
                S
              </text>
              <text x={CX + R - 4} y={CY + 2}>
                E
              </text>
              <text x={CX - R + 4} y={CY + 2}>
                W
              </text>
            </g>
          )}

          {/* Elevation ring labels */}
          {showLabels && (
            <g fill="#64748b" fontSize={3.6} className="font-mono">
              {[30, 60].map((el) => (
                <text key={el} x={CX + 1.5} y={CY - ((90 - el) / 90) * R - 1}>
                  {el}°
                </text>
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Hover tooltip */}
      {hover &&
        (() => {
          const L = live.find((l) => l.sat.id === hover.id);
          if (!L) return null;
          const P = passes.find((p) => p.sat.id === hover.id);
          const lines: string[] = [];
          if (L.up && L.la) {
            lines.push(`Az ${L.la.azimuth.toFixed(1)}°`, `El ${L.la.elevation.toFixed(1)}°`);
            if (L.losMs != null) lines.push(`LOS in ${fmtDur(L.losMs)}`);
          } else if (P?.run && P.run.length > 0) {
            let maxEl = 0;
            for (const s of P.run) maxEl = Math.max(maxEl, s.el);
            lines.push(`AOS ${fmtUTC(P.run[0].t)} UTC`, `Max El ${maxEl.toFixed(0)}°`);
            if (now) lines.push(`in ${fmtDur(P.run[0].t - now)}`);
          } else {
            lines.push("No pass in window");
          }
          const cw = containerRef.current?.clientWidth ?? 0;
          const ch = containerRef.current?.clientHeight ?? 0;
          const flipX = cw > 0 && hover.x > cw * 0.6;
          const flipY = ch > 0 && hover.y > ch * 0.65;
          return (
            <div
              className="pointer-events-none absolute z-20 rounded-md border border-white/10 bg-black/90 px-2.5 py-1.5 text-xs font-mono text-zinc-300 shadow-xl backdrop-blur-sm"
              style={{
                left: hover.x,
                top: hover.y,
                transform: `translate(${flipX ? "calc(-100% - 12px)" : "12px"}, ${
                  flipY ? "calc(-100% - 12px)" : "12px"
                })`,
              }}
            >
              <div className="mb-0.5 font-semibold" style={{ color: L.color }}>
                {L.sat.label ?? L.sat.id}
              </div>
              {lines.map((ln, i) => (
                <div key={i} className="leading-snug text-zinc-400">
                  {ln}
                </div>
              ))}
            </div>
          );
        })()}
    </div>
  );
}

export default PolarSkyPlot;
