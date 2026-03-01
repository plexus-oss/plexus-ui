/** biome-ignore-all lint/a11y/useButtonType: playground demo buttons where explicit type is unnecessary */
"use client";

import {
  generateBeamSTL,
  generateCubeSTL,
  ModelViewer,
} from "@plexusui/components/charts/3d-model-viewer";
import { inferno, plasma, viridis } from "@plexusui/components/lib/color-scales";
import { useMemo, useState } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Synthetic Model Data Generators
// ============================================================================

/**
 * Generate a cylinder STL for demonstration
 */
function _generateCylinderSTL(radius = 1, height = 3, segments = 32): ArrayBuffer {
  const vertices: number[] = [];

  // Generate cylinder sides
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * Math.PI * 2;
    const angle2 = ((i + 1) / segments) * Math.PI * 2;

    const x1 = Math.cos(angle1) * radius;
    const z1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const z2 = Math.sin(angle2) * radius;

    // Side face (two triangles per segment)
    // Triangle 1
    vertices.push(x1, -height / 2, z1);
    vertices.push(x2, -height / 2, z2);
    vertices.push(x2, height / 2, z2);
    // Triangle 2
    vertices.push(x1, -height / 2, z1);
    vertices.push(x2, height / 2, z2);
    vertices.push(x1, height / 2, z1);

    // Top cap
    vertices.push(0, height / 2, 0);
    vertices.push(x1, height / 2, z1);
    vertices.push(x2, height / 2, z2);

    // Bottom cap
    vertices.push(0, -height / 2, 0);
    vertices.push(x2, -height / 2, z2);
    vertices.push(x1, -height / 2, z1);
  }

  return createSTLBuffer(vertices);
}

/**
 * Generate an I-beam STL for structural analysis demo
 */
function _generateIBeamSTL(
  length = 10,
  flangeWidth = 2,
  flangeHeight = 0.3,
  webHeight = 2,
  webThickness = 0.2
): { buffer: ArrayBuffer; stressValues: number[] } {
  const vertices: number[] = [];
  const stressValues: number[] = [];
  const divisions = 20;

  // Generate I-beam cross-section along length
  for (let i = 0; i < divisions; i++) {
    const x1 = (i / divisions) * length - length / 2;
    const x2 = ((i + 1) / divisions) * length - length / 2;

    // Top flange
    addBoxSegment(
      vertices,
      x1,
      x2,
      -flangeWidth / 2,
      flangeWidth / 2,
      webHeight / 2,
      webHeight / 2 + flangeHeight
    );

    // Bottom flange
    addBoxSegment(
      vertices,
      x1,
      x2,
      -flangeWidth / 2,
      flangeWidth / 2,
      -webHeight / 2 - flangeHeight,
      -webHeight / 2
    );

    // Web (center)
    addBoxSegment(
      vertices,
      x1,
      x2,
      -webThickness / 2,
      webThickness / 2,
      -webHeight / 2,
      webHeight / 2
    );

    // Calculate stress - higher at ends and at flanges
    const distFromCenter = Math.abs((x1 + x2) / 2) / (length / 2);
    const baseStress = distFromCenter * 80;

    // Add stress values for all vertices (each box segment has many vertices)
    const verticesPerSegment = 36 * 3; // 12 triangles * 3 vertices * 3 segments
    for (let j = 0; j < verticesPerSegment; j++) {
      stressValues.push(baseStress + Math.random() * 20);
    }
  }

  return { buffer: createSTLBuffer(vertices), stressValues };
}

/**
 * Helper to add a box segment
 */
