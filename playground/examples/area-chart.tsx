"use client";

import type { DataPoint } from "@plexusui/components/charts/area-chart";
import { AreaChart } from "@plexusui/components/charts/area-chart";
import { useEffect, useState } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { useColorScheme, useMultiColors } from "@/components/color-scheme-provider";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Example Data
// ============================================================================

const stockPriceData: DataPoint[] = Array.from({ length: 60 }, (_, i) => ({
  x: i,
  y: 100 + Math.sin(i / 10) * 20 + Math.random() * 10,
}));

const temperatureData: DataPoint[] = Array.from({ length: 50 }, (_, i) => ({
  x: i,
  y: 20 + Math.sin(i / 8) * 10 + Math.random() * 5,
}));

// ============================================================================
// Example Components
// ============================================================================

function BasicAreaChart() {
  const { color } = useColorScheme();

  return (
    <ComponentPreview
      title="Basic Area Chart"
      description="Simple area chart showing stock price trends"
      code={`import { AreaChart } from "@plexusui/components/charts/area-chart";

const data = Array.from({ length: 60 }, (_, i) => ({
  x: i,
  y: 100 + Math.sin(i / 10) * 20 + Math.random() * 10,
}));

<AreaChart
  series={[{ name: "Stock Price", data, color: "#3b82f6", fillOpacity: 0.3 }]}
  width={800}
  height={400}
  showTooltip
  showLegend
  referenceLines={[{ value: 120, severity: "info", label: "Resistance" }]}
/>`}
      preview={
        <div className="w-full h-[460px]">
          <AreaChart
            series={[
              {
                name: "Stock Price",
                data: stockPriceData,
                color: color,
                fillOpacity: 0.3,
                strokeWidth: 2,
              },
            ]}
            yAxis={{ label: "Price ($)" }}
            xAxis={{ label: "Time (days)" }}
            width="100%"
            height={460}
            showGrid
            showTooltip
            showLegend
            referenceLines={[{ value: 120, severity: "info", label: "Resistance" }]}
          />
        </div>
      }
    />
  );
}

function MultiSeriesAreaChart() {
  const colors = useMultiColors(2);

  return (
    <ComponentPreview
      title="Multi-Series Area Chart"
      description="Multiple data series with overlapping areas"
      code={`const series1 = [...];
const series2 = [...];

<AreaChart
  series={[
    { name: "Server A", data: series1, color: "#10b981", fillOpacity: 0.2 },
    { name: "Server B", data: series2, color: "#f59e0b", fillOpacity: 0.2 },
  ]}
  showTooltip
/>`}
      preview={
        <div className="w-full">
          <AreaChart
            series={[
              {
                name: "Server A",
                data: Array.from({ length: 40 }, (_, i) => ({
                  x: i,
                  y: 60 + Math.sin(i / 6) * 15 + Math.random() * 8,
                })),
                color: colors[0],
                fillOpacity: 0.25,
                strokeWidth: 1,
              },
              {
                name: "Server B",
                data: Array.from({ length: 40 }, (_, i) => ({
                  x: i,
                  y: 50 + Math.cos(i / 5) * 12 + Math.random() * 8,
                })),
                color: colors[1],
                fillOpacity: 0.25,
                strokeWidth: 1,
              },
            ]}
            yAxis={{ label: "CPU Usage (%)" }}
            xAxis={{ label: "Time (min)", domain: [0, 39] }}
            width="100%"
            height={400}
            showGrid
            showTooltip
          />
        </div>
      }
    />
  );
}

