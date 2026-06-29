/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import type { DataPoint } from "@plexusui/components/charts/bar-chart";
import { BarChart } from "@plexusui/components/charts/bar-chart";
import { useMemo } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { useColorScheme, useMultiColors } from "@/components/color-scheme-provider";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Example Data
// ============================================================================

const monthlyData: DataPoint[] = [
  { x: "Jan", y: 45 },
  { x: "Feb", y: 52 },
  { x: "Mar", y: 48 },
  { x: "Apr", y: 61 },
  { x: "May", y: 55 },
  { x: "Jun", y: 67 },
];

const quarterlyData = [
  { x: "Q1", y: 145 },
  { x: "Q2", y: 183 },
  { x: "Q3", y: 201 },
  { x: "Q4", y: 167 },
];

const departmentData: DataPoint[] = [
  { x: "Engineering", y: 85 },
  { x: "Design", y: 62 },
  { x: "Sales", y: 78 },
  { x: "Marketing", y: 54 },
  { x: "Support", y: 91 },
];

// Generate high-density time-series data (2016-2024)
function generateTimeSeriesData() {
  const startYear = 2016;
  const endYear = 2024;
  const categories = [
    "Arbitrum",
    "Ethereum",
    "Optimism",
    "Avalanche",
    "Harmony",
    "Fantom",
    "Polygon",
    "BSC",
    "Solana",
    "Celo",
  ];

  const series = categories.map((_, catIdx) => {
    const data: DataPoint[] = [];
    const startDate = new Date(startYear, 0, 1);
    const endDate = new Date(endYear, 11, 31);

    // Generate weekly data points
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
      const dayOfYear = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Create realistic variation with trends and seasonality
      const trend = dayOfYear * 0.002; // Gradual increase over time
      const seasonality = Math.sin((dayOfYear / 365) * Math.PI * 2) * 10;
      const noise = Math.random() * 30;
      const categoryOffset = catIdx * 15; // Each category has different baseline

      // Some categories started later
      if (catIdx > 5 && d.getFullYear() < 2019) continue;
      if (catIdx > 8 && d.getFullYear() < 2020) continue;

      const value = Math.max(0, trend + seasonality + noise + categoryOffset + 20);

      data.push({
        x: d.getTime(),
        y: Math.round(value),
      });
    }

    return data;
  });

  return { series, categories };
}

// ============================================================================
// Example Components
// ============================================================================

function BasicBarChart() {
  const { color } = useColorScheme();

  return (
    <ComponentPreview
      title="Basic Bar Chart"
      description="Simple vertical bar chart showing monthly metrics"
      code={`import { BarChart } from "@plexusui/components/charts/bar-chart";

const data = [
  { x: "Jan", y: 45 }, { x: "Feb", y: 52 }, { x: "Mar", y: 48 },
  { x: "Apr", y: 61 }, { x: "May", y: 55 }, { x: "Jun", y: 67 },
];

// Same config props as every other chart.
<BarChart
  series={[{ name: "Revenue", data, color: "#3b82f6" }]}
  width={800}
  height={400}
  showTooltip
  showLegend
  referenceLines={[{ value: 60, severity: "warning", label: "Goal" }]}
/>`}
      preview={
        <div className="w-full h-[420px]">
          <BarChart
            series={[{ name: "Revenue ($K)", data: monthlyData, color: color }]}
            yAxis={{ label: "Revenue ($K)" }}
            width="100%"
            height={420}
            showTooltip
            showLegend
            referenceLines={[{ value: 60, severity: "warning", label: "Goal" }]}
            barWidth={60}
          />
        </div>
      }
    />
  );
}

function GroupedBarChart() {
  const colors = useMultiColors(2);

  return (
    <ComponentPreview
      title="Grouped Bar Chart"
      description="Multiple series displayed side-by-side for comparison"
      code={`const actualData = [
  { x: "Q1", y: 145 },
  { x: "Q2", y: 183 },
  { x: "Q3", y: 201 },
  { x: "Q4", y: 167 },
];

const targetData = [
  { x: "Q1", y: 150 },
  { x: "Q2", y: 175 },
  { x: "Q3", y: 190 },
  { x: "Q4", y: 180 },
];

<BarChart
  series={[
    { name: "Actual", data: actualData, color: "#10b981" },
    { name: "Target", data: targetData, color: "#6366f1" },
  ]}
  grouped={true}
  showTooltip
/>`}
      preview={
        <div className="w-full h-[400px]">
          <BarChart
            series={[
              { name: "Actual", data: quarterlyData, color: colors[0] },
              {
                name: "Target",
                data: [
                  { x: "Q1", y: 150 },
                  { x: "Q2", y: 175 },
                  { x: "Q3", y: 190 },
                  { x: "Q4", y: 180 },
                ],
                color: colors[1],
              },
            ]}
            yAxis={{ label: "Sales ($K)" }}
            width="100%"
            height={400}
            grouped={true}
            showTooltip
            barWidth={80}
          />
        </div>
      }
    />
  );
}

