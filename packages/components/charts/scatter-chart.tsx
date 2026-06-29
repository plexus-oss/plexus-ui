"use client";

/**
 * ScatterChart — a thin preset over the config-driven <Chart>.
 *
 * Keeps the scatter-friendly `size` prop (mapped to the renderer's pointSize) and
 * gains every shared feature — showTooltip, showLegend, referenceLines, alertBands,
 * ruler, always-on pan/zoom, and time axes.
 *
 * @example
 * ```tsx
 * <ScatterChart series={[{ name: "A", data, color: "#ef4444", size: 8 }]} showTooltip />
 * ```
 */

import type * as React from "react";
import type { Point } from "./base-chart";
import { Chart, type ChartProps } from "./chart";
import type { UnifiedSeries } from "./unified-renderer";

export type DataPoint = Point & {
  size?: number;
  label?: string;
};

export interface Series {
  name: string;
  data: DataPoint[];
  color?: string;
  /** Point size in px (alias for the renderer's pointSize). */
  size?: number;
  opacity?: number;
}

export type ScatterChartProps = Omit<ChartProps, "type" | "series"> & {
  series: Series[];
};
export type ScatterChartRootProps = Omit<
  React.ComponentProps<typeof Chart.Root>,
  "type" | "series"
> & { series: Series[] };
export type ScatterChartCanvasProps = React.ComponentProps<typeof Chart.Canvas>;

// Map the scatter-friendly `size` onto the renderer's `pointSize`.
function toUnifiedSeries(series: Series[]): UnifiedSeries[] {
  return series.map((s) => ({
    ...s,
    pointSize: s.size,
  }));
}

export function ScatterChart({ series, ...rest }: ScatterChartProps) {
  return <Chart type="scatter" series={toUnifiedSeries(series)} {...rest} />;
}

ScatterChart.Root = function ScatterChartRoot({ series, ...rest }: ScatterChartRootProps) {
  return <Chart.Root type="scatter" series={toUnifiedSeries(series)} {...rest} />;
};
ScatterChart.Canvas = Chart.Canvas;
ScatterChart.Axes = Chart.Axes;
ScatterChart.Tooltip = Chart.Tooltip;
ScatterChart.Legend = Chart.Legend;
ScatterChart.PanZoom = Chart.PanZoom;
ScatterChart.Ruler = Chart.Ruler;
ScatterChart.AlertBands = Chart.AlertBands;
ScatterChart.displayName = "ScatterChart";
