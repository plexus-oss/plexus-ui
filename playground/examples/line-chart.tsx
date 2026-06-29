"use client";

import type { DataPoint } from "@plexusui/components/charts/line-chart";
import { LineChart } from "@plexusui/components/charts/line-chart";
import { useEffect, useMemo, useState } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { useColorScheme, useMultiColors } from "@/components/color-scheme-provider";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Beautiful Revenue Chart (Inspired by shadcn but better with WebGPU)
// ============================================================================

function RevenueChart() {
  const colors = useMultiColors(2);

  // Monthly revenue data for the year
  const months = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    []
  );

  const revenueData: DataPoint[] = useMemo(
    () => [
      { x: 0, y: 2890 },
      { x: 1, y: 3420 },
      { x: 2, y: 3180 },
      { x: 3, y: 4320 },
      { x: 4, y: 4890 },
      { x: 5, y: 5240 },
      { x: 6, y: 4980 },
      { x: 7, y: 5670 },
      { x: 8, y: 6120 },
      { x: 9, y: 5890 },
      { x: 10, y: 6340 },
      { x: 11, y: 7120 },
    ],
    []
  );

  const previousYearData: DataPoint[] = useMemo(
    () => [
      { x: 0, y: 2340 },
      { x: 1, y: 2780 },
      { x: 2, y: 2560 },
      { x: 3, y: 3120 },
      { x: 4, y: 3450 },
      { x: 5, y: 3890 },
      { x: 6, y: 3670 },
      { x: 7, y: 4120 },
      { x: 8, y: 4560 },
      { x: 9, y: 4340 },
      { x: 10, y: 4780 },
      { x: 11, y: 5120 },
    ],
    []
  );

  return (
    <ComponentPreview
      title="Revenue Overview"
      description="A clean, minimal chart showing monthly revenue trends with year-over-year comparison"
      code={`import { LineChart } from "@plexusui/components/charts/line-chart";

// Everything is config. Pan/zoom is always on (cmd/ctrl + scroll to zoom,
// cmd/ctrl + drag to pan).
<LineChart
  series={[
    { name: "2024", data: revenueData, color: "#3b82f6", strokeWidth: 3 },
    { name: "2023", data: previousYearData, color: "#94a3b8", strokeWidth: 2 },
  ]}
  xAxis={{ formatter: (v) => months[Math.round(v)] }}
  yAxis={{ formatter: (v) => \`$\${(v / 1000).toFixed(1)}k\` }}
  width="100%"
  height={350}
  showTooltip
  showLegend
  referenceLines={[{ value: 6000, severity: "warning", label: "Target" }]}
/>`}
      preview={
        <LineChart
          series={[
            { name: "2024", data: revenueData, color: colors[0], strokeWidth: 3 },
            { name: "2023", data: previousYearData, color: colors[1], strokeWidth: 2 },
          ]}
          xAxis={{ formatter: (v: number) => months[Math.round(v)] || "" }}
          yAxis={{ formatter: (v: number) => `$${(v / 1000).toFixed(1)}k` }}
          width="100%"
          height={350}
          showTooltip
          showLegend
          referenceLines={[{ value: 6000, severity: "warning", label: "Target" }]}
        />
      }
    />
  );
}

// ============================================================================
// Minimal Chart Without Y-Axis (Clean, Craft Design)
// ============================================================================

function MinimalChart() {
  const { color } = useColorScheme();

  // Simple trend data - memoized to prevent regeneration on every render
  const trendData: DataPoint[] = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        x: i,
        y: 50 + Math.sin(i / 5) * 20 + Math.cos(i / 3) * 10 + (Math.random() - 0.5) * 5,
      })),
    []
  );

  return (
    <ComponentPreview
      title="Minimal Trend (No Y-Axis)"
      description="Ultra-clean design without y-axis - perfect for dashboards and sparklines"
      code={`import { LineChart } from "@plexusui/components/charts/line-chart";

const trendData = Array.from({ length: 30 }, (_, i) => ({
  x: i,
  y: 50 + Math.sin(i / 5) * 20 + Math.cos(i / 3) * 10,
}));

<LineChart.Root
  series={[
    { name: "Metric", data: trendData, color: "#3b82f6", strokeWidth: 2 },
  ]}
  xAxis={{
    formatter: (v) => \`Day \${Math.round(v)}\`,
  }}
  yAxis={{
    formatter: (v) => v.toFixed(0),
  }}
  width={600}
  height={200}
  preferWebGPU={true}
>
  <LineChart.Canvas showGrid={false} />
  <LineChart.Tooltip />
</LineChart.Root>`}
      preview={
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">+12.5%</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">vs last month</div>
            </div>
          </div>
          <LineChart.Root
            series={[
              {
                name: "Metric",
                data: trendData,
                color: color,
                strokeWidth: 2,
              },
            ]}
            xAxis={{
              formatter: (v: number) => `Day ${Math.round(v)}`,
            }}
            yAxis={{
              formatter: (v: number) => v.toFixed(0),
            }}
            width="100%"
            height={200}
            preferWebGPU={true}
          >
            <LineChart.Canvas showGrid={false} />
            <LineChart.Tooltip />
          </LineChart.Root>
        </div>
      }
    />
  );
}

