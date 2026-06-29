"use client";

/**
 * BarChart — a thin preset over the config-driven <Chart>.
 *
 * Bar-specific config (orientation, barWidth, grouped, stacked) plus every shared
 * feature — showTooltip, showLegend, referenceLines, alertBands, ruler, always-on
 * pan/zoom, and time axes — all work here automatically.
 *
 * @example
 * ```tsx
 * <BarChart series={data} showTooltip showLegend grouped />
 * ```
 */

import type * as React from "react";
import { Chart, type ChartDataPoint, type ChartInputSeries, type ChartProps } from "./chart";

export type DataPoint = ChartDataPoint;
export type Series = ChartInputSeries;
export type BarChartProps = Omit<ChartProps, "type">;
export type BarChartRootProps = Omit<React.ComponentProps<typeof Chart.Root>, "type">;
export type BarChartCanvasProps = React.ComponentProps<typeof Chart.Canvas>;

export function BarChart(props: BarChartProps) {
  return <Chart type="bar" {...props} />;
}

BarChart.Root = function BarChartRoot(props: BarChartRootProps) {
  return <Chart.Root type="bar" {...props} />;
};
BarChart.Canvas = Chart.Canvas;
BarChart.Axes = Chart.Axes;
BarChart.Tooltip = Chart.Tooltip;
BarChart.Legend = Chart.Legend;
BarChart.PanZoom = Chart.PanZoom;
BarChart.Ruler = Chart.Ruler;
BarChart.AlertBands = Chart.AlertBands;
BarChart.displayName = "BarChart";
