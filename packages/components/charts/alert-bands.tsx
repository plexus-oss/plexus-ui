/**
 * Alert Bands
 *
 * Shaded overlay regions that mark alert/threshold-breach windows on a chart.
 * Reads `useBaseChart()` for coordinate transforms and renders absolutely-
 * positioned colored bands between each band's `start`/`end` along the chosen
 * axis (default "x", e.g. time windows).
 *
 * Generic and decoupled — a band is just `{ start, end, severity?, label? }`
 * in data space. Works for either axis: x-bands span vertically across the
 * plot, y-bands span horizontally.
 */
"use client";

import * as React from "react";
import { useBaseChart } from "./base-chart";

export interface AlertBand {
  /** Start coordinate in data space. */
  start: number;
  /** End coordinate in data space. */
  end: number;
  /** Severity drives the default color. */
  severity?: "info" | "warning" | "critical" | string;
  /** Optional label rendered inside the band. */
  label?: string;
  /** Explicit color override (any CSS color). Wins over severity. */
  color?: string;
}

export interface AlertBandsProps {
  bands: AlertBand[];
  /** Which axis the start/end coordinates map to. Default "x". */
  axis?: "x" | "y";
  /** Override / extend the severity → color map. */
  colors?: Record<string, string>;
  /** Fill opacity for the band body. Default 0.12. */
  opacity?: number;
  /** Render the band labels. Default true. */
  showLabels?: boolean;
  /** Click handler — makes bands interactive (pointer-events enabled). */
  onBandClick?: (band: AlertBand) => void;
}

const DEFAULT_COLORS: Record<string, string> = {
  info: "#3b82f6", // blue-500
  warning: "#f59e0b", // amber-500
  critical: "#ef4444", // red-500
};

function resolveColor(band: AlertBand, colors: Record<string, string>): string {
  if (band.color) return band.color;
  if (band.severity && colors[band.severity]) return colors[band.severity];
  return colors.info ?? DEFAULT_COLORS.info;
}

/**
 * Add an alpha channel to any CSS color for the translucent fill. Uses
 * `color-mix`, which handles every color form (3/6/8-digit hex, rgb/rgba,
 * hsl/hsla, and named colors) — the old hand-rolled parser only understood
 * 6-digit hex and `rgb(...)`, leaving everything else fully opaque.
 */
function withAlpha(color: string, alpha: number): string {
  const pct = Math.max(0, Math.min(1, alpha)) * 100;
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

export function AlertBands({
  bands,
  axis = "x",
  colors,
  opacity = 0.12,
  showLabels = true,
  onBandClick,
}: AlertBandsProps) {
  const ctx = useBaseChart();
  const palette = colors ? { ...DEFAULT_COLORS, ...colors } : DEFAULT_COLORS;

  const plotLeft = ctx.margin.left;
  const plotTop = ctx.margin.top;
  const plotRight = ctx.width - ctx.margin.right;
  const plotBottom = ctx.height - ctx.margin.bottom;
  const interactive = !!onBandClick;

  const geometry = React.useMemo(() => {
    return bands.map((band) => {
      const lo = Math.min(band.start, band.end);
      const hi = Math.max(band.start, band.end);

      if (axis === "x") {
        const a = ctx.xScale(lo);
        const b = ctx.xScale(hi);
        const left = Math.max(plotLeft, Math.min(a, b));
        const right = Math.min(plotRight, Math.max(a, b));
        return {
          band,
          left,
          top: plotTop,
          width: Math.max(0, right - left),
          height: Math.max(0, plotBottom - plotTop),
          clippedLow: lo < ctx.xDomain[0],
          clippedHigh: hi > ctx.xDomain[1],
          visible: right > plotLeft && left < plotRight,
        };
      }

      // y-axis: bands span horizontally across the full plot width.
      const a = ctx.yScale(lo);
      const b = ctx.yScale(hi);
      const top = Math.max(plotTop, Math.min(a, b));
      const bottom = Math.min(plotBottom, Math.max(a, b));
      return {
        band,
        left: plotLeft,
        top,
        width: Math.max(0, plotRight - plotLeft),
        height: Math.max(0, bottom - top),
        // For y, yScale is inverted (higher value = smaller pixel), so a low
        // data value clips at the bottom edge.
        clippedLow: lo < ctx.yDomain[0],
        clippedHigh: hi > ctx.yDomain[1],
        visible: bottom > plotTop && top < plotBottom,
      };
    });
  }, [
    bands,
    axis,
    ctx.xScale,
    ctx.yScale,
    ctx.xDomain,
    ctx.yDomain,
    plotLeft,
    plotTop,
    plotRight,
    plotBottom,
  ]);

  const renderable = geometry.filter((g) => g.visible);
  if (renderable.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10" aria-hidden={!interactive}>
      {renderable.map((g, idx) => {
        const color = resolveColor(g.band, palette);
        const fill = withAlpha(color, opacity);
        const edge = withAlpha(color, 0.9);
        const trailingEdge = withAlpha(color, 0.5);

        // Leading edge marks the start; for x it's the left border, for y the
        // top border. Suppress when clipped so the chart edge doesn't read as
        // a second event boundary.
        const edgeStyles: React.CSSProperties =
          axis === "x"
            ? {
                borderLeft: g.clippedLow ? undefined : `2px solid ${edge}`,
                borderRight: g.clippedHigh ? undefined : `2px dashed ${trailingEdge}`,
              }
            : {
                borderTop: g.clippedHigh ? undefined : `2px solid ${edge}`,
                borderBottom: g.clippedLow ? undefined : `2px dashed ${trailingEdge}`,
              };

        const band = g.band;

        const body = (
          <span
            className="absolute inset-0 block"
            style={{ backgroundColor: fill, ...edgeStyles }}
          />
        );

        const labelEl =
          showLabels && band.label && g.width > 24 && g.height > 14 ? (
            <span
              className="absolute left-1 top-1 px-1.5 py-0.5 text-[10px] font-medium rounded whitespace-nowrap"
              style={{ backgroundColor: edge, color: "#fff" }}
            >
              {band.label}
            </span>
          ) : null;

        const style: React.CSSProperties = {
          left: g.left,
          top: g.top,
          width: g.width,
          height: g.height,
        };

        if (interactive) {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onBandClick?.(band)}
              // Don't let a band click start the chart's pan/zoom drag.
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute m-0 p-0 border-0 bg-transparent cursor-pointer pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              style={style}
              aria-label={band.label ?? `${band.severity ?? "alert"} band`}
            >
              {body}
              {labelEl}
            </button>
          );
        }

        return (
          <div key={idx} className="absolute" style={style}>
            {body}
            {labelEl}
          </div>
        );
      })}
    </div>
  );
}
