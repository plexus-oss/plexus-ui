"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ChartAxes,
  ChartRoot,
  ChartTooltip,
  createWebGLRenderer,
  createWebGPURenderer,
  getDomain,
  hexToRgb,
  type Point,
  type RendererProps,
  useBaseChart,
  type WebGLRenderer,
  type WebGPURenderer,
} from "./base-chart";

// ============================================================================
// Area Chart Types
// ============================================================================

export type DataPoint = Point;

export interface Series {
  /**
   * Display name for this data series
   * @required
   */
  name: string;

  /**
   * Array of data points (x, y coordinates)
   * @required
   */
  data: Point[];

  /**
   * Area fill color
   * Supports any valid CSS color value
   * @default "#3b82f6"
   */
  color?: string;

  /**
   * Area fill opacity (0-1)
   * @default 0.3
   */
  fillOpacity?: number;

  /**
   * Line stroke width in pixels
   * @default 2
   */
  strokeWidth?: number;

  /**
   * Y value for the baseline
   * @default 0
   */
  baseline?: number;
}

export interface AreaChartProps {
  /**
   * Array of data series to display
   * @required
   */
  series: Series[];

  /**
   * X-axis configuration
   */
  xAxis?: {
    /** Axis label text */
    label?: string;
    /** Value domain [min, max] or "auto" for automatic */
    domain?: [number, number] | "auto";
    /** Custom value formatter function */
    formatter?: (value: number) => string;
  };

  /**
   * Y-axis configuration
   */
  yAxis?: {
    /** Axis label text */
    label?: string;
    /** Value domain [min, max] or "auto" for automatic */
    domain?: [number, number] | "auto";
    /** Custom value formatter function */
    formatter?: (value: number) => string;
  };

  /**
   * Chart width
   * Supports fixed pixel values or responsive units (e.g., "100%", "50vw")
   * @default 800
   */
  width?: number | string;

  /**
   * Chart height
   * Supports fixed pixel values or responsive units (e.g., "100%", "50vh")
   * @default 400
   */
  height?: number | string;

  /**
   * Display grid lines
   * @default true
   */
  showGrid?: boolean;

  /**
   * Display axes with labels and ticks
   * @default true
   */
  showAxes?: boolean;

  /**
   * Enable interactive tooltip on hover
   * @default false
   */
  showTooltip?: boolean;

  /**
   * Additional CSS classes to apply to the container
   */
  className?: string;

  /**
   * Prefer WebGPU over WebGL for rendering
   * Falls back to WebGL if WebGPU is not available
   * @default true
   */
  preferWebGPU?: boolean;

  /**
   * Stack areas on top of each other
   * @default false
   */
  stacked?: boolean;
}

// Extended context for area chart
interface AreaChartContextType {
  series: Series[];
  stacked: boolean;
}

const AreaChartContext = createContext<AreaChartContextType | null>(null);

function useAreaChartData() {
  const ctx = useContext(AreaChartContext);
  if (!ctx) {
    throw new Error("AreaChart components must be used within AreaChart.Root");
  }
  return ctx;
}

function useAreaChart() {
  const baseCtx = useBaseChart();
  const areaCtx = useAreaChartData();
  return { ...baseCtx, ...areaCtx };
}

// ============================================================================
// Shaders
// ============================================================================

const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec4 a_color;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

varying vec4 v_color;

void main() {
  vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
  vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
  clipSpace.y *= -1.0;

  gl_Position = vec4(clipSpace, 0.0, 1.0);
  v_color = a_color;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
}
`;

const WGSL_SHADER = `
struct VertexInput {
  @location(0) position: vec2f,
  @location(1) color: vec4f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

struct Uniforms {
  resolution: vec2f,
  transform: mat3x3f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  let transformed = uniforms.transform * vec3f(input.position, 1.0);
  var clipSpace = (transformed.xy / uniforms.resolution) * 2.0 - 1.0;
  clipSpace.y *= -1.0;

