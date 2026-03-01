"use client";

import { ChartRegion, LineChart } from "@plexusui/components/charts";
import * as React from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";

/**
 * Generate sample telemetry data
 */
function generateTelemetryData(points: number) {
  const data: Array<{ x: number; y: number }> = [];
  let value = 100;

  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * 10;
    value = Math.max(60, Math.min(140, value));
    data.push({ x: i, y: value });
  }

  return data;
}

function BasicExample() {
  const data = React.useMemo(() => generateTelemetryData(100), []);

  return (
    <ComponentPreview
      title="Basic Region Marking"
      description="Mark time ranges or segments with shaded vertical regions."
      code={`import { LineChart, ChartRegion } from "@plexusui/components/charts";

<LineChart.Root series={[{ name: "Data", data }]}>
  <LineChart.Canvas />
  <LineChart.Axes />

  <ChartRegion
    startX={20}
    endX={40}
    label="Phase 1"
    color="#3b82f6"
  />
  <ChartRegion
    startX={60}
    endX={80}
    label="Phase 2"
    color="#10b981"
  />
</LineChart.Root>`}
      preview={
        <div className="w-full">
          <LineChart.Root
            series={[{ name: "Telemetry", data, color: "#6366f1" }]}
            width="100%"
            height={400}
            xAxis={{ label: "Time (s)" }}
            yAxis={{ label: "Value" }}
          >
            <LineChart.Canvas />
            <LineChart.Axes />

            <ChartRegion startX={20} endX={40} label="Phase 1" color="#3b82f6" opacity={0.15} />
            <ChartRegion startX={60} endX={80} label="Phase 2" color="#10b981" opacity={0.15} />
          </LineChart.Root>
        </div>
      }
    />
  );
}

function FlightPhasesExample() {
  const data = React.useMemo(() => generateTelemetryData(120), []);

  return (
    <ComponentPreview
      title="Flight Phases"
      description="Mark different operational phases during flight."
      code={`// Mark flight phases
<ChartRegion
  startX={0}
  endX={15}
  label="Pre-Flight"
  color="#6366f1"
  opacity={0.1}
/>
<ChartRegion
  startX={15}
  endX={45}
  label="Takeoff & Climb"
  color="#10b981"
  opacity={0.1}
/>
<ChartRegion
  startX={45}
  endX={90}
  label="Cruise"
  color="#3b82f6"
  opacity={0.1}
/>
<ChartRegion
  startX={90}
  endX={110}
  label="Descent"
  color="#f59e0b"
  opacity={0.1}
/>
<ChartRegion
  startX={110}
  endX={120}
  label="Landing"
  color="#ef4444"
  opacity={0.1}
/>`}
      preview={
        <div className="w-full">
          <LineChart.Root
            series={[{ name: "Altitude", data, color: "#6366f1" }]}
            width="100%"
            height={400}
            xAxis={{ label: "Time (s)" }}
            yAxis={{ label: "Altitude (ft)" }}
          >
            <LineChart.Canvas />
            <LineChart.Axes />

            <ChartRegion startX={0} endX={15} label="Pre-Flight" color="#6366f1" opacity={0.1} />
            <ChartRegion
              startX={15}
              endX={45}
              label="Takeoff & Climb"
              color="#10b981"
              opacity={0.1}
            />
            <ChartRegion startX={45} endX={90} label="Cruise" color="#3b82f6" opacity={0.1} />
            <ChartRegion startX={90} endX={110} label="Descent" color="#f59e0b" opacity={0.1} />
            <ChartRegion startX={110} endX={120} label="Landing" color="#ef4444" opacity={0.1} />
          </LineChart.Root>
        </div>
      }
    />
  );
}

function CustomOpacityExample() {
  const data = React.useMemo(() => generateTelemetryData(100), []);

  return (
    <ComponentPreview
      title="Custom Opacity"
      description="Control region visibility with opacity settings."
      code={`// Lighter regions
<ChartRegion opacity={0.05} />

// More prominent regions
<ChartRegion opacity={0.2} />`}
      preview={
        <div className="w-full">
          <LineChart.Root
            series={[{ name: "Data", data, color: "#8b5cf6" }]}
            width="100%"
            height={400}
            xAxis={{ label: "Time (s)" }}
            yAxis={{ label: "Value" }}
          >
            <LineChart.Canvas />
            <LineChart.Axes />

            <ChartRegion startX={10} endX={30} label="Light (5%)" color="#3b82f6" opacity={0.05} />
            <ChartRegion
              startX={40}
              endX={60}
              label="Medium (15%)"
              color="#10b981"
              opacity={0.15}
            />
            <ChartRegion startX={70} endX={90} label="Heavy (25%)" color="#ef4444" opacity={0.25} />
          </LineChart.Root>
        </div>
      }
    />
  );
}

// API Reference
const regionProps: ApiProp[] = [
  {
    name: "startX",
    type: "number",
    default: "required",
    description: "Start X coordinate in data space",
  },
  {
    name: "endX",
    type: "number",
    default: "required",
    description: "End X coordinate in data space",
  },
  {
    name: "label",
    type: "string",
    default: "undefined",
    description: "Label text displayed in the region",
  },
  {
    name: "color",
    type: "string",
    default: '"#3b82f6"',
    description: "Region and label background color",
  },
  {
    name: "opacity",
    type: "number",
    default: "0.1",
    description: "Region opacity (0-1)",
  },
  {
    name: "showLabel",
    type: "boolean",
    default: "true",
    description: "Show or hide the label",
  },
];

export function ChartRegionExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Chart Region</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          Mark time ranges or segments with shaded vertical regions. Perfect for highlighting
          phases, modes, or time windows.
        </p>
      </div>

      <div className="space-y-8">
        <BasicExample />
        <FlightPhasesExample />
        <CustomOpacityExample />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Declarative component for marking data ranges. Uses data coordinates so regions stay
            locked during streaming.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ChartRegion Props</h3>
          <ApiReferenceTable props={regionProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Use Cases</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">Flight Phases</div>
              <div className="text-sm text-zinc-400">
                Mark takeoff, cruise, descent, landing phases
              </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">Operating Modes</div>
              <div className="text-sm text-zinc-400">
                Highlight different system operational states
              </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">Time Windows</div>
              <div className="text-sm text-zinc-400">Mark specific time periods of interest</div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">Anomaly Ranges</div>
              <div className="text-sm text-zinc-400">
                Highlight periods where anomalies occurred
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
