"use client";

import type { DataPoint } from "@plexusui/components/charts/scatter-chart";
import { ScatterChart } from "@plexusui/components/charts/scatter-chart";
import { useEffect, useMemo, useState } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { useColorScheme, useMultiColors } from "@/components/color-scheme-provider";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Example Data
// ============================================================================

// Note: These need to be inside components with useMemo to prevent re-generation
// Keeping them here for now but they should be moved to component-level

// ============================================================================
// Example Components
// ============================================================================

function MultiSeriesScatterChart() {
  const colors = useMultiColors(3);

  const clusterData = useMemo(
    () => [
      // Cluster 1 (top-right)
      ...Array.from({ length: 30 }, () => ({
        x: 70 + Math.random() * 20,
        y: 70 + Math.random() * 20,
        size: 1.2,
      })),
      // Cluster 2 (bottom-left)
      ...Array.from({ length: 30 }, () => ({
        x: 20 + Math.random() * 20,
        y: 20 + Math.random() * 20,
        size: 1.0,
      })),
      // Cluster 3 (center)
      ...Array.from({ length: 40 }, () => ({
        x: 45 + Math.random() * 10,
        y: 45 + Math.random() * 10,
        size: 0.8,
      })),
    ],
    []
  );

  return (
    <ComponentPreview
      title="Multi-Series Scatter Plot"
      description="Visualizing multiple data clusters with different colors"
      code={`const clusterData = [
  // Three different clusters with varying properties
];

<ScatterChart
  series={[
    { name: "Cluster A", data: cluster1, color: "#ef4444", size: 10 },
    { name: "Cluster B", data: cluster2, color: "#3b82f6", size: 8 },
    { name: "Cluster C", data: cluster3, color: "#10b981", size: 6 },
  ]}
  xAxis={{ label: "X Axis" }}
  yAxis={{ label: "Y Axis" }}
  showGrid
  showTooltip
/>`}
      preview={
        <div className="w-full h-[400px]">
          <ScatterChart
            series={[
              {
                name: "High Performance",
                data: clusterData.slice(0, 30),
                color: colors[0],
                size: 10,
                opacity: 0.7,
              },
              {
                name: "Medium Performance",
                data: clusterData.slice(30, 60),
                color: colors[1],
                size: 8,
                opacity: 0.7,
              },
              {
                name: "Standard",
                data: clusterData.slice(60),
                color: colors[2],
                size: 6,
                opacity: 0.7,
              },
            ]}
            xAxis={{ label: "Processing Time (ms)" }}
            yAxis={{ label: "Throughput (req/s)" }}
            width="100%"
            height={400}
            showGrid={true}
            showTooltip
          />
        </div>
      }
    />
  );
}

function PrimitiveScatterChart() {
  const { color } = useColorScheme();

  const performanceData = useMemo(
    () =>
      Array.from({ length: 100 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
      })),
    []
  );

  return (
    <ComponentPreview
      title="Primitive Components"
      description="Build custom scatter plots with primitive components"
      code={`import { ScatterChart } from "@/components/plexusui/charts/scatter-chart";

<ScatterChart.Root
  series={[{ name: "Data", data, color: "#8b5cf6" }]}
  width={800}
  height={400}
>
  <ScatterChart.Canvas showGrid />
  <ScatterChart.Axes />
  <ScatterChart.Tooltip />
</ScatterChart.Root>`}
      preview={
        <div className="w-full h-[400px]">
          <ScatterChart.Root
            series={[
              {
                name: "Custom Data",
                data: performanceData,
                color: color,
                size: 9,
              },
            ]}
            width="100%"
            height={400}
            preferWebGPU={true}
          >
            <ScatterChart.Canvas showGrid />
            <ScatterChart.Axes />
            <ScatterChart.Tooltip />
          </ScatterChart.Root>
        </div>
      }
    />
  );
}

