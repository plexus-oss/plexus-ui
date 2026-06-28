/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
"use client";

import {
  type BoundingBox3D,
  type Measurement,
  PointCloudInteractions,
} from "@plexusui/components/charts/point-cloud-interactions";
import type { ColorMode, PointCloudData } from "@plexusui/components/charts/point-cloud-viewer";
import { PointCloudViewer } from "@plexusui/components/charts/point-cloud-viewer";
import { detectFormat, loadPointCloud } from "@plexusui/components/lib/point-cloud-loaders";
import { useMemo, useState } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Synthetic Point Cloud Data Generators
// ============================================================================

/**
 * Generate a synthetic terrain point cloud
 */
function generateTerrainPointCloud(
  width: number,
  depth: number,
  resolution: number
): PointCloudData {
  const positions: number[] = [];
  const intensities: number[] = [];

  for (let x = 0; x < width; x += resolution) {
    for (let z = 0; z < depth; z += resolution) {
      // Create hilly terrain using sine waves
      const y = Math.sin(x * 0.1) * 5 + Math.cos(z * 0.1) * 3 + Math.sin(x * 0.05 + z * 0.05) * 2;

      positions.push(x - width / 2, y, z - depth / 2);

      // Intensity based on height
      const normalizedHeight = (y + 10) / 20;
      intensities.push(normalizedHeight);
    }
  }

  return {
    positions: new Float32Array(positions),
    intensities: new Float32Array(intensities),
  };
}

/**
 * Generate a synthetic building scan point cloud
 */
function generateBuildingScanPointCloud(): PointCloudData {
  const positions: number[] = [];
  const classifications: number[] = [];

  // Ground plane (classification: 2)
  for (let x = -20; x <= 20; x += 0.5) {
    for (let z = -20; z <= 20; z += 0.5) {
      positions.push(x, 0, z);
      classifications.push(2); // Ground
    }
  }

  // Building walls (classification: 6)
  const buildingHeight = 15;
  const buildingSize = 10;

  // Front and back walls
  for (let x = -buildingSize; x <= buildingSize; x += 0.3) {
    for (let y = 0; y <= buildingHeight; y += 0.3) {
      positions.push(x, y, -buildingSize);
      classifications.push(6); // Building
      positions.push(x, y, buildingSize);
      classifications.push(6); // Building
    }
  }

  // Left and right walls
  for (let z = -buildingSize; z <= buildingSize; z += 0.3) {
    for (let y = 0; y <= buildingHeight; y += 0.3) {
      positions.push(-buildingSize, y, z);
      classifications.push(6); // Building
      positions.push(buildingSize, y, z);
      classifications.push(6); // Building
    }
  }

  // Roof (classification: 6)
  for (let x = -buildingSize; x <= buildingSize; x += 0.5) {
    for (let z = -buildingSize; z <= buildingSize; z += 0.5) {
      positions.push(x, buildingHeight, z);
      classifications.push(6); // Building
    }
  }

  // Trees around building (classification: 5 - high vegetation)
  const treePositions = [
    [-15, 7],
    [15, 7],
    [-15, -7],
    [15, -7],
  ];

  for (const [tx, tz] of treePositions) {
    // Tree trunk and foliage
    for (let i = 0; i < 500; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2;
      const height = Math.random() * 8 + 2;

      positions.push(tx + Math.cos(angle) * radius, height, tz + Math.sin(angle) * radius);
      classifications.push(5); // High vegetation
    }
  }

  return {
    positions: new Float32Array(positions),
    classifications: new Uint8Array(classifications),
  };
}

/**
 * Generate a synthetic RGB point cloud (colored sphere)
 */
