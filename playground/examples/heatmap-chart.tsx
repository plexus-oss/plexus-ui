"use client";

import type { DataPoint } from "@plexusui/components/charts/heatmap-chart";
import { HeatmapChart } from "@plexusui/components/charts/heatmap-chart";
import { useEffect, useState } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Example Data
// ============================================================================

// Server activity heatmap (hour x day)
const serverActivityData: DataPoint[] = [];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => i);

for (const day of days) {
  for (const hour of hours) {
    // Simulate activity patterns
    let value = 20;
    // Business hours (9-17) have more activity
    if (hour >= 9 && hour <= 17) value += 40;
    // Weekend has less activity
    if (day === "Sat" || day === "Sun") value *= 0.5;
    // Add some randomness
    value += Math.random() * 20;

    serverActivityData.push({
      x: day,
      y: hour,
      value,
    });
  }
}

// Correlation matrix
const correlationData: DataPoint[] = [];
const variables = ["Temp", "Pressure", "Humidity", "Wind", "Visibility"];

for (let i = 0; i < variables.length; i++) {
  for (let j = 0; j < variables.length; j++) {
    const value = i === j ? 1 : Math.random() * 0.8 + 0.1;
    correlationData.push({
      x: variables[i],
      y: variables[j],
      value,
    });
  }
}

// Grid performance data
const gridPerformanceData: DataPoint[] = [];
for (let x = 0; x < 10; x++) {
  for (let y = 0; y < 10; y++) {
    const value = Math.sin(x / 2) * Math.cos(y / 2) * 50 + 50 + Math.random() * 10;
    gridPerformanceData.push({ x, y, value });
  }
}

// ============================================================================
// Example Components
// ============================================================================