function RealtimeStreamingScatterChart() {
  const { color } = useColorScheme();
  const [isStreaming, setIsStreaming] = useState(true);

  // Start with 10K services for smooth 60fps streaming
  const [data, setData] = useState<DataPoint[]>(() => {
    const points: DataPoint[] = [];
    for (let i = 0; i < 10000; i++) {
      const cluster = Math.random();
      let cpu: number;
      let memory: number;

      if (cluster < 0.65) {
        cpu = Math.min(40, Math.max(5, 15 + (Math.random() + Math.random() + Math.random()) * 5));
        memory = Math.min(
          60,
          Math.max(15, 35 + (Math.random() + Math.random() + Math.random()) * 8)
        );
      } else if (cluster < 0.85) {
        cpu = Math.min(95, Math.max(60, 75 + (Math.random() + Math.random()) * 8));
        memory = Math.min(95, Math.max(60, 75 + (Math.random() + Math.random()) * 8));
      } else if (cluster < 0.95) {
        cpu = Math.min(30, Math.max(5, 15 + Math.random() * 10));
        memory = Math.min(95, Math.max(70, 80 + Math.random() * 10));
      } else {
        cpu = Math.min(98, Math.max(75, 85 + Math.random() * 10));
        memory = Math.min(50, Math.max(15, 25 + Math.random() * 15));
      }

      points.push({ x: cpu, y: memory, size: 0.8 });
    }
    return points;
  });

  useEffect(() => {
    if (!isStreaming) return;

    let animationFrame: number;

    const animate = () => {
      // Stream data: randomly update 1% of services each frame to simulate real-time changes
      setData((prevData) => {
        const newData = [...prevData];
        const updateCount = Math.floor(prevData.length * 0.01); // Update 1% per frame for better FPS

        for (let i = 0; i < updateCount; i++) {
          const idx = Math.floor(Math.random() * newData.length);
          const point = newData[idx];

          // Simulate realistic metric drift
          let newCpu = point.x + (Math.random() - 0.5) * 3;
          let newMemory = point.y + (Math.random() - 0.5) * 2;

          // Occasional spike (simulates load burst)
          if (Math.random() < 0.01) {
            newCpu += Math.random() * 20;
            newMemory += Math.random() * 15;
          }

          // Clamp values
          newCpu = Math.max(0, Math.min(100, newCpu));
          newMemory = Math.max(0, Math.min(100, newMemory));

          newData[idx] = { ...point, x: newCpu, y: newMemory };
        }

        return newData;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isStreaming]);

  return (
    <ComponentPreview
      title="Real-Time Streaming - 10K Services @ 60fps"
      description="Live simulation of streaming metrics from 10,000 services with real-time updates at 60fps"
      code={`import { ScatterChart } from "@/components/plexusui/charts/scatter-chart";
import { useState, useEffect } from "react";

// Initialize 10K services
const [data, setData] = useState(() => generateServices(10000));

// Stream updates at 60fps
useEffect(() => {
  const animate = () => {
    setData(prevData => {
      const newData = [...prevData];
      const updateCount = Math.floor(prevData.length * 0.02);

      for (let i = 0; i < updateCount; i++) {
        const idx = Math.floor(Math.random() * newData.length);
        const point = newData[idx];

        // Simulate metric drift
        let newCpu = point.x + (Math.random() - 0.5) * 3;
        let newMemory = point.y + (Math.random() - 0.5) * 2;

        // Occasional spike
        if (Math.random() < 0.01) {
          newCpu += Math.random() * 20;
          newMemory += Math.random() * 15;
        }

        newData[idx] = {
          ...point,
          x: Math.max(0, Math.min(100, newCpu)),
          y: Math.max(0, Math.min(100, newMemory))
        };
      }

      return newData;
    });

    requestAnimationFrame(animate);
  };

  const frame = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frame);
}, []);

<ScatterChart
  series={[{ name: "Services", data, color: "#06b6d4", size: 3 }]}
  xAxis={{ label: "CPU Usage (%)", domain: [0, 100] }}
  yAxis={{ label: "Memory Usage (%)", domain: [0, 100] }}
  preferWebGPU={true}
/>`}
      preview={
        <div className="w-full h-[400px] relative">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <div className="bg-black/80 text-white px-3 py-1.5 rounded-md text-sm font-mono">
              {data.length.toLocaleString()} services
            </div>
            <button
              type="button"
              onClick={() => setIsStreaming(!isStreaming)}
              className="bg-black/80 text-white px-3 py-1.5 rounded-md text-sm font-mono hover:bg-black/90 transition-colors"
            >
              {isStreaming ? "Pause" : "Stream"}
            </button>
          </div>
          <ScatterChart
            series={[
              {
                name: "Streaming Services",
                data: data,
                color: color,
                size: 3,
                opacity: 0.6,
              },
            ]}
            xAxis={{ label: "CPU Usage (%)", domain: [0, 100] }}
            yAxis={{ label: "Memory Usage (%)", domain: [0, 100] }}
            width="100%"
            height={400}
            showGrid
            showTooltip
            preferWebGPU={true}
          />
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const scatterChartProps: ApiProp[] = [
  {
    name: "series",
    type: "Series[]",
    default: "required",
    description:
      "Array of data series. Series: { name: string, data: Point[], color?: string, size?: number, opacity?: number }",
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

const scatterSeriesType: ApiProp[] = [
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
    description: "Array of data points. Point: { x: number, y: number, size?: number }",
  },
  {
    name: "color",
    type: "string",
    default: '"#3b82f6"',
    description: "Point color (hex or rgb)",
  },
  {
    name: "size",
    type: "number",
    default: "1",
    description: "Point size multiplier",
  },
  {
    name: "opacity",
    type: "number",
    default: "0.8",
    description: "Point opacity (0-1)",
  },
];

const scatterChartRootProps: ApiProp[] = [
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

const scatterChartPrimitiveProps: ApiProp[] = [
  {
    name: "ScatterChart.Canvas",
    type: "component",
    default: "-",
    description: "Renders the scatter points. Props: showGrid?: boolean",
  },
  {
    name: "ScatterChart.Axes",
    type: "component",
    default: "-",
    description: "Renders x and y axis with labels and ticks",
  },
  {
    name: "ScatterChart.Tooltip",
    type: "component",
    default: "-",
    description: "Interactive tooltip showing data values on hover",
  },
];

// ============================================================================
// Main Export
// ============================================================================

export function ScatterChartExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <MultiSeriesScatterChart />
        <PrimitiveScatterChart />
        <RealtimeStreamingScatterChart />
      </div>

      {/* API Reference Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            ScatterChart component for visualizing correlations and distributions in 2D space
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ScatterChart (All-in-One)</h3>
          <ApiReferenceTable props={scatterChartProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Series Type</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Configuration for each data series in the chart
          </p>
          <ApiReferenceTable props={scatterSeriesType} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ScatterChart.Root</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Root component for building custom layouts with primitives
          </p>
          <ApiReferenceTable props={scatterChartRootProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primitive Components</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use with ScatterChart.Root for complete control over composition
          </p>
          <ApiReferenceTable props={scatterChartPrimitiveProps} />
        </div>
      </div>
    </div>
  );
}
