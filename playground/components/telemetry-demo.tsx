"use client";

import {
  type Annotation,
  ChartAnnotations,
  ChartRuler,
  type Measurement,
} from "@plexusui/components/charts/annotations";
import { AreaChart } from "@plexusui/components/charts/area-chart";
import { BarChart } from "@plexusui/components/charts/bar-chart";
import { GanttChart, type Task } from "@plexusui/components/charts/gantt";
import { HistogramChart } from "@plexusui/components/charts/histogram-chart";
import { LineChart } from "@plexusui/components/charts/line-chart";
import { ScatterChart } from "@plexusui/components/charts/scatter-chart";
import { downsampleLTTB } from "@plexusui/components/lib/data-utils";
import { Activity, Gauge, Pencil, Radio, Zap } from "lucide-react";
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "@/components/color-scheme-provider";
import { Card } from "@/components/ui/card";
import { Button } from "./ui/button";

// Lazy load heavy 3D component
const PointCloudViewer = lazy(() =>
  import("@plexusui/components/charts/point-cloud-viewer").then((m) => ({
    default: m.PointCloudViewer,
  }))
);

// Performance tuning
const MAX_HISTORY_POINTS = 200;
const DOWNSAMPLE_TARGET = 100;
const UPDATE_INTERVAL = 50; // 20Hz data updates

interface SensorState {
  velocity: number;
  acceleration: number;
  temperature: number;
  signal: number;
  altitude: number;
  power: number;
}