function RealTimeSystemMonitor() {
  const [isPaused, setIsPaused] = useState(false);

  // System monitoring parameters
  const CPU_CORES = 16; // Number of CPU cores to monitor
  const HISTORY_SECONDS = 30; // 30 seconds of history
  const UPDATE_RATE = 10; // Hz - update 10 times per second
  const WINDOW_SIZE = HISTORY_SECONDS * UPDATE_RATE; // 300 time slices

  // Initialize with baseline CPU usage data
  const [cpuData, setCpuData] = useState<DataPoint[]>(() => {
    const data: DataPoint[] = [];
    for (let t = 0; t < WINDOW_SIZE; t++) {
      for (let core = 0; core < CPU_CORES; core++) {
        // Start with idle CPUs (10-20% usage)
        const baseUsage = 10 + Math.random() * 10;
        data.push({
          x: t / UPDATE_RATE,
          y: core,
          value: baseUsage,
        });
      }
    }
    return data;
  });

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCpuData((prev) => {
        const newTimeSlice: DataPoint[] = [];
        const lastTime = prev.length > 0 ? (prev[prev.length - 1].x as number) : HISTORY_SECONDS;
        const newTime = lastTime + 1 / UPDATE_RATE;

        for (let core = 0; core < CPU_CORES; core++) {
          // Get previous value for this core
          const prevCoreData = prev.filter((p) => p.y === core);
          const prevValue =
            prevCoreData.length > 0 ? prevCoreData[prevCoreData.length - 1].value : 20;

          // Simulate realistic CPU usage patterns
          let newValue = prevValue;

          // Gradual drift
          newValue += (Math.random() - 0.5) * 15;

          // Occasional workload spike (simulating task execution)
          if (Math.random() < 0.05) {
            newValue += Math.random() * 50;
          }

          // Pull towards baseline idle (20%)
          newValue += (20 - prevValue) * 0.1;

          // Some cores are busier than others (asymmetric workload)
          if (core < 4) {
            // First 4 cores handle more work
            newValue += 10;
          }

          // Clamp to 0-100% range
          newValue = Math.max(0, Math.min(100, newValue));

          newTimeSlice.push({
            x: newTime,
            y: core,
            value: newValue,
          });
        }

        // Remove old data outside the time window
        const filtered = prev.filter((p) => (p.x as number) > newTime - HISTORY_SECONDS);

        return [...filtered, ...newTimeSlice];
      });
    }, 1000 / UPDATE_RATE);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <ComponentPreview
      title="Real-Time System Monitor"
      description={`Live CPU core usage tracking at ${UPDATE_RATE} Hz - ${HISTORY_SECONDS}s rolling window across ${CPU_CORES} cores`}
      code={`import { HeatmapChart } from "@/components/plexusui/charts/heatmap-chart";
import { useState, useEffect } from "react";

const CPU_CORES = 16;
const HISTORY_SECONDS = 30;
const UPDATE_RATE = 10; // Hz

const [cpuData, setCpuData] = useState<DataPoint[]>([]);

// Update CPU usage data in real-time
useEffect(() => {
  const interval = setInterval(() => {
    setCpuData(prev => {
      const newTimeSlice: DataPoint[] = [];
      const newTime = lastTime + 1 / UPDATE_RATE;

      for (let core = 0; core < CPU_CORES; core++) {
        const prevValue = getPrevCoreValue(prev, core);
        let newValue = prevValue;

        // Simulate realistic CPU usage
        newValue += (Math.random() - 0.5) * 15;
        if (Math.random() < 0.05) newValue += Math.random() * 50;
        newValue += (20 - prevValue) * 0.1;
        newValue = Math.max(0, Math.min(100, newValue));

        newTimeSlice.push({ x: newTime, y: core, value: newValue });
      }

      return [...prev.filter(p => p.x > newTime - HISTORY_SECONDS), ...newTimeSlice];
    });
  }, 1000 / UPDATE_RATE);

  return () => clearInterval(interval);
}, []);

<HeatmapChart
  data={cpuData}
  xAxis={{ label: "Time (seconds)" }}
  yAxis={{ label: "CPU Core" }}
  colorScale={{
    min: 0,
    max: 100,
    colors: ["#10b981", "#fbbf24", "#ef4444"]
  }}
  width={800}
  height={400}
  preferWebGPU={true}
/>`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">CPU Core Usage Monitor - {CPU_CORES} Cores</div>
              <div className="text-xs text-zinc-500">
                Update Rate: {UPDATE_RATE} Hz | Window: {HISTORY_SECONDS}s | Data Points:{" "}
                {cpuData.length}
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

          <div className="w-full h-[500px]">
            <HeatmapChart
              data={cpuData}
              xAxis={{
                label: "Time (seconds)",
                formatter: (v: number | string) => {
                  const num = typeof v === "number" ? v : parseFloat(String(v));
                  return `${num.toFixed(1)}s`;
                },
              }}
              yAxis={{
                label: "CPU Core",
                formatter: (v: number | string) => {
                  const num = typeof v === "number" ? v : parseFloat(String(v));
                  return `Core ${Math.round(num)}`;
                },
              }}
              colorScale={(value: number) => {
                // Green -> Yellow -> Red color scale based on CPU usage
                if (value < 0.3) {
                  // Green to yellow-green
                  const r = Math.round(16 + (value / 0.3) * 220);
                  return `rgb(${r}, 185, 129)`;
                } else if (value < 0.7) {
                  // Yellow-green to yellow
                  const factor = (value - 0.3) / 0.4;
                  const r = Math.round(236 + factor * 15);
                  const g = Math.round(185 - factor * 100);
                  return `rgb(${r}, ${g}, 36)`;
                } else {
                  // Yellow to red
                  const factor = (value - 0.7) / 0.3;
                  const r = 239;
                  const g = Math.round(135 - factor * 67);
                  const b = Math.round(36 + factor * 32);
                  return `rgb(${r}, ${g}, ${b})`;
                }
              }}
              minValue={0}
              maxValue={100}
              width={800}
              height={500}
              preferWebGPU={true}
              cellGap={1}
              showTooltip
            />
          </div>
        </div>
      }
    />
  );
}

function PrimitiveHeatmapChart() {
  return (
    <ComponentPreview
      title="Primitive Components"
      description="Build custom heatmaps with primitive components for full control"
      code={`import { HeatmapChart } from "@/components/plexusui/charts/heatmap-chart";

<HeatmapChart.Root
  data={data}
  width={800}
  height={400}
  xAxis={{ label: "Day" }}
  yAxis={{ label: "Hour" }}
>
  <HeatmapChart.Canvas />
  <HeatmapChart.Grid />
  <HeatmapChart.Axes />
  <HeatmapChart.Tooltip />
</HeatmapChart.Root>`}
      preview={
        <div className="w-full h-[500px]">
          <HeatmapChart.Root
            data={serverActivityData.slice(0, 168)} // One week
            width="100%"
            height={500}
            xAxis={{ label: "Day of Week" }}
            yAxis={{ label: "Hour of Day" }}
            preferWebGPU={true}
          >
            <HeatmapChart.Canvas />
            <HeatmapChart.Grid />
            <HeatmapChart.Axes />
            <HeatmapChart.Tooltip />
          </HeatmapChart.Root>
        </div>
      }
    />
  );
}

