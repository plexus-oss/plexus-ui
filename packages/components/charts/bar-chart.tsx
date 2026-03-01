"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
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
// Bar Chart Types
// ============================================================================

export interface DataPoint {
  x: number | string; // Category or numeric value
  y: number;
  label?: string;
}

export interface Series {
  name: string;
  data: DataPoint[];
  color?: string;
}

export interface BarChartProps {
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
  showGrid?: boolean;
  showAxes?: boolean;
  showTooltip?: boolean;
  className?: string;
  preferWebGPU?: boolean;
  orientation?: "vertical" | "horizontal";
  barWidth?: number;
  barGap?: number;
  grouped?: boolean;
}

// Extended context for bar chart
interface BarChartContextType {
  series: Series[];
  orientation: "vertical" | "horizontal";
  barWidth: number;
  barGap: number;
  grouped: boolean;
  categoryMap: Map<string | number, number>; // Map categories to numeric positions
}

const BarChartContext = createContext<BarChartContextType | null>(null);

function useBarChartData() {
  const ctx = useContext(BarChartContext);
  if (!ctx) {
    throw new Error("BarChart components must be used within BarChart.Root");
  }
  return ctx;
}

function useBarChart() {
  const baseCtx = useBaseChart();
  const barCtx = useBarChartData();
  return { ...baseCtx, ...barCtx };
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
// Bar Renderers
// ============================================================================

interface BarRendererProps extends RendererProps {
  series: Series[];
  orientation: "vertical" | "horizontal";
  barWidth: number;
  barGap: number;
  grouped: boolean;
  categoryMap: Map<string | number, number>;
}

// Helper function to create bar geometry
function createBarGeometry(
  points: DataPoint[],
  xScale: (x: number) => number,
  yScale: (y: number) => number,
  color: [number, number, number],
  barWidth: number,
  orientation: "vertical" | "horizontal",
  categoryMap: Map<string | number, number>,
  seriesIndex: number,
  totalSeries: number,
  grouped: boolean,
  baseValue: number
) {
  const positions: number[] = [];
  const colors: number[] = [];

  const effectiveBarWidth = grouped ? barWidth / totalSeries : barWidth;
  const barOffset = grouped ? seriesIndex * effectiveBarWidth : 0;

  for (const point of points) {
    const categoryValue = categoryMap.get(point.x) ?? 0;

    if (orientation === "vertical") {
      const centerX = xScale(categoryValue);
      const x =
        centerX - (grouped ? totalSeries * effectiveBarWidth : effectiveBarWidth) / 2 + barOffset;
      const y0 = yScale(baseValue);
      const y1 = yScale(point.y);
      const width = effectiveBarWidth;

      // Ensure y coordinates are in correct order (y0 at bottom, y1 at top)
      const yTop = Math.min(y0, y1);
      const yBottom = Math.max(y0, y1);

      // Two triangles for rectangle
      positions.push(
        x,
        yBottom,
        x + width,
        yBottom,
        x,
        yTop,
        x + width,
        yBottom,
        x + width,
        yTop,
        x,
        yTop
      );
    } else {
      const centerY = yScale(categoryValue);
      const y =
        centerY - (grouped ? totalSeries * effectiveBarWidth : effectiveBarWidth) / 2 + barOffset;
      const x0 = xScale(baseValue);
      const x1 = xScale(point.y);
      const height = effectiveBarWidth;

      // Ensure x coordinates are in correct order (left to right)
      const xLeft = Math.min(x0, x1);
      const xRight = Math.max(x0, x1);

      positions.push(
        xLeft,
        y,
        xRight,
        y,
        xLeft,
        y + height,
        xRight,
        y,
        xRight,
        y + height,
        xLeft,
        y + height
      );
    }

    // Colors for 6 vertices
    for (let i = 0; i < 6; i++) {
      colors.push(...color, 0.85);
    }
  }

  return { positions, colors };
}

// Factory function to create WebGL bar renderer
function createWebGLBarRenderer(canvas: HTMLCanvasElement): WebGLRenderer<BarRendererProps> {
  const buffers = {
    position: null as WebGLBuffer | null,
    color: null as WebGLBuffer | null,
  };

  const renderer = createWebGLRenderer<BarRendererProps>({
    canvas,
    createShaders: () => ({
      vertexSource: VERTEX_SHADER,
      fragmentSource: FRAGMENT_SHADER,
    }),
    onRender: (gl, program, props) => {
      const {
        series,
        xDomain,
        yDomain,
        width,
        height,
        margin,
        orientation,
        barWidth,
        grouped,
        categoryMap,
      } = props;

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

      const baseValue = orientation === "vertical" ? yDomain[0] : xDomain[0];

      series.forEach((s, seriesIndex) => {
        if (s.data.length === 0) return;

        const color = hexToRgb(s.color || "#3b82f6");
        const geometry = createBarGeometry(
          s.data,
          xScale,
          yScaleFlipped,
          color,
          barWidth,
          orientation,
          categoryMap,
          seriesIndex,
          series.length,
          grouped,
          baseValue
        );

        if (!buffers.position) buffers.position = gl.createBuffer();
        if (!buffers.color) buffers.color = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions), gl.STATIC_DRAW);
        const positionLoc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.colors), gl.STATIC_DRAW);
        const colorLoc = gl.getAttribLocation(program, "a_color");
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, geometry.positions.length / 2);
      });
    },
    onDestroy: (gl) => {
      if (buffers.position) gl.deleteBuffer(buffers.position);
      if (buffers.color) gl.deleteBuffer(buffers.color);
    },
  });

  return renderer;
}

