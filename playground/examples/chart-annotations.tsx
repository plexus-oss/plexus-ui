"use client";

import { type Annotation, ChartAnnotations, LineChart } from "@plexusui/components/charts";
import * as React from "react";
import { useState } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { useColorScheme } from "@/components/color-scheme-provider";
import { ComponentPreview } from "@/components/component-preview";

/**
 * Generate sample telemetry data
 */
function generateTelemetryData(points: number) {
  const data: Array<{ x: number; y: number }> = [];
  let value = 100;

  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * 10;
    value = Math.max(60, Math.min(140, value)); // Clamp between 60-140
    data.push({ x: i, y: value });
  }

  return data;
}

function BasicExample() {
  const { color } = useColorScheme();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [enabled, setEnabled] = useState(true);

  // Use useMemo to ensure data doesn't regenerate on every render
  const data = React.useMemo(() => generateTelemetryData(100), []);

  return (
    <ComponentPreview
      title="Text Annotations"
      description="Click anywhere on the chart to add labels. Click to edit, drag to reposition, hover to delete."
      code={`import { LineChart, ChartAnnotations, type Annotation } from "@plexusui/components/charts";

const [annotations, setAnnotations] = useState<Annotation[]>([]);

<LineChart.Root series={[{ name: "Temperature", data, color: "#3b82f6" }]}>
  <LineChart.Canvas />
  <LineChart.Axes />
  <ChartAnnotations
    annotations={annotations}
    onChange={setAnnotations}
    enabled={true}
  />
</LineChart.Root>`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 rounded-lg">
            <div className="text-xs text-zinc-400">
              {enabled
                ? "Annotation mode enabled - Click to add labels"
                : "Annotation mode disabled"}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`px-3 py-1 text-xs rounded ${
                  enabled ? `bg-[${color}] text-white` : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {enabled ? "Disable" : "Enable"}
              </button>
              {annotations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAnnotations([])}
                  className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                >
                  Clear All ({annotations.length})
                </button>
              )}
            </div>
          </div>

          <LineChart.Root
            series={[{ name: "Temperature", data, color: color }]}
            width="100%"
            height={400}
            xAxis={{ label: "Time (s)" }}
            yAxis={{ label: "Temperature (°C)" }}
          >
            <LineChart.Canvas />
            <LineChart.Axes />
            <ChartAnnotations
              annotations={annotations}
              onChange={setAnnotations}
              enabled={enabled}
              color={"#18181b"}
            />
          </LineChart.Root>
        </div>
      }
    />
  );
}

function StreamingDataExample() {
  const { color } = useColorScheme();
  const [data, setData] = useState(() => generateTelemetryData(50));
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  React.useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setData((prev) => {
        const lastX = prev[prev.length - 1]?.x || 0;
        const lastY = prev[prev.length - 1]?.y || 100;

        // Add new point
        const newY = lastY + (Math.random() - 0.5) * 10;
        const clampedY = Math.max(60, Math.min(140, newY));

        return [...prev, { x: lastX + 1, y: clampedY }].slice(-100); // Keep last 100 points
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <ComponentPreview
      title="Streaming Data"
      description="Annotations stay locked to their data coordinates even as data streams in and the domain updates."
      code={`// Annotations use data coordinates, not screen pixels
const [data, setData] = useState(initialData);
const [annotations, setAnnotations] = useState<Annotation[]>([]);

// Stream new data - annotations stay in place
useEffect(() => {
  const interval = setInterval(() => {
    setData(prev => [...prev, newPoint]);
  }, 100);
  return () => clearInterval(interval);
}, []);`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 rounded-lg">
            <div className="text-xs text-zinc-400">
              {isStreaming ? (
                <span className="text-green-400">● Streaming live data</span>
              ) : (
                <span>Paused - Click to add annotations</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsStreaming(!isStreaming)}
                className={`cursor-pointer px-3 py-1 text-xs rounded ${
                  isStreaming ? `bg-[${color}] text-white` : `bg-zinc-800 text-zinc-400`
                }`}
              >
                {isStreaming ? "Pause" : "Start Stream"}
              </button>
              {annotations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAnnotations([])}
                  className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400"
                >
                  Clear ({annotations.length})
                </button>
              )}
            </div>
          </div>

          <LineChart.Root
            series={[{ name: "Live Data", data, color: color }]}
            width="100%"
            height={400}
            xAxis={{ label: "Time (s)" }}
            yAxis={{ label: "Value" }}
          >
            <LineChart.Canvas />
            <LineChart.Axes />
            <ChartAnnotations
              annotations={annotations}
              onChange={setAnnotations}
              enabled={!isStreaming}
              color="#18181b"
            />
          </LineChart.Root>

          <div className="bg-zinc-900 p-3 rounded text-xs text-zinc-400">
            💡 Pause the stream, add annotations, then resume - annotations stay locked to their
            data points
          </div>
        </div>
      }
    />
  );
}

// API Reference Data
const annotationProps: ApiProp[] = [
  {
    name: "annotations",
    type: "Annotation[]",
    default: "required",
    description: "Array of annotation objects with id, dataX, dataY, and text",
  },
  {
    name: "onChange",
    type: "(annotations: Annotation[]) => void",
    default: "required",
    description: "Callback when annotations are added, edited, deleted, or repositioned",
  },
  {
    name: "enabled",
    type: "boolean",
    default: "true",
    description: "Enable click-to-add annotation mode",
  },
  {
    name: "color",
    type: "string",
    default: '"#6366f1"',
    description: "Color for annotation labels and markers",
  },
];

export function ChartAnnotationsExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Chart Annotations</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          Minimal text annotation system for labeling data. Clean, fast, stays out of the way.
        </p>
      </div>

      <div className="space-y-8">
        <BasicExample />
        <StreamingDataExample />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Single component for all annotation needs. Click to add, inline editing, minimal UI.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ChartAnnotations</h3>
          <ApiReferenceTable props={annotationProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Annotation Type</h3>
          <div className="bg-zinc-900 p-4 rounded-lg font-mono text-sm text-zinc-300">
            <pre>{`interface Annotation {
  id: string;
  dataX: number;      // X coordinate in data space
  dataY: number;      // Y coordinate in data space
  text: string;       // Label text
  screenX?: number;   // Optional: adjusted screen position
  screenY?: number;   // Optional: adjusted screen position
}`}</pre>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Features</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">✓ Click to Add</div>
              <div className="text-sm text-zinc-400">
                Click anywhere on the chart to place a new annotation
              </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">✓ Inline Editing</div>
              <div className="text-sm text-zinc-400">
                Type immediately after placing, click to edit later
              </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">✓ Compact Design</div>
              <div className="text-sm text-zinc-400">
                Small dot markers with minimal labels - doesn't obscure data
              </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">✓ Keyboard Shortcuts</div>
              <div className="text-sm text-zinc-400">
                Enter to save, Escape to cancel, hover to delete
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