function addBoxSegment(
  vertices: number[],
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  z1: number,
  z2: number
) {
  // Front face
  vertices.push(x1, y1, z2, x2, y1, z2, x2, y2, z2);
  vertices.push(x1, y1, z2, x2, y2, z2, x1, y2, z2);
  // Back face
  vertices.push(x1, y1, z1, x1, y2, z1, x2, y2, z1);
  vertices.push(x1, y1, z1, x2, y2, z1, x2, y1, z1);
  // Top face
  vertices.push(x1, y2, z1, x1, y2, z2, x2, y2, z2);
  vertices.push(x1, y2, z1, x2, y2, z2, x2, y2, z1);
  // Bottom face
  vertices.push(x1, y1, z1, x2, y1, z1, x2, y1, z2);
  vertices.push(x1, y1, z1, x2, y1, z2, x1, y1, z2);
  // Right face
  vertices.push(x2, y1, z1, x2, y2, z1, x2, y2, z2);
  vertices.push(x2, y1, z1, x2, y2, z2, x2, y1, z2);
  // Left face
  vertices.push(x1, y1, z1, x1, y1, z2, x1, y2, z2);
  vertices.push(x1, y1, z1, x1, y2, z2, x1, y2, z1);
}

/**
 * Create STL binary buffer from vertices
 */