// Factory function to create WebGPU bar renderer
function createWebGPUBarRenderer(
  canvas: HTMLCanvasElement,
  device: GPUDevice
): WebGPURenderer<BarRendererProps> {
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
        buffer: { type: "uniform" },
      },
    ],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  // Persistent buffer pool for series rendering (reused across frames)
  type SeriesBufferSet = {
    position: GPUBuffer;
    color: GPUBuffer;
    sizes: {
      position: number;
      color: number;
    };
  };
  const seriesBufferPool: SeriesBufferSet[] = [];

  const renderer = createWebGPURenderer<BarRendererProps>({
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
      const {
        series,
        xDomain,
        yDomain,
        width,
        height,
        margin,
        orientation,
        barWidth,
        grouped,
        categoryMap,
      } = props;

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

      const baseValue = orientation === "vertical" ? yDomain[0] : xDomain[0];

      // Draw bars with buffer pooling
      let barIndex = 0;
      for (const [seriesIndex, s] of series.entries()) {
        if (s.data.length === 0) continue;

        const color = hexToRgb(s.color || "#3b82f6");
        const geometry = createBarGeometry(
          s.data,
          xScale,
          yScaleFlipped,
          color,
          barWidth,
          orientation,
          categoryMap,
          seriesIndex,
          series.length,
          grouped,
          baseValue
        );

        const requiredSizes = {
          position: geometry.positions.length * 4,
          color: geometry.colors.length * 4,
        };

        // Get or create buffer set for this series
        let bufferSet = seriesBufferPool[barIndex];

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
          seriesBufferPool[barIndex] = bufferSet;
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
        device.queue.writeBuffer(bufferSet.position, 0, new Float32Array(geometry.positions));
        device.queue.writeBuffer(bufferSet.color, 0, new Float32Array(geometry.colors));

        passEncoder.setVertexBuffer(0, bufferSet.position);
        passEncoder.setVertexBuffer(1, bufferSet.color);

        passEncoder.draw(geometry.positions.length / 2);
        barIndex++;
      }

      // Clean up excess buffers if series count decreased
      while (seriesBufferPool.length > barIndex) {
        const removed = seriesBufferPool.pop();
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
      // Clean up series buffer pool
      for (const bufferSet of seriesBufferPool) {
        bufferSet.position.destroy();
        bufferSet.color.destroy();
      }
      seriesBufferPool.length = 0;
    },
  });

  return renderer;
}

// ============================================================================
// Bar Chart Components
// ============================================================================