function ResponsiveHeatmap() {
  return (
    <ComponentPreview
      title="Responsive Heatmap"
      description="Heatmap with responsive sizing and custom margins"
      code={`import { HeatmapChart } from "@/components/plexusui/charts/heatmap-chart";

<div style={{ width: "100%", height: "500px" }}>
  <HeatmapChart
    data={correlationData}
    width="100%"
    height="100%"
    minWidth={400}
    minHeight={300}
    margin={{ top: 40, right: 40, bottom: 70, left: 80 }}
    showGrid
    showAxes
    showTooltip 
    preferWebGPU={true}
  />
</div>`}
      preview={
        <div className="w-full" style={{ height: "500px" }}>
          <HeatmapChart
            data={correlationData}
            width="100%"
            height="100%"
            minWidth={400}
            minHeight={300}
            xAxis={{ label: "Variables" }}
            yAxis={{ label: "Variables" }}
            margin={{ top: 40, right: 40, bottom: 70, left: 80 }}
            showGrid
            showAxes
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

const heatmapChartProps: ApiProp[] = [
  {
    name: "data",
    type: "DataPoint[]",
    default: "required",
    description:
      "Array of data points. DataPoint: { x: string | number, y: string | number, value: number }",
  },
  {
    name: "xAxis",
    type: "{ label?: string, categories?: string[] }",
    default: "{}",
    description: "X-axis configuration with optional category labels",
  },
  {
    name: "yAxis",
    type: "{ label?: string, categories?: string[] }",
    default: "{}",
    description: "Y-axis configuration with optional category labels",
  },
  {
    name: "colorScale",
    type: "(value: number) => string",
    default: "viridis",
    description: "Color scale function for value visualization",
  },
  {
    name: "minValue",
    type: "number",
    default: "auto",
    description: "Minimum value for color scale",
  },
  {
    name: "maxValue",
    type: "number",
    default: "auto",
    description: "Maximum value for color scale",
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
    name: "margin",
    type: "{ top?: number, right?: number, bottom?: number, left?: number }",
    default: "{ top: 40, right: 40, bottom: 60, left: 80 }",
    description: "Chart margins",
  },
  {
    name: "showGrid",
    type: "boolean",
    default: "false",
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

const heatmapDataPointType: ApiProp[] = [
  {
    name: "x",
    type: "string | number",
    default: "required",
    description: "X-axis category or coordinate",
  },
  {
    name: "y",
    type: "string | number",
    default: "required",
    description: "Y-axis category or coordinate",
  },
  {
    name: "value",
    type: "number",
    default: "required",
    description: "Data value for color mapping",
  },
];

const heatmapChartRootProps: ApiProp[] = [
  {
    name: "data",
    type: "DataPoint[]",
    default: "required",
    description: "Array of data points to plot",
  },
  {
    name: "xAxis",
    type: "{ label?: string, categories?: string[] }",
    default: "{}",
    description: "X-axis configuration",
  },
  {
    name: "yAxis",
    type: "{ label?: string, categories?: string[] }",
    default: "{}",
    description: "Y-axis configuration",
  },
  {
    name: "colorScale",
    type: "(value: number) => string",
    default: "viridis",
    description: "Color scale function",
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
    name: "margin",
    type: "{ top?: number, right?: number, bottom?: number, left?: number }",
    default: "{ top: 40, right: 40, bottom: 60, left: 80 }",
    description: "Chart margins",
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
    description: "Primitive components (Canvas, Axes, Tooltip, Legend)",
  },
];

const heatmapChartPrimitiveProps: ApiProp[] = [
  {
    name: "HeatmapChart.Canvas",
    type: "component",
    default: "-",
    description: "Renders the heatmap cells. Props: showGrid?: boolean",
  },
  {
    name: "HeatmapChart.Axes",
    type: "component",
    default: "-",
    description: "Renders x and y axis with labels",
  },
  {
    name: "HeatmapChart.Tooltip",
    type: "component",
    default: "-",
    description: "Interactive tooltip showing cell values on hover",
  },
  {
    name: "HeatmapChart.Legend",
    type: "component",
    default: "-",
    description: "Color scale legend. Props: title?: string",
  },
];

// ============================================================================
// Main Export
// ============================================================================

export function HeatmapChartExamples() {
  return (
    <div className="space-y-12">
      {/* Examples Section */}
      <div className="space-y-8">
        <RealTimeSystemMonitor />

        <ResponsiveHeatmap />
        <PrimitiveHeatmapChart />
      </div>

      {/* API Reference Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            HeatmapChart component for visualizing matrix data with color-encoded values
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">HeatmapChart (All-in-One)</h3>
          <ApiReferenceTable props={heatmapChartProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">DataPoint Type</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Data structure for heatmap cells
          </p>
          <ApiReferenceTable props={heatmapDataPointType} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">HeatmapChart.Root</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Root component for building custom layouts with primitives
          </p>
          <ApiReferenceTable props={heatmapChartRootProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primitive Components</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use with HeatmapChart.Root for complete control over composition
          </p>
          <ApiReferenceTable props={heatmapChartPrimitiveProps} />
        </div>
      </div>
    </div>
  );
}
