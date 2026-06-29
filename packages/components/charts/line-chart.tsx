"use client";

/**
 * LineChart — a thin preset over the config-driven <Chart>.
 *
 * Every feature is config and works here automatically: showTooltip, showLegend,
 * referenceLines, alertBands, ruler, and always-on pan/zoom (cmd/ctrl + wheel to
 * zoom, cmd/ctrl + drag to pan, shift+drag to brush-zoom). Time axes (xAxis.type
 * = "time") get quantized domains + nice tick labels.
 *
 * @example
 * ```tsx
 * <LineChart
 *   series={[{ name: "Temp", data, color: "#22c55e" }]}
 *   showTooltip
 *   showLegend
 *   referenceLines={[{ value: 45, severity: "critical", label: "45°C" }]}
 * />
 * ```
 */

import type * as React from "react";
import type { Point } from "./base-chart";
import { Chart, type ChartProps } from "./chart";
import type { UnifiedSeries } from "./unified-renderer";

export type DataPoint = Point;
export type Series = UnifiedSeries;
export type LineChartProps = Omit<ChartProps, "type">;
export type LineChartRootProps = Omit<React.ComponentProps<typeof Chart.Root>, "type">;
export type LineChartCanvasProps = React.ComponentProps<typeof Chart.Canvas>;

export function LineChart(props: LineChartProps) {
  return <Chart type="line" {...props} />;
}

LineChart.Root = function LineChartRoot(props: LineChartRootProps) {
  return <Chart.Root type="line" {...props} />;
};
LineChart.Canvas = Chart.Canvas;
LineChart.Axes = Chart.Axes;
LineChart.Tooltip = Chart.Tooltip;
LineChart.Legend = Chart.Legend;
LineChart.PanZoom = Chart.PanZoom;
LineChart.Ruler = Chart.Ruler;
LineChart.AlertBands = Chart.AlertBands;
LineChart.displayName = "LineChart";