function Root({
  series,
  xAxis = {},
  yAxis = {},
  width = 800,
  height = 400,
  preferWebGPU = true,
  orientation = "vertical",
  barWidth: barWidthProp,
  barGap = 8,
  grouped = true,
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
  orientation?: "vertical" | "horizontal";
  barWidth?: number;
  barGap?: number;
  grouped?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  // Create category mapping
  const { categoryMap, categoryLabels } = useMemo(() => {
    const map = new Map<string | number, number>();
    const allCategories = new Set<string | number>();

    series.forEach((s: Series) => {
      s.data.forEach((point: DataPoint) => {
        allCategories.add(point.x);
      });
    });

    const sortedCategories = Array.from(allCategories).sort((a, b) => {
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    });

    sortedCategories.forEach((cat: string | number, idx: number) => {
      map.set(cat, idx);
    });

    // Create reverse mapping for labels
    const labels = new Map<number, string>();
    sortedCategories.forEach((cat, idx) => {
      labels.set(idx, String(cat));
    });

    return { categoryMap: map, categoryLabels: labels };
  }, [series]);

  // Calculate responsive bar width based on available space
  const barWidth = useMemo(() => {
    if (barWidthProp !== undefined) {
      // If explicitly provided, use it (but it won't be responsive)
      return barWidthProp;
    }

    // Only calculate responsive barWidth if dimensions are numeric
    // If width/height are strings (e.g., "100%"), use a reasonable default
    const numericWidth = typeof width === "number" ? width : 800;
    const numericHeight = typeof height === "number" ? height : 400;

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const availableSpace =
      orientation === "vertical"
        ? numericWidth - margin.left - margin.right
        : numericHeight - margin.top - margin.bottom;

    const numCategories = categoryMap.size;
    const totalGapSpace = barGap * (numCategories - 1);
    const spaceForBars = availableSpace - totalGapSpace;

    // Calculate max width per category
    const maxBarWidthPerCategory = spaceForBars / numCategories;

    // For grouped bars, divide by number of series
    const calculatedWidth = grouped
      ? maxBarWidthPerCategory / series.length
      : maxBarWidthPerCategory;

    // Cap at reasonable max (80px) and min (20px)
    return Math.max(20, Math.min(80, calculatedWidth * 0.8)); // Use 80% for spacing
  }, [barWidthProp, width, height, orientation, categoryMap.size, barGap, grouped, series.length]);

  // Calculate domains
  const numericPoints: Point[] = series.flatMap((s) =>
    s.data.map((d) => ({ x: categoryMap.get(d.x) ?? 0, y: d.y }))
  );

  const xDomain: [number, number] =
    orientation === "vertical"
      ? [-0.5, categoryMap.size - 0.5] // Categories
      : yAxis.domain === "auto" || !yAxis.domain
        ? (() => {
            const [, max] = getDomain(numericPoints, (p) => p.y);
            return [0, max]; // Force min to 0 for bar charts
          })()
        : yAxis.domain;

  const yDomain: [number, number] =
    orientation === "vertical"
      ? yAxis.domain === "auto" || !yAxis.domain
        ? (() => {
            const [, max] = getDomain(numericPoints, (p) => p.y);
            return [0, max]; // Force min to 0 for bar charts
          })()
        : yAxis.domain
      : [-0.5, categoryMap.size - 0.5];

  // Add category label formatters for categorical axes
  const xAxisWithFormatter =
    orientation === "vertical" && !xAxis.formatter
      ? {
          ...xAxis,
          formatter: (val: number) => categoryLabels.get(Math.round(val)) || "",
        }
      : xAxis;

  const yAxisWithFormatter =
    orientation === "horizontal" && !yAxis.formatter
      ? {
          ...yAxis,
          formatter: (val: number) => categoryLabels.get(Math.round(val)) || "",
        }
      : yAxis;

  // Generate custom ticks for categorical axes (one tick per category)
  const categoryTicks = React.useMemo(() => {
    return Array.from({ length: categoryMap.size }, (_, i) => i);
  }, [categoryMap.size]);

  const xTicksCustom = orientation === "vertical" ? categoryTicks : undefined;
  const yTicksCustom = orientation === "horizontal" ? categoryTicks : undefined;

  return (
    <ChartRoot
      width={width}
      height={height}
      xAxis={xAxisWithFormatter}
      yAxis={yAxisWithFormatter}
      xDomain={xDomain}
      yDomain={yDomain}
      xTicks={xTicksCustom}
      yTicks={yTicksCustom}
      preferWebGPU={preferWebGPU}
      className={className}
    >
      <BarChartContext.Provider
        value={{ series, orientation, barWidth, barGap, grouped, categoryMap }}
      >
        {children}
      </BarChartContext.Provider>
    </ChartRoot>
  );
}

function Canvas({ showGrid = false }: { showGrid?: boolean }) {
  const ctx = useBarChart();
  const rendererRef = React.useRef<
    WebGLRenderer<BarRendererProps> | WebGPURenderer<BarRendererProps> | null
  >(null);
  const mountedRef = React.useRef(true);
  const [rendererReady, setRendererReady] = useState(false);

  // Initialize renderer once
  React.useEffect(() => {
    const canvas = ctx.canvasRef.current;
    if (!canvas) return;

    const dpr = ctx.devicePixelRatio;
    canvas.width = ctx.width * dpr;
    canvas.height = ctx.height * dpr;
    canvas.style.width = `${ctx.width}px`;
    canvas.style.height = `${ctx.height}px`;

    mountedRef.current = true;
    setRendererReady(false);

    async function initRenderer() {
      if (!canvas || rendererRef.current) return;

      try {
        if (ctx.preferWebGPU && "gpu" in navigator) {
          const adapter = await navigator.gpu?.requestAdapter();
          if (adapter) {
            const device = await adapter.requestDevice();
            const renderer = createWebGPUBarRenderer(canvas, device);

            if (!mountedRef.current) {
              renderer.destroy();
              return;
            }

            rendererRef.current = renderer;
            ctx.setRenderMode("webgpu");
            setRendererReady(true);

            // Force immediate render after initialization
            requestAnimationFrame(() => {
              if (rendererRef.current && mountedRef.current) {
                const dpr = ctx.devicePixelRatio;
                const renderProps: BarRendererProps = {
                  canvas,
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
                  orientation: ctx.orientation,
                  barWidth: ctx.barWidth * dpr,
                  barGap: ctx.barGap * dpr,
                  grouped: ctx.grouped,
                  categoryMap: ctx.categoryMap,
                };
                rendererRef.current.render(renderProps);
              }
            });
            return;
          }
        }
      } catch (error) {
        console.warn("WebGPU failed, falling back to WebGL:", error);
      }

      try {
        const renderer = createWebGLBarRenderer(canvas);

        if (!mountedRef.current) {
          renderer.destroy();
          return;
        }

        rendererRef.current = renderer;
        ctx.setRenderMode("webgl");
        setRendererReady(true);

        // Force immediate render after initialization
        requestAnimationFrame(() => {
          if (rendererRef.current && mountedRef.current) {
            const dpr = ctx.devicePixelRatio;
            const renderProps: BarRendererProps = {
              canvas,
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
              orientation: ctx.orientation,
              barWidth: ctx.barWidth * dpr,
              barGap: ctx.barGap * dpr,
              grouped: ctx.grouped,
              categoryMap: ctx.categoryMap,
            };
            rendererRef.current.render(renderProps);
          }
        });
      } catch (error) {
        console.error("WebGL failed:", error);
      }
    }

    initRenderer();

    return () => {
      mountedRef.current = false;
      setRendererReady(false);
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [
    ctx.canvasRef,
    ctx.width,
    ctx.height,
    ctx.devicePixelRatio,
    ctx.preferWebGPU,
    ctx.setRenderMode,
    ctx.barGap,
    ctx.barWidth,
    ctx.categoryMap,
    ctx.grouped,
    ctx.margin.bottom,
    ctx.margin.left,
    ctx.margin.right,
    ctx.margin.top,
    ctx.orientation,
    ctx.series,
    ctx.xDomain,
    ctx.xTicks,
    ctx.yDomain,
    ctx.yTicks,
    showGrid,
  ]);

  // Render on data/config changes
  React.useEffect(() => {
    const canvas = ctx.canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer || !rendererReady) return;

    const dpr = ctx.devicePixelRatio;

    const renderProps: BarRendererProps = {
      canvas,
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
      orientation: ctx.orientation,
      barWidth: ctx.barWidth * dpr,
      barGap: ctx.barGap * dpr,
      grouped: ctx.grouped,
      categoryMap: ctx.categoryMap,
    };

    const renderResult = renderer.render(renderProps);
    if (renderResult && "then" in renderResult) {
      // WebGPU renderer (async)
    } else {
      // WebGL renderer (sync)
    }
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
    showGrid,
    ctx.orientation,
    ctx.barWidth,
    ctx.barGap,
    ctx.grouped,
    ctx.categoryMap,
    ctx.canvasRef,
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
  const ctx = useBarChart();

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

    let hoveredSeriesIdx = -1;
    let hoveredPointIdx = -1;
    let hoveredScreenX = 0;
    let hoveredScreenY = 0;

    const effectiveBarWidth = ctx.grouped ? ctx.barWidth / ctx.series.length : ctx.barWidth;

    // Calculate base value based on orientation
    const baseValue = ctx.orientation === "vertical" ? ctx.yDomain[0] : ctx.xDomain[0];

    ctx.series.forEach((s, seriesIdx) => {
      s.data.forEach((point, pointIdx) => {
        const categoryValue = ctx.categoryMap.get(point.x) ?? 0;
        const barOffset = ctx.grouped ? seriesIdx * effectiveBarWidth : 0;

        if (ctx.orientation === "vertical") {
          const centerX = ctx.xScale(categoryValue);
          const barX =
            centerX -
            (ctx.grouped ? ctx.series.length * effectiveBarWidth : effectiveBarWidth) / 2 +
            barOffset;
          const barY0 = ctx.yScale(baseValue);
          const barY1 = ctx.yScale(point.y);
          const barWidth = effectiveBarWidth;

          if (
            x >= barX &&
            x <= barX + barWidth &&
            y >= Math.min(barY0, barY1) &&
            y <= Math.max(barY0, barY1)
          ) {
            hoveredSeriesIdx = seriesIdx;
            hoveredPointIdx = pointIdx;
            hoveredScreenX = barX + barWidth / 2;
            hoveredScreenY = barY1;
          }
        } else {
          const centerY = ctx.yScale(categoryValue);
          const barY =
            centerY -
            (ctx.grouped ? ctx.series.length * effectiveBarWidth : effectiveBarWidth) / 2 +
            barOffset;
          const barX0 = ctx.xScale(baseValue);
          const barX1 = ctx.xScale(point.y);
          const barHeight = effectiveBarWidth;

          if (
            y >= barY &&
            y <= barY + barHeight &&
            x >= Math.min(barX0, barX1) &&
            x <= Math.max(barX0, barX1)
          ) {
            hoveredSeriesIdx = seriesIdx;
            hoveredPointIdx = pointIdx;
            hoveredScreenX = barX1;
            hoveredScreenY = barY + barHeight / 2;
          }
        }
      });
    });

    if (hoveredSeriesIdx !== -1 && hoveredPointIdx !== -1) {
      // Only update if the hovered point has changed
      if (
        !ctx.hoveredPoint ||
        ctx.hoveredPoint.seriesIdx !== hoveredSeriesIdx ||
        ctx.hoveredPoint.pointIdx !== hoveredPointIdx
      ) {
        const hovered = {
          seriesIdx: hoveredSeriesIdx,
          pointIdx: hoveredPointIdx,
          screenX: hoveredScreenX,
          screenY: hoveredScreenY,
        };

        ctx.setHoveredPoint(hovered);
        const series = ctx.series[hoveredSeriesIdx];
        const point = series.data[hoveredPointIdx];

        ctx.setTooltipData({
          title: series.name,
          items: [
            { label: "Category", value: String(point.x) },
            { label: "Value", value: point.y.toFixed(2), color: series.color },
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

  return <ChartTooltip onHover={handleHover} />;
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

export function BarChart({
  series,
  xAxis = {},
  yAxis = {},
  width = 800,
  height = 400,
  showGrid = true,
  showAxes = true,
  showTooltip = false,
  preferWebGPU = true,
  orientation = "vertical",
  barWidth, // Undefined by default - will use responsive calculation
  barGap = 8,
  grouped = true,
  className,
}: BarChartProps) {
  return (
    <Root
      series={series}
      xAxis={xAxis}
      yAxis={yAxis}
      width={width}
      height={height}
      preferWebGPU={preferWebGPU}
      orientation={orientation}
      barWidth={barWidth}
      barGap={barGap}
      grouped={grouped}
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
 * BarChart Primitives - Composable chart components for custom layouts
 *
 * @example Simple usage (monolithic)
 * ```tsx
 * <BarChart series={data} showGrid showAxes showTooltip />
 * ```
 *
 * @example Advanced usage (composable)
 * ```tsx
 * <BarChart.Root series={data} orientation="vertical" width={800} height={400}>
 *   <BarChart.Canvas showGrid />
 *   <BarChart.Axes />
 *   <BarChart.Tooltip />
 * </BarChart.Root>
 * ```
 */
BarChart.Root = Root;
BarChart.Canvas = Canvas;
BarChart.Grid = Grid;
BarChart.Axes = ChartAxes;
BarChart.Tooltip = Tooltip;

export interface BarChartRootProps {
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
  orientation?: "vertical" | "horizontal";
  barWidth?: number;
  barGap?: number;
  grouped?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface BarChartCanvasProps {
  showGrid?: boolean;
}

export default BarChart;
