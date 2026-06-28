"use client";

import {
  type BrushSelection,
  ChartBrush,
  ChartClick,
  ChartCrosshair,
  ChartInteractions,
  type ClickEvent,
  type CrosshairPosition,
} from "@plexusui/components/charts/interactions";
import { LineChart } from "@plexusui/components/charts/line-chart";
import { ScatterChart } from "@plexusui/components/charts/scatter-chart";
import { useState } from "react";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Example Data
// ============================================================================

// Generate sample telemetry data
const generateTelemetryData = (points: number) => {
  const data: Array<{ x: number; y: number }> = [];
  let value = 100;

  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * 10;
    value = Math.max(50, Math.min(150, value)); // Clamp between 50-150

    data.push({ x: i, y: value });
  }

  return data;
};

const telemetryData = generateTelemetryData(500);
const scatterData = Array.from({ length: 200 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
}));

// ============================================================================
// Example Components
// ============================================================================

function ClickInteractionExample() {
  const [clickLog, setClickLog] = useState<ClickEvent[]>([]);
  const [doubleClickLog, setDoubleClickLog] = useState<ClickEvent[]>([]);

  const handleClick = (event: ClickEvent) => {
    setClickLog((prev) => [event, ...prev].slice(0, 5)); // Keep last 5 clicks
  };

  const handleDoubleClick = (event: ClickEvent) => {
    setDoubleClickLog((prev) => [event, ...prev].slice(0, 5));
  };

  return (
    <ComponentPreview
      title="Click Interactions"
      description="Click and double-click on the chart to capture data coordinates"
      code={`import { LineChart } from "@/components/plexusui/charts/line-chart";
import { ChartClick } from "@/components/plexusui/charts/interactions";

<LineChart.Root series={[{ name: "Data", data: telemetryData }]}>
  <LineChart.Canvas showGrid />
  <LineChart.Axes />
  <ChartClick
    onClick={(e) => console.log('Clicked at:', e.dataX, e.dataY)}
    onDoubleClick={(e) => console.log('Double-clicked at:', e.dataX, e.dataY)}
    showClickMarker
  />
</LineChart.Root>`}
      preview={
        <div className="w-full space-y-4">
          <div className="w-full h-[400px] relative">
            <LineChart.Root
              series={[{ name: "Telemetry", data: telemetryData, color: "#3b82f6" }]}
              width="100%"
              height={400}
              preferWebGPU
            >
              <LineChart.Canvas showGrid />
              <LineChart.Axes />
              <ChartClick
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                showClickMarker
                markerColor="#10b981"
                markerDuration={800}
              />
            </LineChart.Root>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-2">Single Clicks (last 5):</div>
              <div className="space-y-1 font-mono text-xs">
                {clickLog.length === 0 && (
                  <div className="text-zinc-500">Click on the chart...</div>
                )}
                {clickLog.map((click, idx) => (
                  <div key={idx} className="text-zinc-600 dark:text-zinc-400">
                    X: {click.dataX.toFixed(2)}, Y: {click.dataY.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">Double Clicks (last 5):</div>
              <div className="space-y-1 font-mono text-xs">
                {doubleClickLog.length === 0 && (
                  <div className="text-zinc-500">Double-click on the chart...</div>
                )}
                {doubleClickLog.map((click, idx) => (
                  <div key={idx} className="text-zinc-600 dark:text-zinc-400">
                    X: {click.dataX.toFixed(2)}, Y: {click.dataY.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

function BrushSelectionExample() {
  const [selection, setSelection] = useState<BrushSelection | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<number>(0);

  const handleBrushEnd = (sel: BrushSelection) => {
    setSelection(sel);

    // Count points within selection
    const count = telemetryData.filter(
      (p) => p.x >= sel.xStart && p.x <= sel.xEnd && p.y >= sel.yStart && p.y <= sel.yEnd
    ).length;
    setSelectedPoints(count);
  };

  return (
    <ComponentPreview
      title="Brush Selection"
      description="Click and drag to select a region on the chart"
      code={`import { LineChart } from "@/components/plexusui/charts/line-chart";
import { ChartBrush } from "@/components/plexusui/charts/interactions";

<LineChart.Root series={[{ name: "Data", data: telemetryData }]}>
  <LineChart.Canvas showGrid />
  <LineChart.Axes />
  <ChartBrush
    onBrushEnd={(selection) => {
      console.log('Selected range:', selection);
      // Filter data within selection
      const filtered = data.filter(
        p => p.x >= selection.xStart && p.x <= selection.xEnd
      );
    }}
    brushColor="#3b82f6"
    brushOpacity={0.2}
  />
</LineChart.Root>`}
      preview={
        <div className="w-full space-y-4">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Click and drag on the chart to select a region
          </div>

          <div className="w-full h-[400px] relative">
            <LineChart.Root
              series={[{ name: "Telemetry", data: telemetryData, color: "#8b5cf6" }]}
              width="100%"
              height={400}
              preferWebGPU
            >
              <LineChart.Canvas showGrid />
              <LineChart.Axes />
              <ChartBrush
                onBrushEnd={handleBrushEnd}
                brushColor="#8b5cf6"
                brushOpacity={0.25}
                brushBorderColor="#8b5cf6"
              />
            </LineChart.Root>
          </div>

          {selection && (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
              <div className="font-medium mb-2">Selection:</div>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <div className="text-zinc-500">X Range:</div>
                  <div>
                    {selection.xStart.toFixed(2)} → {selection.xEnd.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Y Range:</div>
                  <div>
                    {selection.yStart.toFixed(2)} → {selection.yEnd.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <span className="text-zinc-500">Points in selection:</span>{" "}
                <span className="font-medium">{selectedPoints}</span>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

function CrosshairExample() {
  const [position, setPosition] = useState<CrosshairPosition | null>(null);

  return (
    <ComponentPreview
      title="Crosshair with Labels"
      description="Move your mouse over the chart to see live crosshair with value labels"
      code={`import { LineChart } from "@/components/plexusui/charts/line-chart";
import { ChartCrosshair } from "@/components/plexusui/charts/interactions";

<LineChart.Root series={[{ name: "Data", data: telemetryData }]}>
  <LineChart.Canvas showGrid />
  <LineChart.Axes />
  <ChartCrosshair
    showHorizontal
    showVertical
    showLabels
    lineColor="#ef4444"
    lineStyle="dashed"
    onMove={(pos) => console.log('Crosshair at:', pos.dataX, pos.dataY)}
  />
</LineChart.Root>`}
      preview={
        <div className="w-full space-y-4">
          <div className="w-full h-[400px] relative">
            <LineChart.Root
              series={[{ name: "Telemetry", data: telemetryData, color: "#ef4444" }]}
              width="100%"
              height={400}
              xAxis={{ label: "Sample Index" }}
              yAxis={{ label: "Value" }}
              preferWebGPU
            >
              <LineChart.Canvas showGrid />
              <LineChart.Axes />
              <ChartCrosshair
                showHorizontal
                showVertical
                showLabels
                lineColor="#666"
                lineStyle="dashed"
                lineWidth={1}
                labelBgColor="#000"
                labelTextColor="#fff"
                onMove={setPosition}
              />
            </LineChart.Root>
          </div>

          {position && (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
              <div className="font-medium mb-2">Current Position:</div>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <div className="text-zinc-500">Data X:</div>
                  <div>{position.dataX.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Data Y:</div>
                  <div>{position.dataY.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

function CombinedInteractionsExample() {
  const [mode, setMode] = useState<"click" | "brush" | "crosshair">("crosshair");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((prev) => [message, ...prev].slice(0, 10));
  };

  return (
    <ComponentPreview
      title="Combined Interactions (Mode Switcher)"
      description="Switch between click, brush, and crosshair modes"
      code={`import { LineChart } from "@/components/plexusui/charts/line-chart";
import { ChartInteractions } from "@/components/plexusui/charts/interactions";

const [mode, setMode] = useState('crosshair');

<LineChart.Root series={[{ name: "Data", data: scatterData }]}>
  <LineChart.Canvas showGrid />
  <LineChart.Axes />
  <ChartInteractions
    enableClick={mode === 'click'}
    onClick={(e) => console.log('Clicked:', e.dataX, e.dataY)}
    enableBrush={mode === 'brush'}
    onBrushEnd={(sel) => console.log('Selected:', sel)}
    enableCrosshair={mode === 'crosshair'}
    showLabels
  />
</LineChart.Root>`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("crosshair")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                mode === "crosshair"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              Crosshair Mode
            </button>
            <button
              type="button"
              onClick={() => setMode("click")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                mode === "click"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              Click Mode
            </button>
            <button
              type="button"
              onClick={() => setMode("brush")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                mode === "brush"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              Brush Mode
            </button>
          </div>

          <div className="w-full h-[400px] relative">
            <ScatterChart.Root
              series={[{ name: "Data Points", data: scatterData, color: "#10b981" }]}
              width="100%"
              height={400}
              xAxis={{ label: "X Coordinate" }}
              yAxis={{ label: "Y Coordinate" }}
              preferWebGPU
            >
              <ScatterChart.Canvas showGrid />
              <ScatterChart.Axes />
              <ChartInteractions
                enableClick={mode === "click"}
                onClick={(e) => addLog(`Clicked: X=${e.dataX.toFixed(2)}, Y=${e.dataY.toFixed(2)}`)}
                showClickMarker={mode === "click"}
                enableBrush={mode === "brush"}
                onBrushEnd={(sel) =>
                  addLog(`Brushed: X=[${sel.xStart.toFixed(2)}, ${sel.xEnd.toFixed(2)}]`)
                }
                enableCrosshair={mode === "crosshair"}
                showLabels={mode === "crosshair"}
              />
            </ScatterChart.Root>
          </div>

          <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <div className="font-medium mb-2">Event Log (last 10):</div>
            <div className="space-y-1 font-mono text-xs max-h-32 overflow-y-auto">
              {log.length === 0 && (
                <div className="text-zinc-500">
                  {mode === "click" && "Click on points..."}
                  {mode === "brush" && "Drag to select a region..."}
                  {mode === "crosshair" && "Move mouse over chart..."}
                </div>
              )}
              {log.map((entry, idx) => (
                <div key={idx} className="text-zinc-600 dark:text-zinc-400">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}

// ============================================================================
// Main Export
// ============================================================================

export function ChartInteractionsExamples() {
  return (
    <div className="space-y-8">
      <CrosshairExample />
      <ClickInteractionExample />
      <BrushSelectionExample />
      <CombinedInteractionsExample />
    </div>
  );
}
