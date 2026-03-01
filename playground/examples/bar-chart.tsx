/** biome-ignore-all lint/a11y/noStaticElementInteractions: chart demo containers use custom pointer event handling */
"use client";

import type { DataPoint } from "@plexusui/components/charts/bar-chart";
import { BarChart } from "@plexusui/components/charts/bar-chart";
import { MinimapContainer } from "@plexusui/components/charts/chart-minimap";
import React, { useMemo, useState } from "react";
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
      code={`import { BarChart } from "@/components/plexusui/charts/bar-chart";

const data = [
  { x: "Jan", y: 45 },
  { x: "Feb", y: 52 },
  { x: "Mar", y: 48 },
  { x: "Apr", y: 61 },
  { x: "May", y: 55 },
  { x: "Jun", y: 67 },
];

<BarChart
  series={[{ name: "Revenue", data, color: "#3b82f6" }]}
  width={800}
  height={400}
  showTooltip
/>`}
      preview={
        <div className="w-full h-[400px]">
          <BarChart
            series={[{ name: "Revenue ($K)", data: monthlyData, color: color }]}
            yAxis={{ label: "Revenue ($K)" }}
            width="100%"
            height={400}
            showTooltip
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

// Simple minimap component
function SimpleMinimap({
  series,
  fullRange,
  visibleRange,
  onRangeChange,
}: {
  series: any[];
  fullRange: { min: number; max: number };
  visibleRange: { start: number; end: number };
  onRangeChange: (start: number, end: number) => void;
}) {
  const [dragMode, setDragMode] = React.useState<"pan" | "resize-left" | "resize-right" | null>(
    null
  );
  const [dragStart, setDragStart] = React.useState({
    x: 0,
    startVal: 0,
    endVal: 0,
  });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const rangeWidth = fullRange.max - fullRange.min;
  const leftPercent = ((visibleRange.start - fullRange.min) / rangeWidth) * 100;
  const widthPercent = ((visibleRange.end - visibleRange.start) / rangeWidth) * 100;

  const handlePanStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragMode("pan");
    setDragStart({
      x: e.clientX,
      startVal: visibleRange.start,
      endVal: visibleRange.end,
    });
  };

  const handleResizeLeftStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragMode("resize-left");
    setDragStart({
      x: e.clientX,
      startVal: visibleRange.start,
      endVal: visibleRange.end,
    });
  };

  const handleResizeRightStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragMode("resize-right");
    setDragStart({
      x: e.clientX,
      startVal: visibleRange.start,
      endVal: visibleRange.end,
    });
  };

  React.useEffect(() => {
    if (!dragMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const deltaX = e.clientX - dragStart.x;
      const deltaValue = (deltaX / rect.width) * rangeWidth;

      let newStart = visibleRange.start;
      let newEnd = visibleRange.end;

      if (dragMode === "pan") {
        const duration = dragStart.endVal - dragStart.startVal;
        newStart = dragStart.startVal + deltaValue;
        newEnd = dragStart.endVal + deltaValue;

        // Clamp to bounds
        if (newStart < fullRange.min) {
          newStart = fullRange.min;
          newEnd = fullRange.min + duration;
        }
        if (newEnd > fullRange.max) {
          newEnd = fullRange.max;
          newStart = fullRange.max - duration;
        }
      } else if (dragMode === "resize-left") {
        newStart = Math.max(
          fullRange.min,
          Math.min(dragStart.startVal + deltaValue, dragStart.endVal - 86400000)
        ); // Min 1 day
        newEnd = dragStart.endVal;
      } else if (dragMode === "resize-right") {
        newStart = dragStart.startVal;
        newEnd = Math.min(
          fullRange.max,
          Math.max(dragStart.endVal + deltaValue, dragStart.startVal + 86400000)
        ); // Min 1 day
      }

      onRangeChange(newStart, newEnd);
    };

    const handleMouseUp = () => setDragMode(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragMode, dragStart, rangeWidth, fullRange, onRangeChange, visibleRange]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: 60, width: "100%", overflow: "hidden" }}
    >
      {/* Bar chart with negative margins to eliminate padding */}
      <div
        style={{
          marginLeft: -60,
          marginRight: -20,
          marginTop: -20,
          marginBottom: -50,
        }}
      >
        <BarChart.Root
          series={series}
          xAxis={{ domain: [fullRange.min, fullRange.max] as [number, number] }}
          yAxis={{ domain: "auto" }}
          width="calc(100% + 80px)"
          height={130}
          grouped={true}
          barWidth={1}
        >
          <BarChart.Canvas showGrid={false} />
        </BarChart.Root>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0" style={{ pointerEvents: "none", zIndex: 10 }}>
        {/* Left dimmed area */}
        <div
          className="absolute inset-y-0 bg-black/60"
          style={{ left: 0, width: `${leftPercent}%` }}
        />
        {/* Right dimmed area */}
        <div
          className="absolute inset-y-0 bg-black/60"
          style={{ left: `${leftPercent + widthPercent}%`, right: 0 }}
        />
        {/* Selection box */}
        <div
          className="absolute inset-y-0 border-2 border-blue-500 cursor-move bg-transparent"
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            pointerEvents: "auto",
          }}
          onMouseDown={handlePanStart}
        >
          {/* Left handle */}
          <div
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-10 bg-white border-2 border-blue-500 rounded cursor-ew-resize hover:bg-blue-50"
            style={{ pointerEvents: "auto" }}
            onMouseDown={handleResizeLeftStart}
          />

          <div
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-10 bg-white border-2 border-blue-500 rounded cursor-ew-resize hover:bg-blue-50"
            style={{ pointerEvents: "auto" }}
            onMouseDown={handleResizeRightStart}
          />
        </div>
      </div>
    </div>
  );
}