  output.position = vec4f(clipSpace, 0.0, 1.0);
  output.color = input.color;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return input.color;
}
`;

// ============================================================================
// Area Renderers
// ============================================================================

interface AreaRendererProps extends RendererProps {
  series: Series[];
  stacked: boolean;
}

// Helper function to create area geometry
function createAreaGeometry(
  points: Point[],
  xScale: (x: number) => number,
  yScale: (y: number) => number,
  color: [number, number, number],
  fillOpacity: number,
  baseline: number,
  previousY?: (x: number) => number
) {
  const positions: number[] = [];
  const colors: number[] = [];

  if (points.length < 2) return { positions, colors };

  // Create filled area using triangle strip
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const x1 = xScale(p1.x);
    const y1 = yScale(p1.y);
    const x2 = xScale(p2.x);
    const y2 = yScale(p2.y);

    const baseY1 = previousY ? yScale(previousY(p1.x)) : yScale(baseline);
    const baseY2 = previousY ? yScale(previousY(p2.x)) : yScale(baseline);

    // Two triangles per segment
    positions.push(x1, y1, x2, y2, x1, baseY1, x2, y2, x2, baseY2, x1, baseY1);

    // Semi-transparent fill
    for (let j = 0; j < 6; j++) {
      colors.push(...color, fillOpacity);
    }
  }

  return { positions, colors };
}

// Helper function to create line geometry
function createLineGeometry(
  points: Point[],
  xScale: (x: number) => number,
  yScale: (y: number) => number,
  color: [number, number, number],
  lineWidth: number
) {
  const positions: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const x1 = xScale(p1.x);
    const y1 = yScale(p1.y);
    const x2 = xScale(p2.x);
    const y2 = yScale(p2.y);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;

    positions.push(x1, y1, x2, y2, x1, y1);
    positions.push(x2, y2, x1, y1, x2, y2);

    const normals = [-nx, -ny, -nx, -ny, nx, ny, -nx, -ny, nx, ny, nx, ny];

    // Create offset vertices for line width
    for (let j = 0; j < 6; j++) {
      const idx = j * 2;
      const vx = positions[positions.length - 12 + idx];
      const vy = positions[positions.length - 11 + idx];
      positions[positions.length - 12 + idx] = vx + normals[idx] * lineWidth * 0.5;
      positions[positions.length - 11 + idx] = vy + normals[idx + 1] * lineWidth * 0.5;
      colors.push(...color, 1.0);
    }
  }

  return { positions, colors };
}

// Helper function to create grid geometry
function createGridGeometry(
  xTicks: number[],
  yTicks: number[],
  xScale: (x: number) => number,
  yScale: (y: number) => number,
  width: number,
  height: number
) {
  const positions: number[] = [];
  const colors: number[] = [];

  const isDark = document.documentElement.classList.contains("dark");
  const gridColor: [number, number, number] = isDark ? [0.4, 0.4, 0.4] : [0.6, 0.6, 0.6];

  // Vertical grid lines
  for (const tick of xTicks) {
    const x = xScale(tick);
    positions.push(x, 0, x + 1, 0, x, height, x + 1, 0, x + 1, height, x, height);
    for (let i = 0; i < 6; i++) {
      colors.push(...gridColor, 0.2);
    }
  }

  // Horizontal grid lines
  for (const tick of yTicks) {
    const y = yScale(tick);
    positions.push(0, y, width, y, 0, y + 1, width, y, width, y + 1, 0, y + 1);
    for (let i = 0; i < 6; i++) {
      colors.push(...gridColor, 0.2);
    }
  }

  return { positions, colors };
}

// Factory function to create WebGL area renderer
function createWebGLAreaRenderer(canvas: HTMLCanvasElement): WebGLRenderer<AreaRendererProps> {
  const buffers = {
    position: null as WebGLBuffer | null,
    color: null as WebGLBuffer | null,
  };

  const renderer = createWebGLRenderer<AreaRendererProps>({
    canvas,
    createShaders: () => ({
      vertexSource: VERTEX_SHADER,
      fragmentSource: FRAGMENT_SHADER,
    }),
    onRender: (gl, program, props) => {
      const { series, xDomain, yDomain, width, height, margin, showGrid, xTicks, yTicks, stacked } =
        props;

      // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL method
      gl.useProgram(program);

      const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
      gl.uniform2f(resolutionLoc, width, height);

      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const matrix = [1, 0, 0, 0, 1, 0, margin.left, margin.top, 1];
      const matrixLoc = gl.getUniformLocation(program, "u_matrix");
      gl.uniformMatrix3fv(matrixLoc, false, matrix);

      const xScale = (x: number) => ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
      const yScale = (y: number) => ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
      const yScaleFlipped = (y: number) => innerHeight - yScale(y);

      // Draw grid if enabled
      if (showGrid) {
        const gridGeometry = createGridGeometry(
          xTicks,
          yTicks,
          xScale,
          yScaleFlipped,
          innerWidth,
          innerHeight
        );

        if (gridGeometry.positions.length > 0) {
          if (!buffers.position) buffers.position = gl.createBuffer();
          if (!buffers.color) buffers.color = gl.createBuffer();

          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridGeometry.positions), gl.STATIC_DRAW);
          const positionLoc = gl.getAttribLocation(program, "a_position");
          gl.enableVertexAttribArray(positionLoc);
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridGeometry.colors), gl.STATIC_DRAW);
          const colorLoc = gl.getAttribLocation(program, "a_color");
          gl.enableVertexAttribArray(colorLoc);
          gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.TRIANGLES, 0, gridGeometry.positions.length / 2);
        }
      }

      // Track cumulative Y values for stacking
      const cumulativeY = new Map<number, number>();

      // Draw filled areas
      for (const s of series) {
        if (s.data.length < 2) continue;

        const color = hexToRgb(s.color || "#3b82f6");
        const fillOpacity = s.fillOpacity ?? 0.3;
        const baseline = Math.max(yDomain[0], s.baseline ?? yDomain[0]);

        // Get previous Y function for stacking
        const previousY = stacked
          ? (x: number) => {
              const prev = cumulativeY.get(x) ?? baseline;
              return prev;
            }
          : undefined;

        // Draw filled area
        const areaGeometry = createAreaGeometry(
          s.data,
          xScale,
          yScaleFlipped,
          color,
          fillOpacity,
          baseline,
          previousY
        );

        if (areaGeometry.positions.length > 0) {
          if (!buffers.position) buffers.position = gl.createBuffer();
          if (!buffers.color) buffers.color = gl.createBuffer();

          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(areaGeometry.positions), gl.STATIC_DRAW);
          const positionLoc = gl.getAttribLocation(program, "a_position");
          gl.enableVertexAttribArray(positionLoc);
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(areaGeometry.colors), gl.STATIC_DRAW);
          const colorLoc = gl.getAttribLocation(program, "a_color");
          gl.enableVertexAttribArray(colorLoc);
          gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.TRIANGLES, 0, areaGeometry.positions.length / 2);
        }

        // Update cumulative Y for stacking
        if (stacked) {
          for (const point of s.data) {
            const current = cumulativeY.get(point.x) ?? baseline;
            cumulativeY.set(point.x, current + point.y - baseline);
          }
        }
      }

      // Draw lines on top of areas
      for (const s of series) {
        if (s.data.length < 2) continue;

        const color = hexToRgb(s.color || "#3b82f6");
        const strokeWidth = s.strokeWidth || 2;

        const lineGeometry = createLineGeometry(s.data, xScale, yScaleFlipped, color, strokeWidth);

        if (lineGeometry.positions.length > 0) {
          if (!buffers.position) buffers.position = gl.createBuffer();
          if (!buffers.color) buffers.color = gl.createBuffer();

          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineGeometry.positions), gl.STATIC_DRAW);
          const positionLoc = gl.getAttribLocation(program, "a_position");
          gl.enableVertexAttribArray(positionLoc);
          gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineGeometry.colors), gl.STATIC_DRAW);
          const colorLoc = gl.getAttribLocation(program, "a_color");
          gl.enableVertexAttribArray(colorLoc);
          gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

          gl.drawArrays(gl.TRIANGLES, 0, lineGeometry.positions.length / 2);
        }
      }
    },
    onDestroy: (gl) => {
      if (buffers.position) gl.deleteBuffer(buffers.position);
      if (buffers.color) gl.deleteBuffer(buffers.color);
    },
  });

  return renderer;
}

// Factory function to create WebGPU area renderer
function createWebGPUAreaRenderer(
  canvas: HTMLCanvasElement,
  device: GPUDevice
): WebGPURenderer<AreaRendererProps> {
  const shaderModule = device.createShaderModule({ code: WGSL_SHADER });

  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" as GPUBufferBindingType },
      },
    ],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  // Persistent buffers for grid rendering (reused across frames)
  const gridBuffers = {
    position: null as GPUBuffer | null,
    color: null as GPUBuffer | null,
  };

  // Persistent buffer pools for series rendering (reused across frames)
  type SeriesBufferSet = {
    position: GPUBuffer;
    color: GPUBuffer;
    sizes: {
      position: number;
      color: number;
    };
  };
  const areaBufferPool: SeriesBufferSet[] = []; // For area fills
  const lineBufferPool: SeriesBufferSet[] = []; // For stroke lines

  const renderer = createWebGPURenderer<AreaRendererProps>({
    canvas,
    device,
    createPipeline: (device, format) => {
      return device.createRenderPipeline({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [bindGroupLayout],
        }),
        vertex: {
          module: shaderModule,
          entryPoint: "vertexMain",
          buffers: [
            {
              arrayStride: 8,
              attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
            },
            {
              arrayStride: 16,
              attributes: [{ shaderLocation: 1, offset: 0, format: "float32x4" }],
            },
          ],
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fragmentMain",
          targets: [
            {
              format,
              blend: {
                color: {
                  srcFactor: "src-alpha",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add",
                },
                alpha: {
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add",
                },
              },
            },
          ],
        },
        primitive: { topology: "triangle-list" },
      });
    },
    onRender: async (device, context, pipeline, props) => {
      const { series, xDomain, yDomain, width, height, margin, stacked } = props;

      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const uniformData = new Float32Array([
        width,
        height,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        margin.left,
        margin.top,
        1,
        0,
      ]);
      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      const xScale = (x: number) => ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
      const yScale = (y: number) => ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
      const yScaleFlipped = (y: number) => innerHeight - yScale(y);

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();

      const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });

      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, bindGroup);

      const cumulativeY = new Map<number, number>();

      // Draw areas with buffer pooling
      let areaIndex = 0;
      for (const s of series) {
        if (s.data.length < 2) continue;

        const color = hexToRgb(s.color || "#3b82f6");
        const fillOpacity = s.fillOpacity ?? 0.3;
        const baseline = Math.max(yDomain[0], s.baseline ?? yDomain[0]);

        const previousY = stacked ? (x: number) => cumulativeY.get(x) ?? baseline : undefined;

        const areaGeometry = createAreaGeometry(
          s.data,
          xScale,
          yScaleFlipped,
          color,
          fillOpacity,
          baseline,
          previousY
        );

        if (areaGeometry.positions.length > 0) {
          const requiredSizes = {
            position: areaGeometry.positions.length * 4,
            color: areaGeometry.colors.length * 4,
          };

          // Get or create buffer set for this area
          let bufferSet = areaBufferPool[areaIndex];

          if (!bufferSet) {
            // Create new buffer set
            bufferSet = {
              position: device.createBuffer({
                size: requiredSizes.position,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
              }),
              color: device.createBuffer({
                size: requiredSizes.color,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
              }),
              sizes: requiredSizes,
            };
            areaBufferPool[areaIndex] = bufferSet;
          } else {
            // Resize buffers if needed
            if (bufferSet.sizes.position < requiredSizes.position) {
              bufferSet.position.destroy();
              bufferSet.position = device.createBuffer({
                size: requiredSizes.position,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
              });
              bufferSet.sizes.position = requiredSizes.position;
            }
            if (bufferSet.sizes.color < requiredSizes.color) {
              bufferSet.color.destroy();
              bufferSet.color = device.createBuffer({
                size: requiredSizes.color,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
              });
              bufferSet.sizes.color = requiredSizes.color;
            }
          }

          // Write data to buffers (reusing existing buffers)
          device.queue.writeBuffer(bufferSet.position, 0, new Float32Array(areaGeometry.positions));
          device.queue.writeBuffer(bufferSet.color, 0, new Float32Array(areaGeometry.colors));

          passEncoder.setVertexBuffer(0, bufferSet.position);
          passEncoder.setVertexBuffer(1, bufferSet.color);
          passEncoder.draw(areaGeometry.positions.length / 2);
          areaIndex++;
        }

        if (stacked) {
          for (const point of s.data) {
            const current = cumulativeY.get(point.x) ?? baseline;
            cumulativeY.set(point.x, current + point.y - baseline);
          }
        }
      }

      // Clean up excess area buffers if series count decreased
      while (areaBufferPool.length > areaIndex) {
        const removed = areaBufferPool.pop();
        if (removed) {
          removed.position.destroy();
          removed.color.destroy();
        }
      }

      // Draw lines with buffer pooling
      let lineIndex = 0;
      for (const s of series) {
        if (s.data.length < 2) continue;

        const color = hexToRgb(s.color || "#3b82f6");
        const strokeWidth = s.strokeWidth || 2;

        const lineGeometry = createLineGeometry(s.data, xScale, yScaleFlipped, color, strokeWidth);

        if (lineGeometry.positions.length > 0) {
          const requiredSizes = {
            position: lineGeometry.positions.length * 4,
            color: lineGeometry.colors.length * 4,
          };

          // Get or create buffer set for this line
          let bufferSet = lineBufferPool[lineIndex];

          if (!bufferSet) {
            // Create new buffer set
            bufferSet = {
              position: device.createBuffer({
                size: requiredSizes.position,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
              }),
              color: device.createBuffer({
                size: requiredSizes.color,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
              }),
              sizes: requiredSizes,
            };
            lineBufferPool[lineIndex] = bufferSet;
          } else {
            // Resize buffers if needed
            if (bufferSet.sizes.position < requiredSizes.position) {
              bufferSet.position.destroy();
              bufferSet.position = device.createBuffer({
                size: requiredSizes.position,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
              });
              bufferSet.sizes.position = requiredSizes.position;
            }
            if (bufferSet.sizes.color < requiredSizes.color) {
              bufferSet.color.destroy();
              bufferSet.color = device.createBuffer({
                size: requiredSizes.color,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
              });
              bufferSet.sizes.color = requiredSizes.color;
            }
          }

          // Write data to buffers (reusing existing buffers)
          device.queue.writeBuffer(bufferSet.position, 0, new Float32Array(lineGeometry.positions));
          device.queue.writeBuffer(bufferSet.color, 0, new Float32Array(lineGeometry.colors));

          passEncoder.setVertexBuffer(0, bufferSet.position);
          passEncoder.setVertexBuffer(1, bufferSet.color);
          passEncoder.draw(lineGeometry.positions.length / 2);
          lineIndex++;
        }
      }

      // Clean up excess line buffers if series count decreased
      while (lineBufferPool.length > lineIndex) {
        const removed = lineBufferPool.pop();
        if (removed) {
          removed.position.destroy();
          removed.color.destroy();
        }
      }

      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);
    },
    onDestroy: () => {
      uniformBuffer.destroy();
      // Clean up grid buffers
      gridBuffers.position?.destroy();
      gridBuffers.color?.destroy();
      // Clean up area buffer pool
      for (const bufferSet of areaBufferPool) {
        bufferSet.position.destroy();
        bufferSet.color.destroy();
      }
      areaBufferPool.length = 0;
      // Clean up line buffer pool
      for (const bufferSet of lineBufferPool) {
        bufferSet.position.destroy();
        bufferSet.color.destroy();
      }
      lineBufferPool.length = 0;
    },
  });

  return renderer;
}

// ============================================================================
// Area Chart Components
// ============================================================================

function Root({
  series,
  xAxis = {},
  yAxis = {},
  width = 800,
  height = 400,
  preferWebGPU = true,
  stacked = false,
  className,
  children,
}: {
  series: Series[];
  xAxis?: {
    label?: string;
    domain?: [number, number] | "auto";
    formatter?: (value: number) => string;
  };
  yAxis?: {
    label?: string;
    domain?: [number, number] | "auto";
    formatter?: (value: number) => string;
  };
  width?: number | string;
  height?: number | string;
  preferWebGPU?: boolean;
  stacked?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const allPoints = series.flatMap((s) => s.data);

  const xDomain: [number, number] =
    xAxis.domain === "auto" || !xAxis.domain ? getDomain(allPoints, (p) => p.x) : xAxis.domain;
  const yDomain: [number, number] =
    yAxis.domain === "auto" || !yAxis.domain ? getDomain(allPoints, (p) => p.y) : yAxis.domain;

  return (
    <ChartRoot
      width={width}
      height={height}
      xAxis={xAxis}
      yAxis={yAxis}
      xDomain={xDomain}
      yDomain={yDomain}
      preferWebGPU={preferWebGPU}
      className={className}
    >
      <AreaChartContext.Provider value={{ series, stacked }}>{children}</AreaChartContext.Provider>
    </ChartRoot>
  );
}

function Canvas({ showGrid = false }: { showGrid?: boolean }) {
  const ctx = useAreaChart();
  const rendererRef = useRef<
    WebGLRenderer<AreaRendererProps> | WebGPURenderer<AreaRendererProps> | null
  >(null);
  const [rendererReady, setRendererReady] = useState(false);

  // Initialize renderer once
  useEffect(() => {
    const canvas = ctx.canvasRef.current;
    if (!canvas) return;

    const dpr = ctx.devicePixelRatio;
    canvas.width = ctx.width * dpr;
    canvas.height = ctx.height * dpr;
    canvas.style.width = `${ctx.width}px`;
    canvas.style.height = `${ctx.height}px`;

    let mounted = true;
    setRendererReady(false);

    async function initRenderer() {
      if (!canvas) return;

      try {
        if (ctx.preferWebGPU && "gpu" in navigator) {
          const adapter = await navigator.gpu?.requestAdapter();
          if (adapter) {
            const device = await adapter.requestDevice();
            const renderer = createWebGPUAreaRenderer(canvas, device);

            if (!mounted) {
              renderer.destroy();
              return;
            }

            rendererRef.current = renderer;
            ctx.setRenderMode("webgpu");
            setRendererReady(true);
            return;
          }
        }
      } catch (error) {
        console.warn("WebGPU failed, falling back to WebGL:", error);
      }

      try {
        const renderer = createWebGLAreaRenderer(canvas);

        if (!mounted) {
          renderer.destroy();
          return;
        }

        rendererRef.current = renderer;
        ctx.setRenderMode("webgl");
        setRendererReady(true);
      } catch (error) {
        console.error("WebGL failed:", error);
      }
    }

    initRenderer();

    return () => {
      mounted = false;
      setRendererReady(false);
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [
    ctx.preferWebGPU,
    ctx.width,
    ctx.height,
    ctx.devicePixelRatio,
    ctx.canvasRef,
    ctx.setRenderMode,
  ]);

  // Render when data changes (skip if not visible)
  useEffect(() => {
    const canvas = ctx.canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer || !ctx.renderMode || !rendererReady || !ctx.isVisible) return;

    const dpr = ctx.devicePixelRatio;
    let rafId: number | null = null;
    let rendering = false;

    async function render() {
      if (rendering) return;
      rendering = true;

      const currentRenderer = rendererRef.current;
      const currentCanvas = ctx.canvasRef.current;
      if (!currentRenderer || !currentCanvas) {
        rendering = false;
        return;
      }

      const renderProps = {
        canvas: currentCanvas,
        series: ctx.series,
        xDomain: ctx.xDomain,
        yDomain: ctx.yDomain,
        xTicks: ctx.xTicks,
        yTicks: ctx.yTicks,
        width: ctx.width * dpr,
        height: ctx.height * dpr,
        margin: {
          top: ctx.margin.top * dpr,
          right: ctx.margin.right * dpr,
          bottom: ctx.margin.bottom * dpr,
          left: ctx.margin.left * dpr,
        },
        showGrid,
        stacked: ctx.stacked,
      };

      await currentRenderer.render(renderProps);

      rendering = false;
    }

    // Use RAF to sync with browser repaint
    rafId = requestAnimationFrame(() => render());

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    ctx.series,
    ctx.xDomain,
    ctx.yDomain,
    ctx.xTicks,
    ctx.yTicks,
    ctx.width,
    ctx.height,
    ctx.margin,
    ctx.devicePixelRatio,
    ctx.renderMode,
    ctx.canvasRef,
    ctx.isVisible,
    ctx.stacked,
    showGrid,
    rendererReady,
  ]);

  return (
    <canvas
      ref={ctx.canvasRef}
      className="absolute inset-0"
      style={{
        width: `${ctx.width}px`,
        height: `${ctx.height}px`,
      }}
    />
  );
}

function Tooltip() {
  const ctx = useAreaChart();

  const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x < ctx.margin.left ||
      x > ctx.width - ctx.margin.right ||
      y < ctx.margin.top ||
      y > ctx.height - ctx.margin.bottom
    ) {
      ctx.setHoveredPoint(null);
      ctx.setTooltipData(null);
      return;
    }

    let closestDist = Infinity;
    let closestSeriesIdx = -1;
    let closestPoint: Point | undefined;
    let closestScreenX = 0;
    let closestScreenY = 0;

    ctx.series.forEach((s: Series, seriesIdx: number) => {
      s.data.forEach((point: Point) => {
        const px = ctx.xScale(point.x);
        const py = ctx.yScale(point.y);
        const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);

        if (dist < 50 && dist < closestDist) {
          closestDist = dist;
          closestSeriesIdx = seriesIdx;
          closestPoint = { ...point };
          closestScreenX = px;
          closestScreenY = py;
        }
      });
    });

    if (closestSeriesIdx !== -1 && closestPoint) {
      const point = closestPoint; // Create const for proper type narrowing
      const currentX = (ctx.hoveredPoint?.data as { xValue?: number })?.xValue;
      const currentSeriesIdx = ctx.hoveredPoint?.seriesIdx;

      // Calculate adaptive threshold
      const domainRange = ctx.xDomain[1] - ctx.xDomain[0];
      const threshold = domainRange * 0.001;

      // Only update if the hovered point has changed
      if (
        currentX === undefined ||
        currentSeriesIdx !== closestSeriesIdx ||
        Math.abs(currentX - point.x) > threshold
      ) {
        const series = ctx.series[closestSeriesIdx];
        const xFormatter = ctx.xAxis?.formatter;
        const yFormatter = ctx.yAxis?.formatter;

        ctx.setHoveredPoint({
          seriesIdx: closestSeriesIdx,
          pointIdx: 0, // Not used, keeping for backwards compatibility
          screenX: closestScreenX,
          screenY: closestScreenY,
          data: {
            xValue: point.x,
            point: point,
          },
        });

        ctx.setTooltipData({
          title: series.name,
          items: [
            {
              label: "X",
              value: xFormatter ? xFormatter(point.x) : point.x.toFixed(2),
            },
            {
              label: "Y",
              value: yFormatter ? yFormatter(point.y) : point.y.toFixed(2),
              color: series.color,
            },
          ],
        });
      }
    } else {
      if (ctx.hoveredPoint !== null) {
        ctx.setHoveredPoint(null);
        ctx.setTooltipData(null);
      }
    }
  };

  const dot = useMemo(() => {
    const hoveredData = ctx.hoveredPoint?.data as { point?: Point } | undefined;

    if (!hoveredData?.point) return null;

    const point = hoveredData.point;
    const series = ctx?.series[ctx?.hoveredPoint?.seriesIdx ?? 0];

    // Find current position of this point (in case data shifted)
    const currentPoint = series.data.find((p: Point) => Math.abs(p.x - point.x) < 0.0001);

    if (currentPoint) {
      return {
        screenX: ctx.xScale(currentPoint.x),
        screenY: ctx.yScale(currentPoint.y),
        color: series.color || "#3b82f6",
      };
    }
    return null;
  }, [ctx.hoveredPoint, ctx.series, ctx.xScale, ctx.yScale]);

  return (
    <>
      <ChartTooltip onHover={handleHover} />
      {ctx.hoveredPoint && ctx.tooltipData && dot && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: dot.screenX - 6,
            top: dot.screenY - 6,
          }}
        >
          <div
            className="w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900"
            style={{ backgroundColor: dot.color }}
          />
        </div>
      )}
    </>
  );
}

// Separate Grid component for composable API
function Grid() {
  // Grid is now rendered via Canvas with showGrid prop
  // This component exists for API consistency but doesn't render anything
  // The actual grid rendering happens in Canvas when showGrid={true}
  return null;
}

// ============================================================================
// Composed Component (Simple API)
// ============================================================================

export function AreaChart({
  series,
  xAxis = {},
  yAxis = {},
  width = 800,
  height = 400,
  showGrid = true,
  showAxes = true,
  showTooltip = false,
  preferWebGPU = true,
  stacked = false,
  className,
}: AreaChartProps) {
  return (
    <Root
      series={series}
      xAxis={xAxis}
      yAxis={yAxis}
      width={width}
      height={height}
      preferWebGPU={preferWebGPU}
      stacked={stacked}
      className={className}
    >
      <Canvas showGrid={showGrid} />
      {showAxes && <ChartAxes />}
      {showTooltip && <Tooltip />}
    </Root>
  );
}

// ============================================================================
// Primitive API (Composable)
// ============================================================================

/**
 * AreaChart Primitives - Composable chart components for custom layouts
 *
 * @example Simple usage (monolithic)
 * ```tsx
 * <AreaChart series={data} showGrid showAxes showTooltip />
 * ```
 *
 * @example Advanced usage (composable)
 * ```tsx
 * <AreaChart.Root series={data} stacked width={800} height={400}>
 *   <AreaChart.Canvas showGrid />
 *   <AreaChart.Axes />
 *   <AreaChart.Tooltip />
 * </AreaChart.Root>
 * ```
 */
AreaChart.Root = Root;
AreaChart.Canvas = Canvas;
AreaChart.Grid = Grid;
AreaChart.Axes = ChartAxes;
AreaChart.Tooltip = Tooltip;

export interface AreaChartRootProps {
  series: Series[];
  xAxis?: {
    label?: string;
    domain?: [number, number] | "auto";
    formatter?: (value: number) => string;
  };
  yAxis?: {
    label?: string;
    domain?: [number, number] | "auto";
    formatter?: (value: number) => string;
  };
  width?: number;
  height?: number;
  preferWebGPU?: boolean;
  stacked?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface AreaChartCanvasProps {
  showGrid?: boolean;
}
AreaChart.displayName = "AreaChart";

export default AreaChart;