export function TelemetryDemo() {
  const { color } = useColorScheme();

  const [isStreaming, setIsStreaming] = useState(true);
  const [fps, setFps] = useState(0);
  const [dataPoints, setDataPoints] = useState(0);

  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [annotationMode, setAnnotationMode] = useState(false);

  // Sensor state
  const [sensor, setSensor] = useState<SensorState>({
    velocity: 0,
    acceleration: 1.0,
    temperature: 25,
    signal: 95,
    altitude: 1000,
    power: 85,
  });

  // Mission tasks for Gantt chart - use state to avoid hydration mismatch
  const [missionTasks, setMissionTasks] = useState<Task[]>([]);

  // Initialize mission tasks on client only to avoid hydration issues
  useEffect(() => {
    const now = new Date();
    setMissionTasks([
      {
        id: "1",
        name: "Pre-flight Check",
        start: new Date(now.getTime() - 60 * 60000),
        end: new Date(now.getTime() - 30 * 60000),
        status: "completed" as const,
        color: color,
        description: "Systems verification",
      },
      {
        id: "2",
        name: "Takeoff Sequence",
        start: new Date(now.getTime() - 30 * 60000),
        end: new Date(now.getTime() - 15 * 60000),
        status: "completed" as const,
        color: color,
        description: "Launch procedures",
      },
      {
        id: "3",
        name: "Waypoint Nav",
        start: new Date(now.getTime() - 15 * 60000),
        end: new Date(now.getTime() + 30 * 60000),
        status: "in-progress" as const,
        color: color,
        description: "Route Alpha-7",
      },
      {
        id: "4",
        name: "Data Downlink",
        start: new Date(now.getTime() + 10 * 60000),
        end: new Date(now.getTime() + 25 * 60000),
        status: "planned" as const,
        color: color,
        description: "Telemetry burst",
      },
      {
        id: "5",
        name: "Return to Base",
        start: new Date(now.getTime() + 30 * 60000),
        end: new Date(now.getTime() + 60 * 60000),
        status: "planned" as const,
        color: color,
        description: "RTB sequence",
      },
    ]);
  }, [color]);

  // LiDAR terrain scan data
  const lidarData = useMemo(() => {
    const gridSize = 50;
    const positions: number[] = [];
    const intensities: number[] = [];

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const xPos = (x - gridSize / 2) * 0.5;
        const zPos = (z - gridSize / 2) * 0.5;
        // Simulate terrain with hills and valleys
        const height =
          Math.sin(xPos * 0.3) * 2 +
          Math.cos(zPos * 0.4) * 1.5 +
          Math.sin(xPos * 0.1 + zPos * 0.1) * 3 +
          (Math.random() - 0.5) * 0.3;
        positions.push(xPos, height, zPos);
        // Intensity based on height + some noise
        intensities.push(Math.min(1, Math.max(0, (height + 5) / 10 + (Math.random() - 0.5) * 0.1)));
      }
    }

    return {
      positions: new Float32Array(positions),
      intensities: new Float32Array(intensities),
    };
  }, []);

  // Historical data
  const [velocityHistory, setVelocityHistory] = useState<Array<{ x: number; y: number }>>([]);
  const [accelHistory, setAccelHistory] = useState<Array<{ x: number; y: number }>>([]);
  const [signalHistory, setSignalHistory] = useState<Array<{ x: number; y: number }>>([]);

  // Performance tracking
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());
  const timeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate realistic sensor data
  const generateData = useCallback((): SensorState => {
    const t = timeRef.current;

    // Velocity: cruising with variations (0-25 m/s)
    const velocity =
      12 + Math.sin(t / 3000) * 5 + Math.sin(t / 1000) * 3 + (Math.random() - 0.5) * 1;

    // Acceleration: centered around 1G with variations
    const acceleration =
      1.0 + Math.sin(t / 800) * 0.3 + Math.cos(t / 400) * 0.15 + (Math.random() - 0.5) * 0.1;

    // Temperature: slowly drifting
    const temperature = 25 + Math.sin(t / 10000) * 3 + (Math.random() - 0.5) * 0.5;

    // Signal strength: mostly stable with occasional dips
    const signalBase = 95 + Math.sin(t / 5000) * 3;
    const signalDrop = Math.random() > 0.98 ? -15 : 0;
    const signal = Math.max(60, Math.min(100, signalBase + signalDrop + (Math.random() - 0.5) * 2));

    // Altitude: slowly varying around 1000m
    const altitude =
      1000 + Math.sin(t / 4000) * 50 + Math.cos(t / 1500) * 20 + (Math.random() - 0.5) * 5;

    // Power: battery level with slow drain
    const power = Math.max(20, 85 - (t / 100000) * 10 + Math.sin(t / 2000) * 2);

    timeRef.current += UPDATE_INTERVAL;

    return { velocity, acceleration, temperature, signal, altitude, power };
  }, []);

  // Update historical data
  const updateHistory = useCallback((data: SensorState, timestamp: number) => {
    setVelocityHistory((prev) => {
      const updated = [...prev, { x: timestamp, y: data.velocity }];
      return updated.slice(-MAX_HISTORY_POINTS);
    });

    setAccelHistory((prev) => {
      const updated = [...prev, { x: timestamp, y: data.acceleration }];
      return updated.slice(-MAX_HISTORY_POINTS);
    });

    setSignalHistory((prev) => {
      const updated = [...prev, { x: timestamp, y: data.signal }];
      return updated.slice(-MAX_HISTORY_POINTS);
    });
  }, []);

  // Main data loop
  useEffect(() => {
    if (!isStreaming) return;

    intervalRef.current = setInterval(() => {
      const data = generateData();
      setSensor(data);
      updateHistory(data, timeRef.current);

      // Update frame counter
      frameCountRef.current++;

      // Calculate FPS every second
      const now = Date.now();
      if (now - lastFpsUpdateRef.current >= 1000) {
        setFps(frameCountRef.current);
        setDataPoints((prev) => prev + frameCountRef.current * 6); // 6 data series
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
    }, UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isStreaming, generateData, updateHistory]);

  // Downsample for rendering performance
  const downsampledVelocity = useMemo(
    () =>
      velocityHistory.length > DOWNSAMPLE_TARGET
        ? downsampleLTTB(velocityHistory, DOWNSAMPLE_TARGET)
        : velocityHistory,
    [velocityHistory]
  );

  const downsampledAccel = useMemo(
    () =>
      accelHistory.length > DOWNSAMPLE_TARGET
        ? downsampleLTTB(accelHistory, DOWNSAMPLE_TARGET)
        : accelHistory,
    [accelHistory]
  );

  const downsampledSignal = useMemo(
    () =>
      signalHistory.length > DOWNSAMPLE_TARGET
        ? downsampleLTTB(signalHistory, DOWNSAMPLE_TARGET)
        : signalHistory,
    [signalHistory]
  );

  // Memoized chart series (using actual timestamps)
  const velocitySeries = useMemo(
    () => [
      {
        name: "Velocity",
        data: downsampledVelocity,
        color: color,
        strokeWidth: 2,
      },
    ],
    [downsampledVelocity, color]
  );

  const accelSeries = useMemo(
    () => [
      {
        name: "Acceleration",
        data: downsampledAccel,
        color: color,
        strokeWidth: 2,
      },
    ],
    [downsampledAccel, color]
  );

  const _signalSeries = useMemo(
    () => [
      {
        name: "Signal",
        data: downsampledSignal,
        color: color,
        strokeWidth: 2,
      },
    ],
    [downsampledSignal, color]
  );

  // Scatter chart data - velocity vs acceleration correlation
  const scatterData = useMemo(() => {
    if (velocityHistory.length < 2 || accelHistory.length < 2) return [];
    const minLength = Math.min(velocityHistory.length, accelHistory.length, 50);
    return velocityHistory.slice(-minLength).map((v, i) => ({
      x: v.y,
      y: accelHistory[accelHistory.length - minLength + i]?.y ?? 1,
    }));
  }, [velocityHistory, accelHistory]);

  const scatterSeries = useMemo(
    () => [{ name: "V vs G", data: scatterData, color: color, size: 6 }],
    [scatterData, color]
  );

  // Bar chart data - system health metrics
  const systemHealthData = useMemo(
    () => [
      {
        name: "System Health",
        data: [
          { x: "Signal", y: sensor.signal },
          { x: "Power", y: sensor.power },
          { x: "Temp", y: Math.min(100, (sensor.temperature / 40) * 100) },
        ],
        color: color,
      },
    ],
    [sensor.signal, sensor.power, sensor.temperature, color]
  );

  // Memoized axis configs
  const velocityYAxis = useMemo(() => ({ label: "m/s", domain: [0, 25] as [number, number] }), []);
  const accelYAxis = useMemo(() => ({ label: "G", domain: [0, 2] as [number, number] }), []);
  const _signalYAxis = useMemo(() => ({ label: "%", domain: [50, 100] as [number, number] }), []);
  // Dynamic x-axis based on actual time data
  const xAxis = useMemo(() => {
    if (velocityHistory.length === 0) {
      return { domain: [0, 1] as [number, number], label: "Time (s)" };
    }
    const minTime = velocityHistory[0].x;
    const maxTime = velocityHistory[velocityHistory.length - 1].x;
    return {
      domain: [minTime, maxTime] as [number, number],
      label: "Time (s)",
      formatter: (val: number) => `${(val / 1000).toFixed(1)}s`,
    };
  }, [velocityHistory]);

  return (
    <div className="space-y-4">
      {/* Performance Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isStreaming ? "bg-green-500 animate-pulse" : "bg-zinc-500"
                }`}
              />
              <span className="text-sm font-medium">
                {isStreaming ? "Live Streaming" : "Paused"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span className="tabular-nums font-medium">{fps} Hz</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span className="tabular-nums font-medium">{dataPoints.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5" />
                <span className="tabular-nums font-medium">WebGPU</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!annotationMode) setIsStreaming(false);
                setAnnotationMode(!annotationMode);
              }}
            >
              <Pencil className="h-3 w-3" />
              {annotationMode ? "Annotating" : "Annotate"}
            </Button>
            {(annotations.length > 0 || measurements.length > 0) && (
              <Button
                onClick={() => {
                  setAnnotations([]);
                  setMeasurements([]);
                }}
                variant="outline"
                size="sm"
              >
                Clear ({annotations.length + measurements.length})
              </Button>
            )}
            <Button onClick={() => setIsStreaming(!isStreaming)} variant="outline" size="sm">
              {isStreaming ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-5">
        <StatCard
          icon={Gauge}
          label="Velocity"
          value={`${sensor.velocity.toFixed(1)} m/s`}
          subValue={`${(sensor.velocity * 3.6).toFixed(0)} km/h`}
        />
        <StatCard
          icon={Zap}
          label="G-Force"
          value={`${sensor.acceleration.toFixed(2)} G`}
          subValue={sensor.acceleration > 1.2 ? "High" : "Normal"}
        />
        <StatCard
          icon={Activity}
          label="Altitude"
          value={`${sensor.altitude.toFixed(0)} m`}
          subValue="AGL"
        />
        <StatCard
          icon={Radio}
          label="Signal"
          value={`${sensor.signal.toFixed(0)}%`}
          subValue={sensor.signal > 80 ? "Strong" : "Weak"}
        />
        <StatCard
          icon={Zap}
          label="Power"
          value={`${sensor.power.toFixed(0)}%`}
          subValue={sensor.power > 50 ? "Good" : "Low"}
        />
      </div>

      {/* Main Visualizations */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Velocity Chart */}
        <ChartCard
          title="Velocity"
          description={annotationMode ? "Drag to measure" : "Speed over time (m/s)"}
        >
          {velocityHistory.length > 10 ? (
            <AreaChart.Root
              series={velocitySeries}
              width="100%"
              height={200}
              xAxis={xAxis}
              yAxis={velocityYAxis}
              preferWebGPU={true}
            >
              <AreaChart.Canvas showGrid={true} />
              <AreaChart.Axes />
              <AreaChart.Tooltip />
              <ChartRuler
                enabled={annotationMode}
                measurements={measurements}
                onMeasure={(m) => setMeasurements((prev) => [...prev, m])}
                color={color}
                showValues={true}
              />
            </AreaChart.Root>
          ) : (
            <LoadingState count={velocityHistory.length} />
          )}
        </ChartCard>

        {/* G-Force Chart with Annotations */}
        <ChartCard
          title="Acceleration"
          description={annotationMode ? "Click to add annotations" : "G-Force readings"}
        >
          {accelHistory.length > 10 ? (
            <LineChart.Root
              series={accelSeries}
              width="100%"
              height={200}
              xAxis={xAxis}
              yAxis={accelYAxis}
              preferWebGPU={true}
            >
              <LineChart.Canvas showGrid={true} />
              <LineChart.Axes />
              <LineChart.Tooltip />
              <ChartAnnotations
                annotations={annotations}
                onChange={setAnnotations}
                enabled={annotationMode}
                color="#18181b"
              />
            </LineChart.Root>
          ) : (
            <LoadingState count={accelHistory.length} />
          )}
        </ChartCard>
      </div>

      {/* Secondary Charts */}
      <div className="grid gap-3 md:grid-cols-1">
        {/* Signal Strength */}

        {/* Velocity vs G-Force Scatter */}
        <ChartCard title="Velocity vs G-Force" description="Correlation analysis">
          {scatterData.length > 10 ? (
            <ScatterChart
              series={scatterSeries}
              width="100%"
              height={180}
              xAxis={{ label: "Velocity (m/s)", domain: [5, 20] }}
              yAxis={{ label: "G-Force", domain: [0.5, 1.5] }}
              showGrid
              showAxes
              preferWebGPU={true}
            />
          ) : (
            <LoadingState count={scatterData.length} />
          )}
        </ChartCard>
      </div>

      {/* Tertiary Charts */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* G-Force Distribution */}
        <ChartCard title="G-Force Distribution" description="Statistical histogram">
          {accelHistory.length > 20 ? (
            <HistogramChart
              data={accelHistory.map((d) => d.y)}
              binCount={12}
              width="100%"
              height={180}
              xAxis={{ label: "G-Force", domain: [0.5, 1.5] }}
              yAxis={{ label: "Count" }}
              color={color}
              showGrid
              showAxes
            />
          ) : (
            <LoadingState count={accelHistory.length} target={20} />
          )}
        </ChartCard>

        {/* System Health Bar Chart */}
        <ChartCard title="System Health" description="Real-time metrics (%)">
          <BarChart
            series={systemHealthData}
            width="100%"
            height={180}
            yAxis={{ label: "%", domain: [0, 100] }}
            showGrid
            showAxes
            preferWebGPU={true}
          />
        </ChartCard>
      </div>

      {/* Mission Timeline - Gantt Chart */}
      <ChartCard title="Mission Operations" description="Real-time mission task timeline">
        {missionTasks.length > 0 ? (
          <GanttChart tasks={missionTasks} timeWindowHours={3} rowHeight={30} variant="compact" />
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500 text-xs">
            Loading mission timeline...
          </div>
        )}
      </ChartCard>

      <div className="grid gap-3 md:grid-cols-1">
        <ChartCard title="LiDAR Terrain Scan" description="Real-time terrain mapping (2,500 pts)">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[280px] text-gray-500 text-xs">
                Loading 3D viewer...
              </div>
            }
          >
            <PointCloudViewer
              data={lidarData}
              colorMode="height"
              pointSize={0.15}
              width="100%"
              height={280}
              showGrid={false}
              autoRotate={false}
              backgroundColor="#0a0a0a"
            />
          </Suspense>
        </ChartCard>
      </div>
    </div>
  );
}

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue: string;
}) {
  return (
    <Card className="p-4">
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
          <Icon className="h-3 w-3" />
          {label}
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <div className="text-xs text-zinc-600">{subValue}</div>
      </div>
    </Card>
  );
});

const ChartCard = memo(function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4 bg-transparent">
      <div className="mb-3">
        <h3 className="text-xs font-medium text-zinc-400 mb-1">{title}</h3>
        <p className="text-xs text-zinc-600">{description}</p>
      </div>
      <div>{children}</div>
    </Card>
  );
});

function LoadingState({ count, target = 10 }: { count: number; target?: number }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-gray-500 text-xs">
      Collecting data... ({count}/{target})
    </div>
  );
}
