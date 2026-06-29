"use client";

/**
 * AreaChart — a thin preset over the config-driven <Chart>.
 *
 * Supports `stacked` plus every shared feature — showTooltip, showLegend,
 * referenceLines, alertBands, ruler, always-on pan/zoom, and time axes. Set
 * per-series `fillOpacity` for the fill.
 *
 * @example
 * ```tsx
 * <AreaChart series={data} showTooltip showLegend stacked />
 * ```
 */

import type * as React from "react";
import type { Point } from "./base-chart";
import { Chart, type ChartProps } from "./chart";
import type { UnifiedSeries } from "./unified-renderer";

export type DataPoint = Point;
export type Series = UnifiedSeries;
export type AreaChartProps = Omit<ChartProps, "type">;
export type AreaChartRootProps = Omit<React.ComponentProps<typeof Chart.Root>, "type">;
export type AreaChartCanvasProps = React.ComponentProps<typeof Chart.Canvas>;

export function AreaChart(props: AreaChartProps) {
  return <Chart type="area" {...props} />;
}

AreaChart.Root = function AreaChartRoot(props: AreaChartRootProps) {
  return <Chart.Root type="area" {...props} />;
};
AreaChart.Canvas = Chart.Canvas;
AreaChart.Axes = Chart.Axes;
AreaChart.Tooltip = Chart.Tooltip;
AreaChart.Legend = Chart.Legend;
AreaChart.PanZoom = Chart.PanZoom;
AreaChart.Ruler = Chart.Ruler;
AreaChart.AlertBands = Chart.AlertBands;
AreaChart.displayName = "AreaChart";
