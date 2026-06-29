"use client";

/**
 * MissionDashboard — a dense, data-first satellite operations console built from
 * Plexus UI components (2D ground track, polar sky plot, ephemeris, 3D globe,
 * Gantt contact schedule, telemetry chart) plus an operator-grade live tracking
 * table and external-resource links. Tracking views are frozen to a curated
 * mission epoch; the contact schedule runs on real time.
 */

import { EphemerisCard } from "@plexusui/components/charts/ephemeris-card";
import { GanttChart, type Task } from "@plexusui/components/charts/gantt";
import { Globe } from "@plexusui/components/charts/globe";
import { GroundTrack2D } from "@plexusui/components/charts/ground-track-2d";
import type { DataPoint } from "@plexusui/components/charts/line-chart";
import { LineChart } from "@plexusui/components/charts/line-chart";
import { PolarSkyPlot } from "@plexusui/components/charts/polar-sky-plot";
import {
  generateGroundTrack,
  getLookAngle,
  getOrbitalElements,
} from "@plexusui/components/lib/orbital";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(" ");
const R_E = 6371;
const DOWNLINK_MHZ = 437.5; // UHF amateur downlink, for Doppler

// ============================================================================
// Mission data
// ============================================================================

// Curated snapshot epoch (near the TLEs' own epoch → SGP4 accurate) with the
// ISS mid-pass over Copenhagen. The tracking views + table read this.
const EPOCH = Date.UTC(2024, 0, 1, 12, 23, 0);

const FLEET = [
  {
    id: "iss",
    label: "ISS (ZARYA)",
    short: "ISS",
    norad: 25544,
    color: "#e0457b",
    tle: {
      line1: "1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9000",
      line2: "2 25544  51.6400 208.9163 0006317  69.9862 290.1962 15.49380999000009",
    },
  },
  {
    id: "noaa-19",
    label: "NOAA-19",
    short: "NOAA-19",
    norad: 33591,
    color: "#5b9bd5",
    tle: {
      line1: "1 33591U 09005A   24001.50000000  .00000098  00000-0  790-4 0  9991",
      line2: "2 33591  99.1890  45.2000 0014000 100.0000 260.2000 14.12500000  9990",
    },
  },
  {
    id: "metop-b",
    label: "MetOp-B",
    short: "MetOp-B",
    norad: 38771,
    color: "#22d3ee",
    tle: {
      line1: "1 38771U 12049A   24001.50000000  .00000020  00000-0  18000-4 0  9990",
      line2: "2 38771  98.7000  10.0000 0001500  90.0000 270.0000 14.21500000  9991",
    },
  },
];

const STATIONS = [
  { id: "cph", lat: 55.62, lng: 12.65, label: "CPH" },
  { id: "svalbard", lat: 78.23, lng: 15.39, label: "Svalbard" },
  { id: "fairbanks", lat: 64.84, lng: -147.72, label: "Fairbanks" },
];
const PRIMARY = STATIONS[0];

const INFO: Record<string, { operator: string; type: string; launched: string; intl: string }> = {
  iss: {
    operator: "NASA / Roscosmos",
    type: "Crewed station",
    launched: "1998-11-20",
    intl: "1998-067A",
  },
  "noaa-19": {
    operator: "NOAA",
    type: "Weather · POES",
    launched: "2009-02-06",
    intl: "2009-005A",
  },
  "metop-b": {
    operator: "EUMETSAT",
    type: "Weather · polar",
    launched: "2012-09-17",
    intl: "2012-049A",
  },
};

const EARTH_TEX = {
  textureUrl: "/textures/earth/day.webp",
  nightTextureUrl: "/textures/earth/night.webp",
  cloudsTextureUrl: "/textures/earth/clouds.webp",
  bumpTextureUrl: "/textures/earth/bump.webp",
};

interface Pass {
  aos: number;
  los: number;
  maxEl: number;
}