function createSTLBuffer(vertices: number[]): ArrayBuffer {
  const triangleCount = vertices.length / 9;
  const headerSize = 80;
  const triangleDataSize = 50;
  const bufferSize = headerSize + 4 + triangleCount * triangleDataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // Write triangle count
  view.setUint32(80, triangleCount, true);

  let offset = 84;
  for (let i = 0; i < triangleCount; i++) {
    const i0 = i * 9;

    // Calculate normal
    const v1 = [
      vertices[i0 + 3] - vertices[i0],
      vertices[i0 + 4] - vertices[i0 + 1],
      vertices[i0 + 5] - vertices[i0 + 2],
    ];
    const v2 = [
      vertices[i0 + 6] - vertices[i0],
      vertices[i0 + 7] - vertices[i0 + 1],
      vertices[i0 + 8] - vertices[i0 + 2],
    ];

    // Cross product for normal
    const normal = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
    const len = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
    if (len > 0) {
      normal[0] /= len;
      normal[1] /= len;
      normal[2] /= len;
    }

    // Write normal
    view.setFloat32(offset, normal[0], true);
    view.setFloat32(offset + 4, normal[1], true);
    view.setFloat32(offset + 8, normal[2], true);
    offset += 12;

    // Write 3 vertices
    for (let j = 0; j < 3; j++) {
      view.setFloat32(offset, vertices[i0 + j * 3], true);
      view.setFloat32(offset + 4, vertices[i0 + j * 3 + 1], true);
      view.setFloat32(offset + 8, vertices[i0 + j * 3 + 2], true);
      offset += 12;
    }

    // Write attribute byte count
    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

// ============================================================================
// Example Components
// ============================================================================

function BasicCubeExample() {
  const cubeData = useMemo(() => generateCubeSTL(), []);

  return (
    <ComponentPreview
      title="Basic 3D Model"
      description="Simple cube model with default material settings. Drag to rotate, scroll to zoom."
      code={`import { ModelViewer, generateCubeSTL } from "@plexusui/components/charts/3d-model-viewer";

const cubeData = generateCubeSTL();

<ModelViewer
  modelData={cubeData}
  modelType="stl"
  height={400}
  showGrid
/>`}
      preview={
        <div className="w-full h-[400px]">
          <ModelViewer
            modelData={cubeData}
            modelType="stl"
            height="100%"
            backgroundColor="#0a0a0a"
          />
        </div>
      }
    />
  );
}

function WireframeExample() {
  const cubeData = useMemo(() => generateCubeSTL(), []);

  return (
    <ComponentPreview
      title="Wireframe Mode"
      description="Model rendered in wireframe mode for mesh inspection and topology analysis."
      code={`import { ModelViewer, generateCubeSTL } from "@plexusui/components/charts/3d-model-viewer";

<ModelViewer
  modelData={cubeData}
  modelType="stl"
  wireframe
  showAxes
  height={400}
/>`}
      preview={
        <div className="w-full h-[400px]">
          <ModelViewer
            modelData={cubeData}
            modelType="stl"
            wireframe
            showAxes
            showGrid={false}
            height="100%"
            backgroundColor="#0a0a0a"
          />
        </div>
      }
    />
  );
}

function ColorScaleComparisonExample() {
  const [selectedScale, setSelectedScale] = useState<"viridis" | "plasma" | "inferno">("viridis");
  const { buffer, stressValues } = useMemo(() => generateBeamSTL(25), []);

  const colorScales = {
    viridis,
    plasma,
    inferno,
  };

  return (
    <ComponentPreview
      title="Color Scale Options"
      description="Compare different color scales for data visualization. Each scale has different perceptual properties."
      code={`import { ModelViewer } from "@plexusui/components/charts/3d-model-viewer";
import { viridis, plasma, inferno } from "@plexusui/components/lib/color-scales";

<ModelViewer
  modelData={buffer}
  vertexColors={stressValues}
  colorScale={selectedScale === "viridis" ? viridis : plasma}
  minValue={0}
  maxValue={100}
/>`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex gap-2">
            {(["viridis", "plasma", "inferno"] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => setSelectedScale(scale)}
                className={`px-3 py-1 text-xs rounded capitalize ${
                  selectedScale === scale ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {scale}
              </button>
            ))}
          </div>
          <div className="w-full h-[400px]">
            <ModelViewer
              modelData={buffer}
              modelType="stl"
              vertexColors={stressValues}
              colorScale={colorScales[selectedScale]}
              minValue={0}
              maxValue={100}
              height="100%"
              backgroundColor="#0a0a0a"
            />
          </div>
        </div>
      }
    />
  );
}

function ComposableExample() {
  const cubeData = useMemo(() => generateCubeSTL(), []);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(false);

  return (
    <ComponentPreview
      title="Composable API (Primitive)"
      description="Using primitive components for full control over the 3D scene composition."
      code={`import { ModelViewer } from "@plexusui/components/charts/3d-model-viewer";

<ModelViewer.Root
  modelData={modelData}
  modelType="stl"
  showGrid={showGrid}
  showAxes={showAxes}
  height={400}
>
  <ModelViewer.Canvas />
</ModelViewer.Root>`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded"
              />
              Show Grid
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={showAxes}
                onChange={(e) => setShowAxes(e.target.checked)}
                className="rounded"
              />
              Show Axes
            </label>
          </div>
          <div className="w-full h-[400px]">
            <ModelViewer.Root
              modelData={cubeData}
              modelType="stl"
              showGrid={showGrid}
              showAxes={showAxes}
              height="100%"
              backgroundColor="#111111"
            >
              <ModelViewer.Canvas />
            </ModelViewer.Root>
          </div>
        </div>
      }
    />
  );
}

function FileUploadExample() {
  const [modelData, setModelData] = useState<ArrayBuffer | null>(null);
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
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension !== "stl" && extension !== "obj") {
        throw new Error("Unsupported file format. Use .stl or .obj files.");
      }

      const buffer = await file.arrayBuffer();
      setModelData(buffer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentPreview
      title="File Upload"
      description="Load STL or OBJ files from disk. Supports binary and ASCII STL formats."
      code={`import { ModelViewer } from "@plexusui/components/charts/3d-model-viewer";

const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  const buffer = await file.arrayBuffer();
  setModelData(buffer);
};

<input type="file" accept=".stl,.obj" onChange={handleFileChange} />
{modelData && (
  <ModelViewer
    modelData={modelData}
    modelType="stl"
    height={400}
  />
)}`}
      preview={
        <div className="w-full space-y-4">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded cursor-pointer w-fit">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm">
                {loading ? "Loading..." : fileName ? fileName : "Choose file (.stl, .obj)"}
              </span>
              <input
                type="file"
                accept=".stl,.obj"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {error && (
              <div className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">{error}</div>
            )}
            {!modelData && !loading && (
              <div className="text-xs text-zinc-500 bg-zinc-900 px-3 py-2 rounded">
                Upload an STL or OBJ file to visualize. Supports CAD exports, 3D scans, and 3D
                printing models.
              </div>
            )}
          </div>
          {modelData && (
            <div className="w-full h-[400px]">
              <ModelViewer
                modelData={modelData}
                modelType="stl"
                height="100%"
                backgroundColor="#0a0a0a"
                showGrid
              />
            </div>
          )}
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const modelViewerProps: ApiProp[] = [
  {
    name: "modelUrl",
    type: "string",
    default: "undefined",
    description: "URL to load the 3D model from (alternative to modelData)",
  },
  {
    name: "modelType",
    type: '"stl" | "obj" | "gltf" | "glb"',
    default: '"stl"',
    description: "Type of 3D model format",
  },
  {
    name: "modelData",
    type: "ArrayBuffer | Float32Array",
    default: "undefined",
    description: "Model data as binary buffer (alternative to modelUrl)",
  },
  {
    name: "vertexColors",
    type: "number[]",
    default: "undefined",
    description:
      "Per-vertex color values (0-1 range) for data visualization like stress/temperature",
  },
  {
    name: "colorScale",
    type: "(value: number) => string",
    default: "viridis",
    description: "Color scale function mapping normalized values (0-1) to hex colors",
  },
  {
    name: "minValue",
    type: "number",
    default: "0",
    description: "Minimum value for color scale normalization",
  },
  {
    name: "maxValue",
    type: "number",
    default: "100",
    description: "Maximum value for color scale normalization",
  },
  {
    name: "width",
    type: "number | string",
    default: "800",
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
    description: "Show ground grid for spatial reference",
  },
  {
    name: "showAxes",
    type: "boolean",
    default: "false",
    description: "Show XYZ axes helper",
  },
  {
    name: "cameraPosition",
    type: "[number, number, number]",
    default: "[3, 3, 3]",
    description: "Initial camera position [x, y, z]",
  },
  {
    name: "backgroundColor",
    type: "string",
    default: '"#111111"',
    description: "Background color (hex)",
  },
  {
    name: "autoRotate",
    type: "boolean",
    default: "false",
    description: "Enable automatic model rotation",
  },
  {
    name: "wireframe",
    type: "boolean",
    default: "false",
    description: "Render model as wireframe",
  },
  {
    name: "metalness",
    type: "number",
    default: "0.5",
    description: "Material metalness (0-1). Higher values appear more metallic",
  },
  {
    name: "roughness",
    type: "number",
    default: "0.5",
    description: "Material roughness (0-1). Lower values appear more glossy/reflective",
  },
  {
    name: "className",
    type: "string",
    default: '""',
    description: "CSS class name for the container element",
  },
];

const primitiveComponents: ApiProp[] = [
  {
    name: "ModelViewer.Root",
    type: "component",
    default: "-",
    description:
      "Root container with context provider. Accepts all ModelViewerProps plus optional children",
  },
  {
    name: "ModelViewer.Canvas",
    type: "component",
    default: "-",
    description: "The 3D canvas with camera and controls. Use within ModelViewer.Root",
  },
  {
    name: "ModelViewer.Scene",
    type: "component",
    default: "-",
    description: "Scene containing the model, lighting, grid, and axes",
  },
];

const utilityFunctions: ApiProp[] = [
  {
    name: "generateCubeSTL()",
    type: "() => ArrayBuffer",
    default: "-",
    description: "Generate a simple cube STL for testing and demos",
  },
  {
    name: "generateBeamSTL(divisions)",
    type: "(divisions?: number) => { buffer: ArrayBuffer; stressValues: number[] }",
    default: "-",
    description:
      "Generate a beam STL with simulated stress distribution for FEA visualization demos",
  },
];

// ============================================================================
// Main Export
// ============================================================================

function ModelViewerExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <BasicCubeExample />

        <WireframeExample />
        <ColorScaleComparisonExample />
        <ComposableExample />
        <FileUploadExample />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            3D model viewer with support for STL/OBJ files and vertex color visualization for
            engineering analysis
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ModelViewer</h3>
          <ApiReferenceTable props={modelViewerProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primitive Components</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use for custom composition and full control over the 3D scene
          </p>
          <ApiReferenceTable props={primitiveComponents} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Utility Functions</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Helper functions for generating test models
          </p>
          <ApiReferenceTable props={utilityFunctions} />
        </div>
      </div>
    </div>
  );
}

// Default export for dynamic import (named export can't start with number)
export default ModelViewerExamples;
