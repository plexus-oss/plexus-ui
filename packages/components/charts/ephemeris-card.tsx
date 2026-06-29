/**
 * Ephemeris Card Component
 *
 * A data-dense, SatCat-style readout of the classical orbital elements derived
 * from a Two-Line Element set. Pure DOM/SVG — no canvas, no Three.js.
 *
 * Derives period, apogee/perigee, inclination, RAAN, argument of perigee,
 * eccentricity, semi-major axis, mean motion and altitude via the library's
 * own `getOrbitalElements`, and lays them out in a clean labeled grid with
 * units, fixed precision and scientific notation where appropriate.
 *
 * @example
 * ```tsx
 * import { EphemerisCard } from "@plexusui/components/charts";
 *
 * <EphemerisCard
 *   name="ISS (ZARYA)"
 *   tle={{
 *     line1: "1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9000",
 *     line2: "2 25544  51.6400 208.9163 0006317  69.9862 290.1962 15.49380999000009",
 *   }}
 * />
 * ```
 *
 * @module ephemeris-card
 */
"use client";

import { useMemo } from "react";
import { getOrbitalElements, type OrbitalElements } from "../lib/orbital";
import { cn } from "../lib/utils";

export interface EphemerisCardProps {
  /** Two-Line Element set to derive elements from. */
  tle: { line1: string; line2: string };
  /** Optional satellite / object name shown in the header. */
  name?: string;
  /** Additional CSS classes for the container. */
  className?: string;
}

function fmtPeriod(minutes: number): string {
  if (!Number.isFinite(minutes)) return "—";
  const totalSeconds = Math.round(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** NORAD catalog number lives in line 1, columns 3–7. */
function parseNorad(line1: string): string | null {
  const raw = line1.slice(2, 7).trim();
  return raw && /^\d+$/.test(raw) ? raw : null;
}

/** International designator (launch year + number + piece), line 1 cols 10–17. */
function parseIntlDesignator(line1: string): string | null {
  const raw = line1.slice(9, 17).trim();
  return raw || null;
}

interface Metric {
  label: string;
  value: string;
  unit?: string;
  mono?: boolean;
}

export function EphemerisCard({ tle, name, className }: EphemerisCardProps) {
  const elements = useMemo<OrbitalElements | null>(() => {
    try {
      const el = getOrbitalElements(tle.line1, tle.line2);
      if (!Number.isFinite(el.period) || !Number.isFinite(el.semiMajorAxis)) return null;
      return el;
    } catch {
      return null;
    }
  }, [tle.line1, tle.line2]);

  if (!elements) {
    return (
      <div
        className={cn(
          "rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-500",
          className
        )}
      >
        <div className="font-medium text-zinc-300">Invalid TLE</div>
        <p className="mt-1 text-zinc-500">
          Orbital elements could not be derived from the supplied two-line element set.
        </p>
      </div>
    );
  }

  const norad = parseNorad(tle.line1);
  const intl = parseIntlDesignator(tle.line1);

  const metrics: Metric[] = [
    {
      label: "Period",
      value: fmtPeriod(elements.period),
      unit: `${elements.period.toFixed(2)} min`,
      mono: true,
    },
    { label: "Mean Motion", value: elements.meanMotion.toFixed(6), unit: "rev/day", mono: true },
    { label: "Apogee", value: elements.apogeeAlt.toFixed(1), unit: "km", mono: true },
    { label: "Perigee", value: elements.perigeeAlt.toFixed(1), unit: "km", mono: true },
    { label: "Mean Altitude", value: elements.altitude.toFixed(1), unit: "km", mono: true },
    { label: "Semi-Major Axis", value: elements.semiMajorAxis.toFixed(1), unit: "km", mono: true },
    { label: "Inclination", value: elements.inclination.toFixed(4), unit: "°", mono: true },
    { label: "Eccentricity", value: elements.eccentricity.toFixed(7), mono: true },
    { label: "RAAN", value: elements.raan.toFixed(4), unit: "°", mono: true },
    { label: "Arg. of Perigee", value: elements.argPerigee.toFixed(4), unit: "°", mono: true },
    { label: "Mean Anomaly", value: elements.meanAnomaly.toFixed(4), unit: "°", mono: true },
    { label: "Drag (B*)", value: elements.bstar.toExponential(4), unit: "1/Rₑ", mono: true },
  ];

  return (
    <div
      className={cn(
        "rounded-none border border-white/[0.08] bg-[#0f1117] text-zinc-100 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold tracking-tight text-zinc-50">
            {name ?? "Orbital Elements"}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            {norad && (
              <span>
                NORAD <span className="font-mono text-zinc-400">{norad}</span>
              </span>
            )}
            {norad && intl && <span className="text-zinc-700">·</span>}
            {intl && (
              <span>
                INTL <span className="font-mono text-zinc-400">{intl}</span>
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-none bg-white/[0.04] px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400 ring-1 ring-inset ring-white/[0.08]">
          Ephemeris
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-zinc-800/60 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-zinc-950 px-4 py-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {m.label}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-[15px] font-semibold tabular-nums text-zinc-50",
                  m.mono && "font-mono"
                )}
              >
                {m.value}
              </span>
              {m.unit && <span className="text-xs text-zinc-500">{m.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EphemerisCard;