function HorizontalBarChart() {
  const { color } = useColorScheme();

  return (
    <ComponentPreview
      title="Horizontal Bar Chart"
      description="Bar chart with horizontal orientation for categorical data"
      code={`const departmentData = [
  { x: "Engineering", y: 85 },
  { x: "Design", y: 62 },
  { x: "Sales", y: 78 },
  { x: "Marketing", y: 54 },
  { x: "Support", y: 91 },
];

<BarChart
  series={[{ name: "Team Size", data: departmentData, color: "#f59e0b" }]}
  orientation="horizontal"
  xAxis={{ label: "Number of Employees" }}
  showTooltip
/>`}
      preview={
        <div className="w-full h-[400px]">
          <BarChart
            series={[{ name: "Team Size", data: departmentData, color: color }]}
            orientation="horizontal"
            xAxis={{ label: "Number of Employees" }}
            width="100%"
            height={400}
            showTooltip
            barWidth={50}
          />
        </div>
      }
    />
  );
}

function StackedBarChart() {
  const colors = useMultiColors(3);

  return (
    <ComponentPreview
      title="Multi-Category Comparison"
      description="Comparing multiple metrics across categories"
      code={`<BarChart
  series={[
    { name: "Product A", data: dataA, color: "#ef4444" },
    { name: "Product B", data: dataB, color: "#3b82f6" },
    { name: "Product C", data: dataC, color: "#10b981" },
  ]}
  grouped={true}
  showTooltip
/>`}
      preview={
        <div className="w-full h-[400px]">
          <BarChart
            series={[
              {
                name: "Product A",
                data: [
                  { x: "Jan", y: 30 },
                  { x: "Feb", y: 35 },
                  { x: "Mar", y: 28 },
                  { x: "Apr", y: 40 },
                ],
                color: colors[0],
              },
              {
                name: "Product B",
                data: [
                  { x: "Jan", y: 45 },
                  { x: "Feb", y: 50 },
                  { x: "Mar", y: 48 },
                  { x: "Apr", y: 55 },
                ],
                color: colors[1],
              },
              {
                name: "Product C",
                data: [
                  { x: "Jan", y: 25 },
                  { x: "Feb", y: 30 },
                  { x: "Mar", y: 35 },
                  { x: "Apr", y: 32 },
                ],
                color: colors[2],
              },
            ]}
            yAxis={{ label: "Sales (Units)" }}
            width="100%"
            height={400}
            grouped={true}
            showTooltip
            barWidth={100}
          />
        </div>
      }
    />
  );
}

function PrimitiveBarChart() {
  const { color } = useColorScheme();

  return (
    <ComponentPreview
      title="Primitive Components"
      description="Build custom bar charts with primitive components"
      code={`import { BarChart } from "@/components/plexusui/charts/bar-chart";

<BarChart.Root
  series={[{ name: "Data", data, color: "#8b5cf6" }]}
  width={800}
  height={400}
>
  <BarChart.Canvas showGrid />
  <BarChart.Axes />
  <BarChart.Tooltip />
</BarChart.Root>`}
      preview={
        <div className="w-full h-[400px]">
          <BarChart.Root
            series={[{ name: "Custom Metrics", data: monthlyData, color: color }]}
            width="100%"
            height={400}
            preferWebGPU={true}
          >
            <BarChart.Canvas showGrid />
            <BarChart.Axes />
            <BarChart.Tooltip />
          </BarChart.Root>
        </div>
      }
    />
  );
}

