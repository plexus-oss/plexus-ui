"use client";

import { ChartRuler, LineChart, type Measurement } from "@plexusui/components/charts";
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
    value = Math.max(60, Math.min(140, value));
    data.push({ x: i, y: value });
  }

  return data;
}

function BasicExample() {
  const { color } = useColorScheme();
  const data = React.useMemo(() => generateTelemetryData(100), []);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [rulerEnabled, setRulerEnabled] = useState(false);

  return (
    <ComponentPreview
      title="Basic Measurement"
      description="Click and drag to measure distances between points. Shows ΔX, ΔY, and Euclidean distance."
      code={`import { LineChart, ChartRuler, type Measurement } from "@plexusui/components/charts";

const [measurements, setMeasurements] = useState<Measurement[]>([]);
const [enabled, setEnabled] = useState(true);

<LineChart.Root series={[{ name: "Data", data }]}>
  <LineChart.Canvas />
  <LineChart.Axes />

  <ChartRuler
    enabled={enabled}
    onMeasure={(m) => {
      console.log(\`ΔX: \${m.deltaX}, ΔY: \${m.deltaY}\`);
      setMeasurements(prev => [...prev, m]);
    }}
  />
</LineChart.Root>`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 rounded-lg">
            <div className="text-xs text-zinc-400">
              {rulerEnabled ? (
                <span>Ruler mode - Click and drag to measure</span>
              ) : (
                <span>Ruler disabled</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRulerEnabled(!rulerEnabled)}
                className={`px-3 py-1 text-xs rounded ${
                  rulerEnabled ? `bg-[${color}] text-white` : `bg-zinc-800 text-zinc-400`
                }`}
              >
                {rulerEnabled ? "Disable Ruler" : "Enable Ruler"}
              </button>
              {measurements.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMeasurements([])}
                  className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400"
                >
                  Clear ({measurements.length})
                </button>
              )}
            </div>
          </div>

          <LineChart.Root
            series={[{ name: "Signal", data, color: color }]}
            width="100%"
            height={400}
            xAxis={{ label: "Time (s)" }}
            yAxis={{ label: "Value" }}
          >
            <LineChart.Canvas />
            <LineChart.Axes />

            <ChartRuler
              enabled={rulerEnabled}
              measurements={measurements}
              onMeasure={(m) => {
                setMeasurements((prev) => [...prev, m]);
              }}
              color={color}
            />
          </LineChart.Root>

          {measurements.length > 0 && (
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="text-xs font-semibold mb-2 text-zinc-300">Recent Measurements:</div>
              <div className="space-y-1 text-xs font-mono text-zinc-400">
                {measurements.slice(-3).map((m, i) => (
                  <div key={i}>
                    {`#${measurements.length - 2 + i}: ΔX=${m.deltaX.toFixed(
                      2
                    )}, ΔY=${m.deltaY.toFixed(2)}, Distance=${m.distance.toFixed(2)}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

function RateOfChangeExample() {
  const data = React.useMemo(() => generateTelemetryData(100), []);
  const [lastMeasurement, setLastMeasurement] = useState<Measurement | null>(null);

  return (
    <ComponentPreview
      title="Rate of Change Calculation"
      description="Use ruler measurements to calculate rates like velocity, acceleration, or slope."
      code={`// Calculate rate from measurement
const [measurement, setMeasurement] = useState<Measurement | null>(null);

<ChartRuler
  onMeasure={(m) => {
    const rate = m.deltaY / m.deltaX;
    console.log(\`Rate: \${rate.toFixed(2)} units/s\`);
    setMeasurement(m);
  }}
/>`}
      preview={
        <div className="w-full space-y-4">
          <div className="bg-zinc-900 px-4 py-2 rounded-lg text-xs text-zinc-400">
            Click and drag to calculate the rate of change (slope)
          </div>

          <LineChart.Root
            series={[{ name: "Position", data, color: "#10b981" }]}
            width="100%"
            height={400}
            xAxis={{ label: "Time (s)" }}
            yAxis={{ label: "Position" }}
          >
            <LineChart.Canvas />
            <LineChart.Axes />

            <ChartRuler
              enabled={true}
              measurements={lastMeasurement ? [lastMeasurement] : []}
              onMeasure={(m) => {
                setLastMeasurement(m);
              }}
              color="#10b981"
            />
          </LineChart.Root>

          {lastMeasurement && (
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="text-xs font-semibold mb-2 text-zinc-300">Calculated Metrics:</div>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="text-zinc-500">Time Difference (ΔX)</div>
                  <div className="text-zinc-200">{lastMeasurement.deltaX.toFixed(2)} s</div>
                </div>
                <div>
                  <div className="text-zinc-500">Position Change (ΔY)</div>
                  <div className="text-zinc-200">{lastMeasurement.deltaY.toFixed(2)} units</div>
                </div>
                <div>
                  <div className="text-zinc-500">Rate of Change</div>
                  <div className="text-zinc-200">
                    {(lastMeasurement.deltaY / lastMeasurement.deltaX).toFixed(2)} units/s
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Euclidean Distance</div>
                  <div className="text-zinc-200">{lastMeasurement.distance.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

function MultiMeasurementExample() {
  const data = React.useMemo(() => generateTelemetryData(100), []);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  return (
    <ComponentPreview
      title="Multiple Measurements"
      description="Collect and compare multiple measurements for detailed analysis."
      code={`// Store all measurements
const [measurements, setMeasurements] = useState<Measurement[]>([]);

<ChartRuler
  onMeasure={(m) => {
    setMeasurements(prev => [...prev, m]);
  }}
/>

// Export for analysis
const exportData = () => {
  const csv = measurements.map(m =>
    \`\${m.deltaX},\${m.deltaY},\${m.distance}\`
  ).join('\\n');
  downloadCSV(csv);
};`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 rounded-lg">
            <div className="text-xs text-zinc-400">
              {measurements.length} measurement
              {measurements.length !== 1 ? "s" : ""} recorded
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const csv =
                    "deltaX,deltaY,distance\n" +
                    measurements.map((m) => `${m.deltaX},${m.deltaY},${m.distance}`).join("\n");
                  console.log("CSV Export:", csv);
                  alert("Exported to console");
                }}
                className="px-3 py-1 text-xs rounded bg-blue-600 text-white"
                disabled={measurements.length === 0}
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setMeasurements([])}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400"
                disabled={measurements.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>

          <LineChart.Root
            series={[{ name: "Data", data, color: "#3b82f6" }]}
            width="100%"
            height={400}
            xAxis={{ label: "Time (s)" }}
            yAxis={{ label: "Value" }}
          >
            <LineChart.Canvas />
            <LineChart.Axes />

            <ChartRuler
              enabled={true}
              measurements={measurements}
              onMeasure={(m) => {
                setMeasurements((prev) => [...prev, m]);
              }}
              color="#3b82f6"
            />
          </LineChart.Root>

          {measurements.length > 0 && (
            <div className="bg-zinc-900 p-4 rounded-lg max-h-48 overflow-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2">#</th>
                    <th className="text-right py-2">ΔX</th>
                    <th className="text-right py-2">ΔY</th>
                    <th className="text-right py-2">Distance</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {measurements.map((m, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      <td className="py-2">{i + 1}</td>
                      <td className="text-right">{m.deltaX.toFixed(2)}</td>
                      <td className="text-right">{m.deltaY.toFixed(2)}</td>
                      <td className="text-right">{m.distance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      }
    />
  );
}

// API Reference
const rulerProps: ApiProp[] = [
  {
    name: "onMeasure",
    type: "(measurement: Measurement) => void",
    default: "undefined",
    description: "Callback when measurement is complete (mouse up)",
  },
  {
    name: "color",
    type: "string",
    default: '"#f59e0b"',
    description: "Color for measurement line and markers",
  },
  {
    name: "enabled",
    type: "boolean",
    default: "true",
    description: "Enable or disable ruler mode",
  },
];

const measurementType = `interface Measurement {
  startX: number;    // Start point X in data coords
  startY: number;    // Start point Y in data coords
  endX: number;      // End point X in data coords
  endY: number;      // End point Y in data coords
  deltaX: number;    // X difference (endX - startX)
  deltaY: number;    // Y difference (endY - startY)
  distance: number;  // Euclidean distance
}`;

export function ChartRulerExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Chart Ruler</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          Interactive measurement tool for calculating distances and deltas between points. Perfect
          for analyzing rates of change and time differences.
        </p>
      </div>

      <div className="space-y-8">
        <BasicExample />
        <RateOfChangeExample />
        <MultiMeasurementExample />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Interactive component for measuring distances. Click and drag to measure, release to
            capture.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ChartRuler Props</h3>
          <ApiReferenceTable props={rulerProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Measurement Type</h3>
          <div className="bg-zinc-900 p-4 rounded-lg font-mono text-sm text-zinc-300">
            <pre>{measurementType}</pre>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Use Cases</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">Time Differences</div>
              <div className="text-sm text-zinc-400">Calculate time between events or phases</div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">Amplitude Changes</div>
              <div className="text-sm text-zinc-400">
                Measure signal amplitude or value differences
              </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">Rate of Change</div>
              <div className="text-sm text-zinc-400">
                Calculate velocity, acceleration, or slope
              </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="font-semibold mb-2">Data Analysis</div>
              <div className="text-sm text-zinc-400">
                Collect measurements for detailed analysis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