function generateColoredSpherePointCloud(radius: number, numPoints: number): PointCloudData {
  const positions: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    // Fibonacci sphere distribution for even point spacing
    const phi = Math.acos(1 - (2 * (i + 0.5)) / numPoints);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions.push(x, y, z);

    // Color based on position (RGB gradient)
    const r = ((x + radius) / (2 * radius)) * 255;
    const g = ((y + radius) / (2 * radius)) * 255;
    const b = ((z + radius) / (2 * radius)) * 255;

    colors.push(r, g, b);
  }

  return {
    positions: new Float32Array(positions),
    colors: new Uint8Array(colors),
  };
}

/**
 * Generate LIDAR-style scan with intensity
 */
function generateLIDARScanPointCloud(): PointCloudData {
  const positions: number[] = [];
  const intensities: number[] = [];

  // Simulate 360-degree LIDAR scan with multiple vertical angles
  const numHorizontalRays = 360 * 4; // 0.25 degree resolution
  const numVerticalRays = 64; // 64-beam LIDAR
  const maxRange = 100;

  for (let v = 0; v < numVerticalRays; v++) {
    const verticalAngle = ((v / numVerticalRays) * 30 - 15) * (Math.PI / 180); // -15 to +15 degrees

    for (let h = 0; h < numHorizontalRays; h++) {
      const horizontalAngle = (h / numHorizontalRays) * Math.PI * 2;

      // Simulate returns at various distances with some noise
      const baseRange = 20 + Math.random() * 30;
      const range = Math.min(baseRange + Math.sin(horizontalAngle * 3) * 10, maxRange);

      const x = range * Math.cos(verticalAngle) * Math.cos(horizontalAngle);
      const y = range * Math.sin(verticalAngle);
      const z = range * Math.cos(verticalAngle) * Math.sin(horizontalAngle);

      positions.push(x, y, z);

      // Intensity varies with distance and angle (simulating reflectivity)
      const intensity = Math.max(0.2, 1 - range / maxRange + Math.random() * 0.2);
      intensities.push(intensity);
    }
  }

  return {
    positions: new Float32Array(positions),
    intensities: new Float32Array(intensities),
  };
}

// ============================================================================
// Example Components
// ============================================================================

function TerrainExample() {
  const data = useMemo(() => generateTerrainPointCloud(100, 100, 2), []);

  return (
    <ComponentPreview
      title="Terrain Mapping"
      description="Synthetic terrain point cloud colored by elevation (height). Simulates topographic LIDAR scanning."
      code={`import { PointCloudViewer } from "@plexusui/components/charts/point-cloud-viewer";

<PointCloudViewer
  data={terrainData}
  colorMode="height"
  pointSize={0.3}
  height={500}
/>`}
      preview={
        <div className="w-full">
          <PointCloudViewer
            data={data}
            colorMode="height"
            pointSize={0.3}
            height={500}
            backgroundColor="black"
          />
        </div>
      }
    />
  );
}

function BuildingScanExample() {
  const data = useMemo(() => generateBuildingScanPointCloud(), []);

  return (
    <ComponentPreview
      title="Building Scan with Classification"
      description="LIDAR building scan with LAS classification colors: Ground (brown), Building (red), High Vegetation (dark green)."
      code={`import { PointCloudViewer } from "@plexusui/components/charts/point-cloud-viewer";

<PointCloudViewer
  data={buildingScanData}
  colorMode="classification"
  pointSize={0.15}
  height={500}
/>`}
      preview={
        <div className="w-full">
          <PointCloudViewer
            data={data}
            colorMode="classification"
            pointSize={0.15}
            height={500}
            backgroundColor="#0a0a0a"
          />
        </div>
      }
    />
  );
}

function ColoredSphereExample() {
  const data = useMemo(() => generateColoredSpherePointCloud(10, 10000), []);

  return (
    <ComponentPreview
      title="RGB Point Cloud"
      description="10,000 points with RGB color data. Uses Fibonacci sphere distribution for even spacing."
      code={`import { PointCloudViewer } from "@plexusui/components/charts/point-cloud-viewer";

<PointCloudViewer
  data={rgbPointCloud}
  colorMode="rgb"
  pointSize={0.2}
  autoRotate
  height={500}
/>`}
      preview={
        <div className="w-full">
          <PointCloudViewer
            data={data}
            colorMode="rgb"
            pointSize={0.2}
            autoRotate
            height={500}
            backgroundColor="#000000"
            showGrid={false}
          />
        </div>
      }
    />
  );
}