function HighDensityTimeSeriesBarChart() {
  const colors = useMultiColors(10);
  const { series: rawSeries, categories } = useMemo(() => generateTimeSeriesData(), []);

  // Current visible range (default to last 6 months of data)
  const visibleRange = useMemo(() => {
    const now = new Date(2024, 11, 31).getTime();
    const sixMonthsAgo = new Date(2024, 5, 1).getTime();
    return { start: sixMonthsAgo, end: now };
  }, []);

  // Filter data based on visible range
  const displayedSeries = useMemo(() => {
    return rawSeries.map((data, idx) => ({
      name: categories[idx],
      data: data.filter(
        (d) => (d.x as number) >= visibleRange.start && (d.x as number) <= visibleRange.end
      ),
      color: colors[idx],
    }));
  }, [rawSeries, categories, colors, visibleRange]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <ComponentPreview
      title="High-Density Time Series"
      description="Visualize large time-series datasets with grouped bar charts"
      code={`import { BarChart } from "@/components/plexusui/charts/bar-chart";

<BarChart
  series={displayedSeries}
  grouped={true}
  showTooltip
  width="100%"
  height={400}
  barWidth={12}
  xAxis={{
    label: "Date",
    formatter: (val) => formatDate(val)
  }}
  yAxis={{ label: "Messages" }}
/>`}
      preview={
        <div className="w-full h-[400px]">
          <BarChart
            series={displayedSeries}
            grouped={true}
            showTooltip
            width="100%"
            height={400}
            barWidth={12}
            xAxis={{
              label: "Date",
              formatter: (val: number) => formatDate(val),
            }}
            yAxis={{ label: "Messages" }}
          />
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const barChartProps: ApiProp[] = [
  {
    name: "series",
    type: "Series[]",
    default: "required",
    description: "Array of data series. Series: { name: string, data: Point[], color?: string }",
  },
  {
    name: "xAxis",
    type: "{ label?: string, formatter?: (value: string | number) => string }",
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
    name: "orientation",
    type: '"vertical" | "horizontal"',
    default: '"vertical"',
    description: "Bar chart orientation",
  },
  {
    name: "grouped",
    type: "boolean",
    default: "false",
    description: "Display multiple series side-by-side (grouped) or as single bars",
  },
  {
    name: "barWidth",
    type: "number",
    default: "auto",
    description: "Width of each bar in pixels (or bar group width when grouped)",
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

const barSeriesType: ApiProp[] = [
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
    description: "Array of data points. Point: { x: string | number, y: number }",
  },
  {
    name: "color",
    type: "string",
    default: '"#3b82f6"',
    description: "Bar color (hex or rgb)",
  },
];

const barChartRootProps: ApiProp[] = [
  {
    name: "series",
    type: "Series[]",
    default: "required",
    description: "Array of data series to plot",
  },
  {
    name: "xAxis",
    type: "{ label?: string, formatter?: (value: string | number) => string }",
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
    name: "orientation",
    type: '"vertical" | "horizontal"',
    default: '"vertical"',
    description: "Bar chart orientation",
  },
  {
    name: "grouped",
    type: "boolean",
    default: "false",
    description: "Display multiple series side-by-side",
  },
  {
    name: "barWidth",
    type: "number",
    default: "auto",
    description: "Width of each bar in pixels",
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

const barChartPrimitiveProps: ApiProp[] = [
  {
    name: "BarChart.Canvas",
    type: "component",
    default: "-",
    description: "Renders the bar series. Props: showGrid?: boolean",
  },
  {
    name: "BarChart.Axes",
    type: "component",
    default: "-",
    description: "Renders x and y axis with labels and ticks",
  },
  {
    name: "BarChart.Tooltip",
    type: "component",
    default: "-",
    description: "Interactive tooltip showing data values on hover",
  },
];

// ============================================================================
// Main Export
// ============================================================================

export function BarChartExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <BasicBarChart />
        <GroupedBarChart />
        <HorizontalBarChart />
        <StackedBarChart />
        <HighDensityTimeSeriesBarChart />
        <PrimitiveBarChart />
      </div>

      {/* API Reference Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            BarChart component for comparing categorical data with vertical or horizontal bars
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">BarChart (All-in-One)</h3>
          <ApiReferenceTable props={barChartProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Series Type</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Configuration for each data series in the chart
          </p>
          <ApiReferenceTable props={barSeriesType} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">BarChart.Root (Composable)</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Root component for building custom layouts with primitives
          </p>
          <ApiReferenceTable props={barChartRootProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primitive Components</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use with BarChart.Root for complete control over composition
          </p>
          <ApiReferenceTable props={barChartPrimitiveProps} />
        </div>
      </div>
    </div>
  );
}