function StreamingAreaChart() {
  const { color } = useColorScheme();
  const [data, setData] = useState<DataPoint[]>(() =>
    Array.from({ length: 50 }, (_, i) => ({
      x: i,
      y: 50 + Math.sin(i / 8) * 20,
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newX = prev.length > 0 ? prev[prev.length - 1].x + 1 : 0;
        const newY = 50 + Math.sin(newX / 8) * 20 + Math.random() * 15;

        const updated = [...prev, { x: newX, y: newY }];
        return updated.length > 100 ? updated.slice(-100) : updated;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const xMin = data.length > 0 ? data[0].x : 0;
  const xMax = data.length > 0 ? data[data.length - 1].x : 100;

  return (
    <ComponentPreview
      title="Real-time Area Chart"
      description="Streaming data with smooth area visualization"
      code={`const [data, setData] = useState<DataPoint[]>(initialData);

useEffect(() => {
  const interval = setInterval(() => {
    setData(prev => {
      const newX = prev[prev.length - 1].x + 1;
      const newY = calculateValue(newX);
      const updated = [...prev, { x: newX, y: newY }];
      return updated.slice(-100); // Keep last 100 points
    });
  }, 100);

  return () => clearInterval(interval);
}, []);

<AreaChart
  series={[{
    name: "Live Signal",
    data,
    color: "#8b5cf6",
    fillOpacity: 0.4,
  }]}
  xAxis={{ domain: [data[0].x, data[data.length - 1].x] }}
/>`}
      preview={
        <div className="w-full">
          <AreaChart
            series={[
              {
                name: "Live Signal",
                data,
                color: color,
                fillOpacity: 0.4,
                strokeWidth: 2,
              },
            ]}
            xAxis={{ domain: [xMin, xMax] }}
            yAxis={{ label: "Value" }}
            width="100%"
            height={400}
            showGrid
            showTooltip
          />
        </div>
      }
    />
  );
}

function PrimitiveAreaChart() {
  const { color } = useColorScheme();

  return (
    <ComponentPreview
      title="Primitive Components"
      description="Build custom area charts with primitive components"
      code={`import { AreaChart } from "@/components/plexusui/charts/area-chart";

<AreaChart.Root
  series={[{ name: "Data", data, color: "#06b6d4" }]}
  width={800}
  height={400}
>
  <AreaChart.Canvas showGrid />
  <AreaChart.Axes />
  <AreaChart.Tooltip />
</AreaChart.Root>`}
      preview={
        <div className="w-full">
          <AreaChart.Root
            series={[
              {
                name: "Temperature",
                data: temperatureData,
                color: color,
                fillOpacity: 0.3,
              },
            ]}
            width="100%"
            height={400}
            xAxis={{ domain: [0, 49] }}
            preferWebGPU={true}
          >
            <AreaChart.Canvas showGrid />
            <AreaChart.Axes />
            <AreaChart.Tooltip />
          </AreaChart.Root>
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const areaChartProps: ApiProp[] = [
  {
    name: "series",
    type: "Series[]",
    default: "required",
    description:
      "Array of data series. Series: { name: string, data: Point[], color?: string, fillOpacity?: number, strokeWidth?: number }",
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
    type: "number",
    default: "800",
    description: "Chart width in pixels",
  },
  {
    name: "height",
    type: "number",
    default: "400",
    description: "Chart height in pixels",
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
    description: "Line and fill color (hex or rgb)",
  },
  {
    name: "fillOpacity",
    type: "number",
    default: "0.3",
    description: "Area fill opacity (0-1)",
  },
  {
    name: "strokeWidth",
    type: "number",
    default: "2",
    description: "Line thickness in pixels",
  },
];

const areaChartRootProps: ApiProp[] = [
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
    type: "number",
    default: "800",
    description: "Chart width in pixels",
  },
  {
    name: "height",
    type: "number",
    default: "400",
    description: "Chart height in pixels",
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

const areaChartPrimitiveProps: ApiProp[] = [
  {
    name: "AreaChart.Canvas",
    type: "component",
    default: "-",
    description: "Renders the area series. Props: showGrid?: boolean",
  },
  {
    name: "AreaChart.Axes",
    type: "component",
    default: "-",
    description: "Renders x and y axis with labels and ticks",
  },
  {
    name: "AreaChart.Tooltip",
    type: "component",
    default: "-",
    description: "Interactive tooltip showing data values on hover",
  },
];

// ============================================================================
// Main Export
// ============================================================================

export function AreaChartExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <BasicAreaChart />
        <MultiSeriesAreaChart />
        <StreamingAreaChart />
        <PrimitiveAreaChart />
      </div>

      {/* API Reference Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            AreaChart component for visualizing trends and cumulative data with filled areas
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AreaChart (All-in-One)</h3>
          <ApiReferenceTable props={areaChartProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Series Type</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Configuration for each data series in the chart
          </p>
          <ApiReferenceTable props={seriesType} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AreaChart.Root (Composable)</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Root component for building custom layouts with primitives
          </p>
          <ApiReferenceTable props={areaChartRootProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primitive Components</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use with AreaChart.Root for complete control over composition
          </p>
          <ApiReferenceTable props={areaChartPrimitiveProps} />
        </div>
      </div>
    </div>
  );
}