function findPasses(
  tle: { line1: string; line2: string },
  observer: { lat: number; lng: number },
  startMs: number,
  windowMin: number,
  minEl = 5,
  stepSec = 30
): Pass[] {
  const out: Pass[] = [];
  let cur: Pass | null = null;
  const end = startMs + windowMin * 60_000;
  for (let t = startMs; t <= end; t += stepSec * 1000) {
    const la = getLookAngle(tle, observer, new Date(t));
    const el = la ? la.elevation : -90;
    if (la && el >= minEl) {
      if (!cur) cur = { aos: t, los: t, maxEl: el };
      else {
        cur.los = t;
        if (el > cur.maxEl) cur.maxEl = el;
      }
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out;
}

interface SatSnapshot {
  sat: (typeof FLEET)[number];
  az: number;
  el: number;
  rangeKm: number;
  rateKmS: number;
  dopplerKHz: number;
  ssp: { lat: number; lng: number };
  altKm: number;
  footpKm: number;
  next: { type: "AOS" | "LOS"; t: number } | null;
  up: boolean;
}

/** Instantaneous tracking solution for a satellite from a ground station. */
function snapshot(sat: (typeof FLEET)[number], epoch: number): SatSnapshot | null {
  const la = getLookAngle(sat.tle, PRIMARY, new Date(epoch));
  if (!la) return null;
  const rPlus = getLookAngle(sat.tle, PRIMARY, new Date(epoch + 2000))?.rangeKm ?? la.rangeKm;
  const rMinus = getLookAngle(sat.tle, PRIMARY, new Date(epoch - 2000))?.rangeKm ?? la.rangeKm;
  const rateKmS = (rPlus - rMinus) / 4;
  const dopplerKHz = -((rateKmS * 1000) / 299792458) * DOWNLINK_MHZ * 1000;
  const ssp = generateGroundTrack(sat.tle, 0, 1, epoch)[0] ?? { lat: 0, lng: 0 };
  const altKm = getOrbitalElements(sat.tle.line1, sat.tle.line2).altitude;
  const footpKm = Math.acos(R_E / (R_E + altKm)) * R_E;

  const passes = findPasses(sat.tle, PRIMARY, epoch - 3_600_000, 1440, 0);
  const inPass = passes.find((p) => p.aos <= epoch && p.los >= epoch);
  let next: SatSnapshot["next"] = null;
  if (inPass) next = { type: "LOS", t: inPass.los };
  else {
    const np = passes.find((p) => p.aos > epoch);
    if (np) next = { type: "AOS", t: np.aos };
  }
  return {
    sat,
    az: la.azimuth,
    el: la.elevation,
    rangeKm: la.rangeKm,
    rateKmS,
    dopplerKHz,
    ssp,
    altKm,
    footpKm,
    next,
    up: la.elevation >= 0,
  };
}

const C_MS = 299792458; // speed of light, m/s

/**
 * Accurate Doppler-shift curve (kHz) over a satellite pass for a given downlink
 * frequency. Range-rate is a finite difference of the SGP4 slant range; the
 * classic S-curve (positive on approach → 0 at TCA → negative on recession).
 */
function dopplerCurve(
  tle: { line1: string; line2: string },
  observer: { lat: number; lng: number },
  epoch: number,
  freqMHz: number,
  samples = 140
): DataPoint[] {
  const passes = findPasses(tle, observer, epoch - 3_600_000, 180, 0);
  const pass =
    passes.find((p) => p.aos <= epoch && p.los >= epoch) ??
    passes.find((p) => p.los > epoch) ??
    passes[0];
  if (!pass) return [];
  const out: DataPoint[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = pass.aos + (i / samples) * (pass.los - pass.aos);
    const rPlus = getLookAngle(tle, observer, new Date(t + 1000))?.rangeKm ?? 0;
    const rMinus = getLookAngle(tle, observer, new Date(t - 1000))?.rangeKm ?? 0;
    const rateMS = ((rPlus - rMinus) / 2) * 1000; // m/s
    out.push({ x: (t - epoch) / 60_000, y: (-rateMS / C_MS) * freqMHz * 1000 });
  }
  return out;
}

const fmtClock = (ms: number) => new Date(ms).toISOString().slice(11, 19);
const fmtHM = (ms: number) => new Date(ms).toISOString().slice(11, 16);
function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
const fmtLatLng = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? "E" : "W"}`;

const LOG: Array<{ dt: number; kind: "ok" | "exec" | "warn" | "err"; tag: string; msg: string }> = [
  { dt: 18, kind: "exec", tag: "CMD", msg: "Uplink SEQ-2041 → ISS · attitude hold" },
  { dt: -42, kind: "ok", tag: "LINK", msg: "CPH S-band AOS · ISS · 12.4 dB SNR" },
  { dt: -96, kind: "ok", tag: "TLM", msg: "Frame 0x4A2F decoded · 0 CRC errors" },
  { dt: -150, kind: "warn", tag: "PWR", msg: "Battery DoD 28% · eclipse in 06:12" },
  { dt: -228, kind: "ok", tag: "SCHED", msg: "NOAA-19 · Svalbard contact queued" },
  { dt: -310, kind: "err", tag: "RF", msg: "X-band lock lost · auto-retry 2/3" },
  { dt: -402, kind: "ok", tag: "ADCS", msg: "Reaction-wheel desaturation complete" },
  { dt: -520, kind: "ok", tag: "TLM", msg: "Beacon RX · MetOp-B nominal" },
];
const KIND = { ok: "#34d399", exec: "#22d3ee", warn: "#fbbf24", err: "#f87171" } as const;

// ============================================================================
// Primitives — sharp, dense, hairline borders
// ============================================================================

function Dot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      {pulse && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className="relative inline-flex h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

function Panel({
  title,
  accent = "#3a4252",
  right,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  accent?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("flex flex-col border border-white/[0.08] bg-[#0a0d13]", className)}>
      <header className="flex h-7 shrink-0 items-center justify-between border-b border-white/[0.07] bg-white/[0.015] px-2.5">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
          <span className="h-1.5 w-1.5" style={{ backgroundColor: accent }} />
          {title}
        </div>
        {right && (
          <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">{right}</div>
        )}
      </header>
      <div className={cx("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

const SHARP = "!rounded-none";

// ============================================================================
// Dashboard
// ============================================================================

export function MissionDashboard() {
  const activeSat = FLEET[0];
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeSat + EPOCH are module constants
  const doppler = useMemo(
    () => ({
      vhf: dopplerCurve(activeSat.tle, PRIMARY, EPOCH, 145.8),
      uhf: dopplerCurve(activeSat.tle, PRIMARY, EPOCH, 437.5),
    }),
    []
  );

  // Tracking table + console readouts = curated EPOCH snapshot (coherent with views).
  const snaps = useMemo(
    () =>
      FLEET.map((s) => snapshot(s, EPOCH))
        .filter((s): s is SatSnapshot => s !== null)
        .sort((a, b) => b.el - a.el),
    []
  );
  const activeSnap = snaps.find((s) => s.sat.id === activeSat.id) ?? snaps[0];
  const nextSnap = snaps
    .filter((s) => s.next?.type === "AOS")
    .sort((a, b) => (a.next?.t ?? 0) - (b.next?.t ?? 0))[0];

  // Contact schedule = real time (Gantt anchors to "now"). Computed after mount.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const coarse = now ? Math.floor(now / 30_000) : 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on `coarse`, not raw `now`
  const ganttTasks = useMemo<Task[]>(() => {
    const base = coarse * 30_000;
    if (!base) return [];
    const tasks: Task[] = [];
    for (const sat of FLEET) {
      for (const p of findPasses(sat.tle, PRIMARY, base - 1_800_000, 1440)) {
        tasks.push({
          id: `${sat.id}-${p.aos}`,
          name: `${sat.short} · ${PRIMARY.label}`,
          start: new Date(p.aos),
          end: new Date(p.los),
          status: (p.aos <= base && p.los >= base ? "in-progress" : "planned") as Task["status"],
          color: sat.color,
          description: `max el ${p.maxEl.toFixed(0)}°`,
        });
      }
    }
    return tasks;
  }, [coarse]);

  return (
    <div className="min-h-full bg-[#06080c] text-zinc-200">
      {/* Brand strip */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/[0.08] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-sm font-semibold tracking-tight text-zinc-50">
            PLEXUS&nbsp;UI
          </span>
          <span className="hidden text-[12px] text-zinc-500 sm:inline">
            Aerospace component library — this entire console is built from it.
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/line-chart"
            className="bg-zinc-100 px-3 py-1.5 text-[12px] font-medium text-zinc-900 transition hover:bg-white"
          >
            Browse components
          </Link>
          <Link
            href="/docs"
            className="border border-white/10 px-3 py-1.5 text-[12px] font-medium text-zinc-300 transition hover:bg-white/[0.04]"
          >
            Docs
          </Link>
          <Link
            href="https://github.com/plexus-oss/plexus-ui"
            className="border border-white/10 px-3 py-1.5 text-[12px] font-medium text-zinc-300 transition hover:bg-white/[0.04]"
          >
            GitHub
          </Link>
        </div>
      </div>

      {/* Console status bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 border-b border-white/[0.08] bg-[#080b11] px-4 py-2 font-mono text-[11px]">
        <div className="flex items-center gap-2 text-zinc-300">
          <Dot color="#34d399" pulse />
          <span className="font-semibold tracking-wide text-zinc-100">PLEXUS&nbsp;OPS</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400">{PRIMARY.label} 55.62°N 12.65°E</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-zinc-400">
          <span>
            <span className="text-zinc-600">MET </span>
            <span className="tabular-nums text-zinc-100">{fmtClock(EPOCH)}Z</span>
          </span>
          {activeSnap?.up && activeSnap.next && (
            <span className="text-emerald-300">
              {activeSnap.sat.short} {activeSnap.next.type} {fmtHM(activeSnap.next.t)}Z (
              {fmtCountdown(activeSnap.next.t - EPOCH)})
            </span>
          )}
          {nextSnap?.next && (
            <span className="text-zinc-300">
              Next AOS {nextSnap.sat.short} {fmtHM(nextSnap.next.t)}Z
            </span>
          )}
          <span className="text-zinc-500">{FLEET.length} TRACKED</span>
        </div>
      </div>

      <div className="space-y-2 p-2">
        {/* KPI strip — hairline-divided tiles */}
        <div className="grid grid-cols-2 gap-px bg-white/[0.08] md:grid-cols-3 lg:grid-cols-6">
          {[
            {
              l: "Active target",
              v: activeSnap?.sat.short ?? "—",
              a: activeSat.color,
              s: activeSnap
                ? `el ${activeSnap.el.toFixed(0)}° · az ${activeSnap.az.toFixed(0)}°`
                : "—",
            },
            {
              l: "Range",
              v: activeSnap ? activeSnap.rangeKm.toFixed(0) : "—",
              u: "km",
              s: activeSnap ? `${activeSnap.rateKmS >= 0 ? "▲ receding" : "▼ approaching"}` : "—",
            },
            {
              l: "Doppler @437",
              v: activeSnap
                ? `${activeSnap.dopplerKHz >= 0 ? "+" : ""}${activeSnap.dopplerKHz.toFixed(1)}`
                : "—",
              u: "kHz",
              s: "downlink shift",
            },
            { l: "Downlink", v: "14.2", u: "dB", a: "#34d399", s: "S-band · locked" },
            { l: "Contacts/24h", v: String(ganttTasks.length || "—"), s: "scheduled windows" },
            { l: "Bus power", v: "98.6", u: "%", a: "#34d399", s: "batt 28% DoD" },
          ].map((k) => (
            <div key={k.l} className="bg-[#0a0d13] px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                {k.l}
              </div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span
                  className="text-xl font-semibold tabular-nums"
                  style={{ color: k.a ?? "#fafafa" }}
                >
                  {k.v}
                </span>
                {k.u && <span className="text-[11px] text-zinc-500">{k.u}</span>}
              </div>
              <div className="font-mono text-[10px] text-zinc-600">{k.s}</div>
            </div>
          ))}
        </div>

        {/* Row 1 — ground track + sky plot */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
          <Panel
            title={`Ground track · ${FLEET.length} sats`}
            accent="#e0457b"
            right="equirectangular · sgp4"
            className="lg:col-span-8"
          >
            <GroundTrack2D
              satellites={FLEET}
              groundStations={STATIONS}
              mapImageUrl="/textures/earth/day.webp"
              observerLabel={`${PRIMARY.label} · primary`}
              epochOverride={EPOCH}
              className={cx(SHARP, "!border-0")}
            />
          </Panel>
          <Panel
            title={`Sky · ${PRIMARY.label}`}
            accent="#22d3ee"
            right="az / el"
            className="lg:col-span-4"
            bodyClassName="p-2"
          >
            <PolarSkyPlot
              observer={PRIMARY}
              satellites={FLEET}
              epochOverride={EPOCH}
              searchForwardMin={120}
              className={cx(SHARP, "!border-0 !p-0 !shadow-none")}
            />
          </Panel>
        </div>

        {/* Live tracking — full-width data strip */}
        <Panel
          title="Live tracking · all spacecraft"
          accent="#34d399"
          right="from CPH · MET snapshot"
          bodyClassName="overflow-x-auto"
        >
          <table className="w-full border-collapse font-mono text-[11px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-wider text-zinc-500">
                {[
                  "Sat",
                  "Az",
                  "El",
                  "Range",
                  "Rate",
                  "Dop@437",
                  "Sub-point",
                  "Alt",
                  "Footprint",
                  "Next",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={cx(
                      "border-b border-white/[0.07] px-2.5 py-1.5 font-medium",
                      i === 0 ? "text-left" : "text-right"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snaps.map((s) => (
                <tr
                  key={s.sat.id}
                  className={cx("border-b border-white/[0.04]", s.up && "bg-white/[0.025]")}
                >
                  <td className="px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5" style={{ backgroundColor: s.sat.color }} />
                      <span className="text-zinc-200">{s.sat.short}</span>
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums text-zinc-300">
                    {s.az.toFixed(0)}°
                  </td>
                  <td
                    className={cx(
                      "px-2.5 py-1.5 text-right tabular-nums",
                      s.up ? "text-emerald-400" : "text-zinc-600"
                    )}
                  >
                    {s.el >= 0 ? "+" : ""}
                    {s.el.toFixed(1)}°
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums text-zinc-300">
                    {s.rangeKm.toFixed(0)}
                  </td>
                  <td
                    className={cx(
                      "px-2.5 py-1.5 text-right tabular-nums",
                      s.rateKmS < 0 ? "text-emerald-400/80" : "text-amber-400/80"
                    )}
                  >
                    {s.rateKmS >= 0 ? "+" : ""}
                    {s.rateKmS.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums text-zinc-300">
                    {s.dopplerKHz >= 0 ? "+" : ""}
                    {s.dopplerKHz.toFixed(1)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums text-zinc-400">
                    {fmtLatLng(s.ssp.lat, s.ssp.lng)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums text-zinc-400">
                    {s.altKm.toFixed(0)} km
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums text-zinc-400">
                    {s.footpKm.toFixed(0)} km
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums">
                    {s.next ? (
                      <span
                        className={s.next.type === "LOS" ? "text-emerald-300" : "text-zinc-400"}
                      >
                        {s.next.type} {fmtHM(s.next.t)}Z
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Ephemeris + satellite info */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
          <Panel
            title={`Ephemeris · ${activeSat.short}`}
            accent={activeSat.color}
            right="classical elements"
            className="lg:col-span-8"
          >
            <EphemerisCard
              name={activeSat.label}
              tle={activeSat.tle}
              className={cx(SHARP, "!border-0 !bg-transparent !shadow-none")}
            />
          </Panel>
          <Panel
            title={`Satellite · ${activeSat.short}`}
            accent="#a78bfa"
            right="open data"
            className="lg:col-span-4"
          >
            <div className="divide-y divide-white/[0.05]">
              {(
                [
                  ["Operator", INFO[activeSat.id].operator],
                  ["Type", INFO[activeSat.id].type],
                  ["Launched", INFO[activeSat.id].launched],
                  ["Catalog", `NORAD ${activeSat.norad} · ${INFO[activeSat.id].intl}`],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-3 px-2.5 py-[7px] font-mono text-[11px]"
                >
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500">{k}</span>
                  <span className="truncate tabular-nums text-zinc-300">{v}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-px border-t border-white/[0.07] bg-white/[0.06]">
              {[
                { n: "N2YO live", href: `https://www.n2yo.com/satellite/?s=${activeSat.norad}` },
                {
                  n: "Celestrak TLE",
                  href: `https://celestrak.org/NORAD/elements/gp.php?CATNR=${activeSat.norad}`,
                },
                { n: "SatNOGS DB", href: `https://db.satnogs.org/satellite/${activeSat.norad}` },
                {
                  n: "Heavens-Above",
                  href: `https://www.heavens-above.com/orbit.aspx?satid=${activeSat.norad}`,
                },
              ].map((r) => (
                <Link
                  key={r.n}
                  href={r.href}
                  target="_blank"
                  className="flex items-center justify-between bg-[#0a0d13] px-2.5 py-2 text-[11px] text-zinc-300 transition hover:bg-white/[0.04] hover:text-zinc-100"
                >
                  {r.n}
                  <span className="text-zinc-600">↗</span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        {/* Row 3 — schedule + globe */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
          <Panel
            title="Contact schedule · 24h"
            accent="#94a3b8"
            right="gantt · aos→los · live"
            className="lg:col-span-8"
            bodyClassName="p-1.5"
          >
            <GanttChart tasks={ganttTasks} timezone="UTC" timeWindowHours={24} />
          </Panel>
          <Panel
            title="3D tracking"
            accent="#94a3b8"
            right="webgl · sgp4"
            className="lg:col-span-4"
          >
            <Globe
              satellites={FLEET}
              groundStations={STATIONS}
              {...EARTH_TEX}
              epochOverride={EPOCH}
              showGroundTracks
              showAtmosphere={false}
              height={300}
              enableZoom={false}
              backgroundColor="#06080c"
            />
          </Panel>
        </div>

        {/* Row 4 — telemetry + event log */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
          <Panel
            title={`Doppler · ${activeSat.short} pass`}
            accent="#34d399"
            right="sgp4 · kHz · drag/scroll to zoom"
            className="lg:col-span-8"
            bodyClassName="px-3 pt-2 pb-1"
          >
            <LineChart
              series={[
                { name: "VHF 145.8 MHz", data: doppler.vhf, color: "#34d399" },
                { name: "UHF 437.5 MHz", data: doppler.uhf, color: "#fbbf24" },
              ]}
              xAxis={{ formatter: (v: number) => `T${v >= 0 ? "+" : ""}${v.toFixed(0)}m` }}
              yAxis={{ formatter: (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}` }}
              height={190}
              showTooltip
              showLegend
              preferWebGPU={false}
            />
          </Panel>
          <Panel
            title="Event log"
            accent="#fbbf24"
            right="live feed"
            className="lg:col-span-4"
            bodyClassName="divide-y divide-white/[0.05]"
          >
            {LOG.map((e, i) => (
              <div key={i} className="flex items-start gap-2 px-2.5 py-1.5">
                <span className="mt-1">
                  <Dot color={KIND[e.kind]} pulse={e.kind === "exec"} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
                    <span className="tabular-nums">{fmtHM(EPOCH + e.dt * 1000)}Z</span>
                    <span
                      className="px-1 py-px uppercase tracking-wider"
                      style={{ color: KIND[e.kind], backgroundColor: `${KIND[e.kind]}1a` }}
                    >
                      {e.tag}
                    </span>
                    {e.dt > 0 && <span className="text-cyan-400/70">QUEUED</span>}
                  </div>
                  <div className="truncate text-[12px] text-zinc-300">{e.msg}</div>
                </div>
              </div>
            ))}
          </Panel>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-2 font-mono text-[10px] text-zinc-600">
          <span>
            Built with Plexus UI — 6 components on this page · real SGP4 · external data via
            Celestrak / N2YO / SatNOGS.
          </span>
          <Link href="/globe" className="text-cyan-500 hover:text-cyan-400">
            Explore components →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MissionDashboard;