function LIDARScanExample() {
  const data = useMemo(() => generateLIDARScanPointCloud(), []);

  return (
    <ComponentPreview
      title="LIDAR 360° Scan"
      description="64-beam LIDAR simulation with intensity coloring. ~92,000 points representing a full hemisphere scan."
      code={`import { PointCloudViewer } from "@plexusui/components/charts/point-cloud-viewer";

<PointCloudViewer
  data={lidarScan}
  colorMode="intensity"
  pointSize={0.1}
  showAxes
  height={500}
/>`}
      preview={
        <div className="w-full">
          <PointCloudViewer
            data={data}
            colorMode="intensity"
            pointSize={0.1}
            showAxes
            height={500}
            backgroundColor="#0a0a0a"
            cameraPosition={[0, 20, 50]}
          />
        </div>
      }
    />
  );
}

function ComposableExample() {
  const [colorMode, setColorMode] = useState<ColorMode>("height");
  const data = useMemo(() => generateTerrainPointCloud(80, 80, 1.5), []);

  return (
    <ComponentPreview
      title="Composable API (Primitive)"
      description="Using primitive components for full control. Switch color modes dynamically."
      code={`import { PointCloudViewer } from "@plexusui/components/charts/point-cloud-viewer";

<PointCloudViewer.Root
  data={data}
  colorMode={colorMode}
  pointSize={0.25}
  height={500}
>
  <PointCloudViewer.Scene />
  <PointCloudViewer.Controls />
</PointCloudViewer.Root>`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setColorMode("height")}
              className={`px-3 py-1 text-xs rounded ${
                colorMode === "height" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              Height
            </button>
            <button
              onClick={() => setColorMode("intensity")}
              className={`px-3 py-1 text-xs rounded ${
                colorMode === "intensity" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              Intensity
            </button>
          </div>
          <PointCloudViewer.Root
            data={data}
            colorMode={colorMode}
            pointSize={0.25}
            height={500}
            backgroundColor="#0f172a"
          >
            <PointCloudViewer.Scene />
            <PointCloudViewer.Controls />
          </PointCloudViewer.Root>
        </div>
      }
    />
  );
}

function FileUploadExample() {
  const [pointCloud, setPointCloud] = useState<PointCloudData | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError("");

    try {
      const format = detectFormat(file);
      if (format === "unknown") {
        throw new Error("Unsupported file format. Use .xyz, .pcd, or .las");
      }

      const data = await loadPointCloud(file, {
        maxPoints: 100000, // Limit for demo
        stride: 1,
      });

      setPointCloud(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentPreview
      title="File Upload & Visualization"
      description="Load point cloud files (.xyz, .pcd, .las) and visualize them. Demonstrates real-world data import workflow."
      code={`import { PointCloudViewer } from "@plexusui/components/charts/point-cloud-viewer";
import { loadPointCloud, detectFormat } from "@plexusui/components/lib/point-cloud-loaders";

const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const data = await loadPointCloud(file, {
    maxPoints: 100000,
    stride: 1,
  });

  setPointCloud(data);
};

<input
  type="file"
  accept=".xyz,.pcd,.las"
  onChange={handleFileChange}
/>
{pointCloud && (
  <PointCloudViewer
    data={pointCloud}
    colorMode="height"
  />
)}`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded cursor-pointer w-fit">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm">
                {loading
                  ? "Loading..."
                  : fileName
                    ? `${fileName}`
                    : "Choose file (.xyz, .pcd, .las)"}
              </span>
              <input
                type="file"
                accept=".xyz,.pcd,.las"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {error && (
              <div className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">{error}</div>
            )}
            {!pointCloud && !loading && (
              <div className="text-xs text-zinc-500 bg-zinc-900 px-3 py-2 rounded">
                Upload a point cloud file to visualize. For demo purposes, files are limited to
                100,000 points.
              </div>
            )}
          </div>
          {pointCloud && (
            <PointCloudViewer
              data={pointCloud}
              colorMode="height"
              pointSize={0.2}
              height={500}
              backgroundColor="#0a0a0a"
            />
          )}
        </div>
      }
    />
  );
}

function InteractionsExample() {
  const [mode, setMode] = useState<"select" | "box" | "measure" | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [boxes, setBoxes] = useState<BoundingBox3D[]>([]);
  const data = useMemo(() => generateBuildingScanPointCloud(), []);

  const handleMeasure = (measurement: Measurement) => {
    setMeasurements((prev) => [...prev, measurement]);
  };

  const handleBoxComplete = (box: BoundingBox3D) => {
    setBoxes((prev) => [...prev, box]);
  };

  return (
    <ComponentPreview
      title="3D Annotations & Measurements"
      description="Interactive tools for ML labeling and quality control: bounding boxes, measurements, point selection."
      code={`import { PointCloudViewer } from "@plexusui/components/charts/point-cloud-viewer";
import { PointCloudInteractions } from "@plexusui/components/charts/point-cloud-interactions";

<PointCloudViewer.Root data={data}>
  <PointCloudViewer.Scene />
  <PointCloudViewer.Controls />
  <PointCloudInteractions
    mode={mode}
    onBoxComplete={(box) => saveAnnotation(box)}
    onMeasure={(m) => console.log(m.distance)}
  />
</PointCloudViewer.Root>`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMode(mode === "box" ? null : "box")}
              className={`px-3 py-1 text-xs rounded ${
                mode === "box" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              Bounding Box
            </button>
            <button
              onClick={() => setMode(mode === "measure" ? null : "measure")}
              className={`px-3 py-1 text-xs rounded ${
                mode === "measure" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              Measure
            </button>
            <button
              onClick={() => {
                setMode(null);
                setMeasurements([]);
                setBoxes([]);
              }}
              className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400"
            >
              Clear
            </button>
          </div>

          {measurements.length > 0 && (
            <div className="text-xs bg-zinc-900 px-3 py-2 rounded">
              Last measurement: {measurements[measurements.length - 1].distance.toFixed(2)} units
            </div>
          )}

          {boxes.length > 0 && (
            <div className="text-xs bg-zinc-900 px-3 py-2 rounded">
              Bounding boxes created: {boxes.length}
            </div>
          )}

          <PointCloudViewer.Root
            data={data}
            colorMode="classification"
            pointSize={0.15}
            height={500}
            backgroundColor="#0a0a0a"
          >
            <PointCloudViewer.Scene />
            <PointCloudViewer.Controls />
            <PointCloudInteractions
              mode={mode}
              onBoxComplete={handleBoxComplete}
              onMeasure={handleMeasure}
            />
          </PointCloudViewer.Root>
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const pointCloudViewerProps: ApiProp[] = [
  {
    name: "data",
    type: "PointCloudData",
    default: "required",
    description:
      "Point cloud data with positions (required) and optional colors, intensities, classifications",
  },
  {
    name: "colorMode",
    type: '"height" | "intensity" | "rgb" | "classification"',
    default: '"height"',
    description:
      "Color mapping mode: height (Z-coordinate), intensity (LIDAR return), rgb (vertex colors), classification (LAS standard)",
  },
  {
    name: "pointSize",
    type: "number",
    default: "0.05",
    description: "Point size in 3D space units",
  },
  {
    name: "colorScale",
    type: "(value: number) => string",
    default: "viridis",
    description: "Color scale function for height/intensity mapping (0-1 input)",
  },
  {
    name: "minValue",
    type: "number",
    default: "auto",
    description: "Minimum value for color scale normalization",
  },
  {
    name: "maxValue",
    type: "number",
    default: "auto",
    description: "Maximum value for color scale normalization",
  },
  {
    name: "width",
    type: "number | string",
    default: '"100%"',
    description: "Viewer width in pixels or CSS units",
  },
  {
    name: "height",
    type: "number | string",
    default: "600",
    description: "Viewer height in pixels or CSS units",
  },
  {
    name: "showGrid",
    type: "boolean",
    default: "true",
    description: "Show ground grid",
  },
  {
    name: "showAxes",
    type: "boolean",
    default: "false",
    description: "Show 3D axes helper",
  },
  {
    name: "cameraPosition",
    type: "[number, number, number]",
    default: "auto",
    description: "Camera position [x, y, z]. Auto-calculated based on point cloud bounds",
  },
  {
    name: "backgroundColor",
    type: "string",
    default: '"#0a0a0a"',
    description: "Background color (hex)",
  },
  {
    name: "autoRotate",
    type: "boolean",
    default: "false",
    description: "Enable automatic camera rotation",
  },
  {
    name: "enableDamping",
    type: "boolean",
    default: "true",
    description: "Enable smooth camera damping",
  },
  {
    name: "maxDistance",
    type: "number",
    default: "undefined",
    description: "Maximum camera zoom out distance",
  },
  {
    name: "minDistance",
    type: "number",
    default: "undefined",
    description: "Minimum camera zoom in distance",
  },
];

const pointCloudDataType: ApiProp[] = [
  {
    name: "positions",
    type: "Float32Array | number[]",
    default: "required",
    description: "Point positions as flat array [x1, y1, z1, x2, y2, z2, ...]",
  },
  {
    name: "colors",
    type: "Uint8Array | number[]",
    default: "undefined",
    description: "RGB colors as flat array [r1, g1, b1, ...] (0-255). Used with colorMode='rgb'",
  },
  {
    name: "intensities",
    type: "Float32Array | number[]",
    default: "undefined",
    description: "Per-point intensity values (0-1 or 0-255). Used with colorMode='intensity'",
  },
  {
    name: "classifications",
    type: "Uint8Array | number[]",
    default: "undefined",
    description: "LAS classification codes (2=Ground, 5=Vegetation, 6=Building, etc.)",
  },
];

const primitiveComponents: ApiProp[] = [
  {
    name: "PointCloudViewer.Root",
    type: "component",
    default: "-",
    description:
      "Root container with context. Props: all PointCloudViewerProps except composed children",
  },
  {
    name: "PointCloudViewer.Scene",
    type: "component",
    default: "-",
    description: "3D scene with point cloud, grid, axes, and lighting",
  },
  {
    name: "PointCloudViewer.Controls",
    type: "component",
    default: "-",
    description:
      "Orbit controls for camera interaction. Props: autoRotate, enableDamping, maxDistance, minDistance",
  },
  {
    name: "PointCloudViewer.PointCloud",
    type: "component",
    default: "-",
    description: "Raw point cloud renderer (used within Scene)",
  },
];

export function PointCloudViewerExamples() {
  return (
    <div className="space-y-12">
      {/* Examples Section */}
      <div className="space-y-8">
        <TerrainExample />
        <BuildingScanExample />
        <ColoredSphereExample />
        <LIDARScanExample />
        <ComposableExample />
        <FileUploadExample />
        <InteractionsExample />
      </div>

      {/* API Reference Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            High-performance 3D point cloud visualization with multiple color modes
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">PointCloudViewer</h3>
          <ApiReferenceTable props={pointCloudViewerProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">PointCloudData Type</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Data structure for point cloud input
          </p>
          <ApiReferenceTable props={pointCloudDataType} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primitive Components</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use for custom composition and full control
          </p>
          <ApiReferenceTable props={primitiveComponents} />
        </div>
      </div>
    </div>
  );
}