function TimeSeriesWithMinimap() {
  const colors = useMultiColors(3);
  const { series: rawSeries, categories } = useMemo(() => generateTimeSeriesData(), []);

  // Use only first 3 series to keep it clean
  const limitedSeries = useMemo(() => rawSeries.slice(0, 3), [rawSeries]);
  const limitedCategories = useMemo(() => categories.slice(0, 3), [categories]);

  // Calculate full time range
  const fullTimeRange = useMemo(() => {
    const allTimestamps = limitedSeries.flatMap((s) => s.map((d) => d.x as number));
    return {
      min: Math.min(...allTimestamps),
      max: Math.max(...allTimestamps),
    };
  }, [limitedSeries]);

  // State for visible range (initialize to show ~50% of data in the middle)
  const [visibleRange, setVisibleRange] = useState({
    start: new Date(2023, 11, 1).getTime(),
    end: new Date(2024, 11, 27).getTime(),
  });

  // Sync visible range with actual data range on mount - show middle 50%
  React.useEffect(() => {
    if (fullTimeRange.min && fullTimeRange.max) {
      const totalRange = fullTimeRange.max - fullTimeRange.min;
      const quarterRange = totalRange * 0.25;

      setVisibleRange({
        start: fullTimeRange.min + quarterRange,
        end: fullTimeRange.max - quarterRange,
      });
    }
  }, [fullTimeRange.min, fullTimeRange.max]);

  // Filter data based on visible range
  const displayedSeries = useMemo(() => {
    const filtered = limitedSeries.map((data, idx) => ({
      name: limitedCategories[idx],
      data: data.filter(
        (d) => (d.x as number) >= visibleRange.start && (d.x as number) <= visibleRange.end
      ),
      color: colors[idx],
    }));

    console.log(
      "Filtered data:",
      filtered.map((s) => ({
        name: s.name,
        points: s.data.length,
        firstPoint: s.data[0],
        lastPoint: s.data[s.data.length - 1],
      }))
    );

    return filtered;
  }, [limitedSeries, limitedCategories, colors, visibleRange]);

  // Prepare minimap series (same format as main chart)
  const minimapSeries = useMemo(() => {
    return limitedSeries.map((data, idx) => ({
      name: limitedCategories[idx],
      data: data,
      color: colors[idx],
    }));
  }, [limitedSeries, limitedCategories, colors]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ComponentPreview
      title="Time Series with Minimap"
      description="Navigate large datasets with an interactive minimap and range selector"
      code={`import { BarChart, ChartBrushSelector, MinimapContainer } from "@plexusui/components/charts";

const [visibleRange, setVisibleRange] = useState({
  start: oneYearAgo,
  end: now
});

<MinimapContainer
  gap={20}
  minimap={
    <div className="relative chart-minimap-container" style={{ height: 100, width: '100%' }}>
      <BarChart.Root
        series={minimapSeries}
        xAxis={{ domain: [fullTimeRange.min, fullTimeRange.max] }}
        yAxis={{ domain: "auto" }}
        width="100%"
        height={100}
        grouped={true}
        barWidth={2}
      >
        <BarChart.Canvas showGrid={false} />
        <ChartBrushSelector
          start={visibleRange.start}
          end={visibleRange.end}
          fullMin={fullTimeRange.min}
          fullMax={fullTimeRange.max}
          onSelectionChange={(start, end) => setVisibleRange({ start, end })}
          color="#3b82f6"
          containerClass="chart-minimap-container"
        />
      </BarChart.Root>
    </div>
  }
>
  <BarChart
    series={displayedSeries}
    grouped={true}
    showTooltip
    width="100%"
    height={400}
    barWidth={8}
    xAxis={{
      label: "Date",
      formatter: (val) => formatDate(val)
    }}
  />
</MinimapContainer>`}
      preview={
        <div className="w-full">
          <MinimapContainer
            gap={20}
            minimap={
              <SimpleMinimap
                series={minimapSeries}
                fullRange={fullTimeRange}
                visibleRange={visibleRange}
                onRangeChange={(start, end) => setVisibleRange({ start, end })}
              />
            }
          >
            <BarChart
              series={displayedSeries}
              grouped={true}
              showTooltip
              width="100%"
              height={400}
              barWidth={8}
              xAxis={{
                label: "Date",
                domain: [visibleRange.start, visibleRange.end] as [number, number],
                formatter: (val: number) => formatDate(val),
              }}
              yAxis={{ label: "Messages" }}
            />
          </MinimapContainer>
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
        <TimeSeriesWithMinimap />
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