// ============================================================================
// Real-Time Streaming (Technical but Beautiful)
// ============================================================================

function StreamingChart() {
  const colors = useMultiColors(2);
  const [isPaused, setIsPaused] = useState(false);

  const WINDOW_DURATION = 10; // seconds
  const UPDATE_RATE = 30; // Hz
  const WINDOW_SIZE = UPDATE_RATE * WINDOW_DURATION;

  const [primaryData, setPrimaryData] = useState<DataPoint[]>(() =>
    Array.from({ length: WINDOW_SIZE }, (_, i) => ({
      x: i / UPDATE_RATE,
      y: 50 + Math.sin((i / UPDATE_RATE) * 2) * 20,
    }))
  );

  const [secondaryData, setSecondaryData] = useState<DataPoint[]>(() =>
    Array.from({ length: WINDOW_SIZE }, (_, i) => ({
      x: i / UPDATE_RATE,
      y: 60 + Math.cos((i / UPDATE_RATE) * 1.5) * 15,
    }))
  );

  useEffect(() => {
    if (isPaused) return;

    let animationFrame: number;

    const animate = () => {
      setPrimaryData((prev) => {
        const lastTime = prev[prev.length - 1].x;
        const newTime = lastTime + 1 / UPDATE_RATE;
        const newValue = 50 + Math.sin(newTime * 2) * 20 + (Math.random() - 0.5) * 3;

        return [...prev.slice(-(WINDOW_SIZE - 1)), { x: newTime, y: newValue }];
      });

      setSecondaryData((prev) => {
        const lastTime = prev[prev.length - 1].x;
        const newTime = lastTime + 1 / UPDATE_RATE;
        const newValue = 60 + Math.cos(newTime * 1.5) * 15 + (Math.random() - 0.5) * 2;

        return [...prev.slice(-(WINDOW_SIZE - 1)), { x: newTime, y: newValue }];
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isPaused, WINDOW_SIZE]);

  const xMin = primaryData[0]?.x || 0;
  const xMax = primaryData[primaryData.length - 1]?.x || WINDOW_DURATION;

  return (
    <ComponentPreview
      title="Real-Time Data Stream"
      description="Buttery-smooth 30fps real-time data visualization powered by WebGPU"
      code={`import { LineChart } from "@plexusui/components/charts/line-chart";
import { useState, useEffect } from "react";

function RealTimeChart() {
  const [data, setData] = useState<DataPoint[]>(initialData);

  useEffect(() => {
    let frame: number;

    const animate = () => {
      setData(prev => {
        const lastTime = prev[prev.length - 1].x;
        const newTime = lastTime + 1 / 30;
        const newValue = generateValue(newTime);

        return [...prev.slice(-299), { x: newTime, y: newValue }];
      });

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <LineChart.Root
      series={[{ name: "Live", data }]}
      xAxis={{ domain: [xMin, xMax] }}
      preferWebGPU={true}
    >
      <LineChart.Canvas showGrid={true} />
      <LineChart.Axes />
      <LineChart.Tooltip />
    </LineChart.Root>
  );
}`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[0] }} />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[1] }} />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Secondary</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-2 rounded-md font-medium transition-colors bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
          </div>

          <LineChart.Root
            series={[
              {
                name: "Primary",
                data: primaryData,
                color: colors[0],
                strokeWidth: 2,
              },
              {
                name: "Secondary",
                data: secondaryData,
                color: colors[1],
                strokeWidth: 2,
              },
            ]}
            xAxis={{
              label: "Time (seconds)",
              domain: [xMin, xMax],
              formatter: (v: number) => `${v.toFixed(1)}s`,
            }}
            yAxis={{
              domain: [0, 100],
              formatter: (v: number) => v.toFixed(0),
            }}
            width="100%"
            height={300}
            preferWebGPU={true}
          >
            <LineChart.Canvas showGrid={true} />
            <LineChart.Axes />
            <LineChart.Tooltip />
          </LineChart.Root>
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const lineChartProps: ApiProp[] = [
  {
    name: "series",
    type: "Series[]",
    default: "required",
    description:
      "Array of data series. Series: { name: string, data: Point[], color?: string, strokeWidth?: number }",
  },
  {
    name: "xAxis",
    type: "{ label?: string, domain?: [number, number] | 'auto', formatter?: (value: number) => string }",
    default: "{}",
    description: "X-axis configuration",
  },
  {
    name: "yAxis",
    type: "{ label?: string, domain?: [number, number] | 'auto', formatter?: (value: number) => string }",
    default: "{}",
    description: "Y-axis configuration",
  },
  {
    name: "width",
    type: "number | string",
    default: "800",
    description: "Chart width in pixels or CSS value (e.g., '100%')",
  },
  {
    name: "height",
    type: "number | string",
    default: "400",
    description: "Chart height in pixels or CSS value",
  },
  {
    name: "showGrid",
    type: "boolean",
    default: "true",
    description: "Show grid lines",
  },
  {
    name: "showAxes",
    type: "boolean",
    default: "true",
    description: "Show axis labels and ticks",
  },
  {
    name: "showTooltip",
    type: "boolean",
    default: "false",
    description: "Show interactive tooltip on hover",
  },
  {
    name: "preferWebGPU",
    type: "boolean",
    default: "true",
    description: "Prefer WebGPU rendering over WebGL. Falls back automatically if unavailable",
  },
  {
    name: "className",
    type: "string",
    default: '""',
    description: "Additional CSS classes",
  },
];

const lineChartRootProps: ApiProp[] = [
  {
    name: "series",
    type: "Series[]",
    default: "required",
    description: "Array of data series to plot",
  },
  {
    name: "xAxis",
    type: "{ label?: string, domain?: [number, number] | 'auto', formatter?: (value: number) => string }",
    default: "{}",
    description: "X-axis configuration",
  },
  {
    name: "yAxis",
    type: "{ label?: string, domain?: [number, number] | 'auto', formatter?: (value: number) => string }",
    default: "{}",
    description: "Y-axis configuration",
  },
  {
    name: "width",
    type: "number | string",
    default: "800",
    description: "Chart width in pixels or CSS value (e.g., '100%')",
  },
  {
    name: "height",
    type: "number | string",
    default: "400",
    description: "Chart height in pixels or CSS value",
  },
  {
    name: "preferWebGPU",
    type: "boolean",
    default: "true",
    description: "Prefer WebGPU rendering",
  },
  {
    name: "children",
    type: "ReactNode",
    default: "undefined",
    description: "Primitive components (Canvas, Axes, Tooltip)",
  },
];

const lineChartPrimitiveProps: ApiProp[] = [
  {
    name: "LineChart.Canvas",
    type: "component",
    default: "-",
    description: "Renders the line series. Props: showGrid?: boolean",
  },
  {
    name: "LineChart.Axes",
    type: "component",
    default: "-",
    description: "Renders x and y axis with labels and ticks",
  },
  {
    name: "LineChart.Tooltip",
    type: "component",
    default: "-",
    description: "Interactive tooltip showing data values on hover",
  },
];

const seriesType: ApiProp[] = [
  {
    name: "name",
    type: "string",
    default: "required",
    description: "Series name for legend and tooltip",
  },
  {
    name: "data",
    type: "Point[]",
    default: "required",
    description: "Array of data points. Point: { x: number, y: number }",
  },
  {
    name: "color",
    type: "string",
    default: '"#3b82f6"',
    description: "Line color (hex or rgb)",
  },
  {
    name: "strokeWidth",
    type: "number",
    default: "3",
    description: "Line thickness in pixels",
  },
];

export function LineChartExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <RevenueChart />
        <MinimalChart />
        <StreamingChart />
      </div>

      {/* API Reference Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            LineChart component for time-series and multi-series data visualization with WebGPU
            acceleration
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">LineChart (All-in-One)</h3>
          <ApiReferenceTable props={lineChartProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Series Type</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Configuration for each data series in the chart
          </p>
          <ApiReferenceTable props={seriesType} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">LineChart.Root</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Root component for building custom layouts with primitives
          </p>
          <ApiReferenceTable props={lineChartRootProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primitive Components</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use with LineChart.Root for complete control over composition
          </p>
          <ApiReferenceTable props={lineChartPrimitiveProps} />
        </div>
      </div>
    </div>
  );
}
