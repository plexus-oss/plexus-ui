/**
 * Unified WebGL/WebGPU renderer for line, area, bar, and scatter charts.
 *
 * Instead of 4 separate renderer factories with duplicated buffer management,
 * shader setup, and render loops, this single renderer dispatches geometry
 * generation based on chart type.
 */

import {
  createWebGLRenderer,
  createWebGPURenderer,
  hexToRgb,
  type Point,
  type RendererProps,
  type WebGLRenderer,
  type WebGPURenderer,
} from "./base-chart";
import { createAreaGeometry } from "./geometry/area";
import { createBarGeometry } from "./geometry/bar";
import { createGridGeometry } from "./geometry/grid";
import { createLineGeometry, createSimpleLineGeometry } from "./geometry/line";
import { createPointGeometry, createPointGeometryQuads } from "./geometry/scatter";
import {
  LINE_VERTEX_SHADER,
  LINE_WGSL_SHADER,
  SCATTER_FRAGMENT_SHADER,
  SCATTER_VERTEX_SHADER,
  SCATTER_WGSL_SHADER,
  STANDARD_FRAGMENT_SHADER,
  STANDARD_VERTEX_SHADER,
  STANDARD_WGSL_SHADER,
} from "./shaders";

// ============================================================================
// Types
// ============================================================================

export interface UnifiedSeries {
  name: string;
  data: Point[];
  color?: string;
  strokeWidth?: number;
  // Area-specific
  fillOpacity?: number;
  baseline?: number;
  // Scatter-specific
  pointSize?: number;
  opacity?: number;
}

export interface UnifiedRendererProps extends RendererProps {
  type: "line" | "area" | "bar" | "scatter";
  series: UnifiedSeries[];
  smooth?: boolean;
  // Area
  stacked?: boolean;
  // Bar
  orientation?: "vertical" | "horizontal";
  barWidth?: number;
  grouped?: boolean;
  categoryMap?: Map<string | number, number>;
}

// ============================================================================
// Shared geometry builders (backend-agnostic)
// ============================================================================
//
// The stacking / baseline / grouping math for area and bar is identical across
// the WebGL and WebGPU backends — only the final GPU draw call differs. These
// builders own that math and return plain {positions,colors} draws so the two
// backends can't drift (a fix here applies to both).

type StandardDraw = { positions: number[]; colors: number[] };

/** Fill + (stacked-aware) stroke draws for an area chart, in paint order. */
function buildAreaDraws(
  series: UnifiedSeries[],
  xScale: (x: number) => number,
  yScale: (y: number) => number,
  stacked: boolean | undefined,
  yDomain: [number, number]
): StandardDraw[] {
  const fills: StandardDraw[] = [];
  const cumulativeY = new Map<number, number>();
  // Top-edge data per series for the stroke — stacked tops sum, so the stroke
  // must follow the cumulative top, not the raw value.
  const strokeSeries: Array<{ data: Point[]; color: string; strokeWidth: number }> = [];
  for (const s of series) {
    if (s.data.length < 2) continue;
    const color = hexToRgb(s.color || "#6366f1");
    const baseline = Math.max(yDomain[0], s.baseline ?? yDomain[0]);
    const previousY = stacked ? (x: number) => cumulativeY.get(x) ?? baseline : undefined;
    fills.push(
      createAreaGeometry(s.data, xScale, yScale, color, s.fillOpacity ?? 0.3, baseline, previousY)
    );
    strokeSeries.push({
      data: previousY
        ? s.data.map((p) => ({ x: p.x, y: previousY(p.x) + (p.y - baseline) }))
        : s.data,
      color: s.color || "#6366f1",
      strokeWidth: s.strokeWidth ?? 2,
    });
    if (stacked) {
      for (const p of s.data)
        cumulativeY.set(p.x, (cumulativeY.get(p.x) ?? baseline) + p.y - baseline);
    }
  }
  // Fills first, then strokes along the (possibly stacked) top edge on top.
  const strokes = strokeSeries.map((st) =>
    createSimpleLineGeometry(st.data, xScale, yScale, hexToRgb(st.color), st.strokeWidth)
  );
  return [...fills, ...strokes];
}

interface BarDrawOptions {
  orientation: "vertical" | "horizontal";
  xDomain: [number, number];
  yDomain: [number, number];
  categoryMap?: Map<string | number, number>;
  barWidth?: number;
  grouped: boolean;
  stacked: boolean;
  innerWidth: number;
}

/** Bar draws — baseline-at-zero, stacked / grouped aware. */
function buildBarDraws(
  series: UnifiedSeries[],
  xScale: (x: number) => number,
  yScale: (y: number) => number,
  opts: BarDrawOptions
): StandardDraw[] {
  const catMap = opts.categoryMap || new Map<string | number, number>();
  const bw = opts.barWidth ?? (opts.innerWidth / Math.max(catMap.size, 1)) * 0.6;
  // Bars grow from zero (clamped into the visible domain) so lengths read
  // honestly, rather than from the domain floor.
  const valueDomain = opts.orientation === "vertical" ? opts.yDomain : opts.xDomain;
  const baseValue = Math.max(valueDomain[0], Math.min(valueDomain[1], 0));
  // Stacking accumulates each category's running total; grouped is forced off
  // since stacked bars share one column per category. Multiple series default to
  // grouped (side-by-side) so they don't hide behind each other.
  const cumulative = opts.stacked ? new Map<string | number, number>() : null;
  const effectiveGrouped = opts.stacked ? false : opts.grouped || series.length > 1;
  const draws: StandardDraw[] = [];
  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    if (s.data.length === 0) continue;
    const color = hexToRgb(s.color || "#6366f1");
    const previousTotal = cumulative
      ? (x: string | number) => cumulative.get(x) ?? baseValue
      : undefined;
    draws.push(
      createBarGeometry(
        s.data,
        xScale,
        yScale,
        color,
        bw,
        opts.orientation,
        catMap,
        i,
        series.length,
        effectiveGrouped,
        baseValue,
        previousTotal
      )
    );
    if (cumulative) {
      for (const p of s.data)
        cumulative.set(p.x, (cumulative.get(p.x) ?? baseValue) + (p.y - baseValue));
    }
  }
  return draws;
}

// ============================================================================
// WebGL Renderer
// ============================================================================

export function createUnifiedWebGLRenderer(
  canvas: HTMLCanvasElement
): WebGLRenderer<UnifiedRendererProps> {
  // We need multiple programs since line charts use a different vertex layout
  let lineProgram: WebGLProgram | null = null;
  let standardProgram: WebGLProgram | null = null;
  let scatterProgram: WebGLProgram | null = null;

  const buffers = {
    position: null as WebGLBuffer | null,
    color: null as WebGLBuffer | null,
    normal: null as WebGLBuffer | null,
    width: null as WebGLBuffer | null,
    size: null as WebGLBuffer | null,
  };

  function compileProgram(
    gl: WebGL2RenderingContext,
    vertSrc: string,
    fragSrc: string
  ): WebGLProgram | null {
    const vert = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vert, vertSrc);
    gl.compileShader(vert);
    if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
      console.error("Vertex shader error:", gl.getShaderInfoLog(vert));
      return null;
    }

    const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(frag, fragSrc);
    gl.compileShader(frag);
    if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
      console.error("Fragment shader error:", gl.getShaderInfoLog(frag));
      return null;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  return createWebGLRenderer<UnifiedRendererProps>({
    canvas,
    createShaders: () => ({
      // The base renderer compiles this program; we'll compile additional ones in onRender
      vertexSource: STANDARD_VERTEX_SHADER,
      fragmentSource: STANDARD_FRAGMENT_SHADER,
    }),
    onRender: (gl, defaultProgram, props) => {
      const {
        type,
        series,
        xDomain,
        yDomain,
        width,
        height,
        margin,
        showGrid,
        xTicks,
        yTicks,
        smooth,
        stacked,
        orientation = "vertical",
        barWidth: barWidthProp,
        grouped = false,
        categoryMap,
      } = props;

      // Lazy-init additional programs
      if (!lineProgram)
        lineProgram = compileProgram(gl, LINE_VERTEX_SHADER, STANDARD_FRAGMENT_SHADER);
      if (!standardProgram) standardProgram = defaultProgram;
      if (!scatterProgram)
        scatterProgram = compileProgram(gl, SCATTER_VERTEX_SHADER, SCATTER_FRAGMENT_SHADER);

      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const matrixValues = [1, 0, 0, 0, 1, 0, margin.left, margin.top, 1];

      const xScale = (x: number) => ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
      const yScale = (y: number) => ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
      const yScaleFlipped = (y: number) => innerHeight - yScale(y);

      // Helper: draw with standard program (position + color)
      function drawStandard(geo: { positions: number[]; colors: number[] }) {
        if (geo.positions.length === 0 || !standardProgram) return;
        // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is WebGL
        gl.useProgram(standardProgram);
        gl.uniform2f(gl.getUniformLocation(standardProgram, "u_resolution"), width, height);
        gl.uniformMatrix3fv(
          gl.getUniformLocation(standardProgram, "u_matrix"),
          false,
          matrixValues
        );

        if (!buffers.position) buffers.position = gl.createBuffer();
        if (!buffers.color) buffers.color = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.positions), gl.DYNAMIC_DRAW);
        const pLoc = gl.getAttribLocation(standardProgram, "a_position");
        gl.enableVertexAttribArray(pLoc);
        gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.colors), gl.DYNAMIC_DRAW);
        const cLoc = gl.getAttribLocation(standardProgram, "a_color");
        gl.enableVertexAttribArray(cLoc);
        gl.vertexAttribPointer(cLoc, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, geo.positions.length / 2);
      }

      // Helper: draw with line program (position + color + normal + width)
      function drawLine(geo: {
        positions: number[];
        colors: number[];
        normals: number[];
        widths: number[];
      }) {
        if (geo.positions.length === 0 || !lineProgram) return;
        // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is WebGL
        gl.useProgram(lineProgram);
        gl.uniform2f(gl.getUniformLocation(lineProgram, "u_resolution"), width, height);
        gl.uniformMatrix3fv(gl.getUniformLocation(lineProgram, "u_matrix"), false, matrixValues);

        if (!buffers.position) buffers.position = gl.createBuffer();
        if (!buffers.color) buffers.color = gl.createBuffer();
        if (!buffers.normal) buffers.normal = gl.createBuffer();
        if (!buffers.width) buffers.width = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.positions), gl.DYNAMIC_DRAW);
        const pLoc = gl.getAttribLocation(lineProgram, "a_position");
        gl.enableVertexAttribArray(pLoc);
        gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.colors), gl.DYNAMIC_DRAW);
        const cLoc = gl.getAttribLocation(lineProgram, "a_color");
        gl.enableVertexAttribArray(cLoc);
        gl.vertexAttribPointer(cLoc, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.normals), gl.DYNAMIC_DRAW);
        const nLoc = gl.getAttribLocation(lineProgram, "a_normal");
        gl.enableVertexAttribArray(nLoc);
        gl.vertexAttribPointer(nLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.width);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.widths), gl.DYNAMIC_DRAW);
        const wLoc = gl.getAttribLocation(lineProgram, "a_width");
        gl.enableVertexAttribArray(wLoc);
        gl.vertexAttribPointer(wLoc, 1, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, geo.positions.length / 2);
      }

      // Helper: draw scatter points
      function drawScatter(geo: { positions: number[]; colors: number[]; sizes: number[] }) {
        if (geo.positions.length === 0 || !scatterProgram) return;
        // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is WebGL
        gl.useProgram(scatterProgram);
        gl.uniform2f(gl.getUniformLocation(scatterProgram, "u_resolution"), width, height);
        gl.uniformMatrix3fv(gl.getUniformLocation(scatterProgram, "u_matrix"), false, matrixValues);

        if (!buffers.position) buffers.position = gl.createBuffer();
        if (!buffers.color) buffers.color = gl.createBuffer();
        if (!buffers.size) buffers.size = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.positions), gl.DYNAMIC_DRAW);
        const pLoc = gl.getAttribLocation(scatterProgram, "a_position");
        gl.enableVertexAttribArray(pLoc);
        gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.colors), gl.DYNAMIC_DRAW);
        const cLoc = gl.getAttribLocation(scatterProgram, "a_color");
        gl.enableVertexAttribArray(cLoc);
        gl.vertexAttribPointer(cLoc, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.size);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.sizes), gl.DYNAMIC_DRAW);
        const sLoc = gl.getAttribLocation(scatterProgram, "a_size");
        gl.enableVertexAttribArray(sLoc);
        gl.vertexAttribPointer(sLoc, 1, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.POINTS, 0, geo.positions.length / 2);
      }

      // ── Grid ──
      if (showGrid) {
        drawStandard(
          createGridGeometry(xTicks, yTicks, xScale, yScaleFlipped, innerWidth, innerHeight)
        );
      }

      // ── Dispatch by chart type ──
      switch (type) {
        case "line": {
          for (const s of series) {
            if (s.data.length < 2) continue;
            const color = hexToRgb(s.color || "#6366f1");
            drawLine(
              createLineGeometry(s.data, xScale, yScaleFlipped, color, s.strokeWidth ?? 2, smooth)
            );
          }
          break;
        }
        case "area": {
          for (const geo of buildAreaDraws(series, xScale, yScaleFlipped, stacked, yDomain)) {
            drawStandard(geo);
          }
          break;
        }
        case "bar": {
          const barDraws = buildBarDraws(series, xScale, yScaleFlipped, {
            orientation,
            xDomain,
            yDomain,
            categoryMap,
            barWidth: barWidthProp,
            grouped,
            stacked: !!stacked,
            innerWidth,
          });
          for (const geo of barDraws) drawStandard(geo);
          break;
        }
        case "scatter": {
          for (const s of series) {
            if (s.data.length === 0) continue;
            const color = hexToRgb(s.color || "#6366f1");
            drawScatter(
              createPointGeometry(
                s.data,
                xScale,
                yScaleFlipped,
                color,
                s.pointSize ?? 8,
                s.opacity ?? 0.85
              )
            );
          }
          break;
        }
      }
    },
    onDestroy: (gl) => {
      for (const key of Object.keys(buffers) as Array<keyof typeof buffers>) {
        if (buffers[key]) gl.deleteBuffer(buffers[key]);
      }
      if (lineProgram && lineProgram !== standardProgram) gl.deleteProgram(lineProgram);
      if (scatterProgram) gl.deleteProgram(scatterProgram);
    },
  });
}

// ============================================================================
// WebGPU Renderer
// ============================================================================

/**
 * Reuse a vertex buffer across frames instead of allocating a new one per draw.
 * Re-uploads into the existing buffer when it's large enough; only reallocates
 * (with 1.5x headroom) when the data outgrows it. The per-frame create+destroy
 * churn this replaces was the bottleneck behind the 100k-points/60fps path.
 */
function createOrResizeVertexBuffer(
  device: GPUDevice,
  data: Float32Array<ArrayBuffer>,
  oldBuffer?: GPUBuffer
): GPUBuffer {
  if (oldBuffer && oldBuffer.size >= data.byteLength) {
    device.queue.writeBuffer(oldBuffer, 0, data);
    return oldBuffer;
  }
  oldBuffer?.destroy();
  const buffer = device.createBuffer({
    // WebGPU requires the buffer size to be a multiple of 4; `*1.5` can land on
    // an odd value (e.g. 4 → 6), so round the headroom up to the next multiple.
    size: Math.ceil((data.byteLength * 1.5) / 4) * 4,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(buffer, 0, data);
  return buffer;
}

export function createUnifiedWebGPURenderer(
  canvas: HTMLCanvasElement,
  device: GPUDevice
): WebGPURenderer<UnifiedRendererProps> {
  // Shared uniform buffer
  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Vertex buffers persist across frames, keyed by their position in the draw
  // sequence. Each frame resets the index and reuses (resizing as needed) the
  // buffer from the prior frame's draw at that position — no per-frame alloc.
  const vertexBufferPool: GPUBuffer[] = [];

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

  // Create pipelines lazily
  let standardPipeline: GPURenderPipeline | null = null;
  let linePipeline: GPURenderPipeline | null = null;
  let scatterPipeline: GPURenderPipeline | null = null;
  let format: GPUTextureFormat | null = null;

  function getFormat() {
    if (!format) format = navigator.gpu.getPreferredCanvasFormat();
    return format;
  }

  function getStandardPipeline() {
    if (!standardPipeline) {
      const shaderModule = device.createShaderModule({
        code: STANDARD_WGSL_SHADER,
      });
      standardPipeline = device.createRenderPipeline({
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
              format: getFormat(),
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
    }
    return standardPipeline;
  }

  function getLinePipeline() {
    if (!linePipeline) {
      const shaderModule = device.createShaderModule({
        code: LINE_WGSL_SHADER,
      });
      linePipeline = device.createRenderPipeline({
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
            {
              arrayStride: 8,
              attributes: [{ shaderLocation: 2, offset: 0, format: "float32x2" }],
            },
            {
              arrayStride: 4,
              attributes: [{ shaderLocation: 3, offset: 0, format: "float32" }],
            },
          ],
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fragmentMain",
          targets: [
            {
              format: getFormat(),
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
    }
    return linePipeline;
  }

  function getScatterPipeline() {
    if (!scatterPipeline) {
      const shaderModule = device.createShaderModule({
        code: SCATTER_WGSL_SHADER,
      });
      scatterPipeline = device.createRenderPipeline({
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
            {
              arrayStride: 8,
              attributes: [{ shaderLocation: 2, offset: 0, format: "float32x2" }],
            },
          ],
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fragmentMain",
          targets: [
            {
              format: getFormat(),
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
    }
    return scatterPipeline;
  }

  return createWebGPURenderer<UnifiedRendererProps>({
    canvas,
    device,
    createPipeline: () => getStandardPipeline(),
    onRender: async (device, context, _pipeline, props) => {
      const {
        type,
        series,
        xDomain,
        yDomain,
        width,
        height,
        margin,
        showGrid,
        xTicks,
        yTicks,
        smooth,
        stacked,
        orientation = "vertical",
        barWidth: barWidthProp,
        grouped = false,
        categoryMap,
      } = props;

      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      device.queue.writeBuffer(
        uniformBuffer,
        0,
        new Float32Array([
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
        ])
      );

      const xScale = (x: number) => ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
      const yScale = (y: number) => ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
      const yScaleFlipped = (y: number) => innerHeight - yScale(y);

      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });

      // Clip to plot area. Clamp to non-negative — a chart smaller than its
      // margins yields a negative inner size, which setScissorRect rejects.
      passEncoder.setScissorRect(
        Math.max(0, margin.left),
        Math.max(0, margin.top),
        Math.max(0, innerWidth),
        Math.max(0, innerHeight)
      );

      // Reset the pool cursor each frame; buffers are reused (resized only when
      // data grows) from the matching position in the previous frame's draws.
      let poolIndex = 0;

      function drawGeo(
        pipeline: GPURenderPipeline,
        vertexBuffers: Array<{ data: Float32Array<ArrayBuffer>; slot: number }>,
        vertexCount: number
      ) {
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        for (const vb of vertexBuffers) {
          const buf = createOrResizeVertexBuffer(device, vb.data, vertexBufferPool[poolIndex]);
          vertexBufferPool[poolIndex] = buf;
          poolIndex++;
          passEncoder.setVertexBuffer(vb.slot, buf);
        }
        passEncoder.draw(vertexCount);
      }

      // ── Grid ──
      if (showGrid) {
        const geo = createGridGeometry(
          xTicks,
          yTicks,
          xScale,
          yScaleFlipped,
          innerWidth,
          innerHeight
        );
        if (geo.positions.length > 0) {
          drawGeo(
            getStandardPipeline(),
            [
              { data: new Float32Array(geo.positions), slot: 0 },
              { data: new Float32Array(geo.colors), slot: 1 },
            ],
            geo.positions.length / 2
          );
        }
      }

      // ── Dispatch by type ──
      switch (type) {
        case "line": {
          const pipe = getLinePipeline();
          for (const s of series) {
            if (s.data.length < 2) continue;
            const color = hexToRgb(s.color || "#6366f1");
            const geo = createLineGeometry(
              s.data,
              xScale,
              yScaleFlipped,
              color,
              s.strokeWidth ?? 2,
              smooth
            );
            if (geo.positions.length > 0) {
              drawGeo(
                pipe,
                [
                  { data: new Float32Array(geo.positions), slot: 0 },
                  { data: new Float32Array(geo.colors), slot: 1 },
                  { data: new Float32Array(geo.normals), slot: 2 },
                  { data: new Float32Array(geo.widths), slot: 3 },
                ],
                geo.positions.length / 2
              );
            }
          }
          break;
        }
        case "area": {
          const stdPipe = getStandardPipeline();
          for (const geo of buildAreaDraws(series, xScale, yScaleFlipped, stacked, yDomain)) {
            if (geo.positions.length > 0) {
              drawGeo(
                stdPipe,
                [
                  { data: new Float32Array(geo.positions), slot: 0 },
                  { data: new Float32Array(geo.colors), slot: 1 },
                ],
                geo.positions.length / 2
              );
            }
          }
          break;
        }
        case "bar": {
          const stdPipe = getStandardPipeline();
          const barDraws = buildBarDraws(series, xScale, yScaleFlipped, {
            orientation,
            xDomain,
            yDomain,
            categoryMap,
            barWidth: barWidthProp,
            grouped,
            stacked: !!stacked,
            innerWidth,
          });
          for (const geo of barDraws) {
            if (geo.positions.length > 0) {
              drawGeo(
                stdPipe,
                [
                  { data: new Float32Array(geo.positions), slot: 0 },
                  { data: new Float32Array(geo.colors), slot: 1 },
                ],
                geo.positions.length / 2
              );
            }
          }
          break;
        }
        case "scatter": {
          const pipe = getScatterPipeline();
          for (const s of series) {
            if (s.data.length === 0) continue;
            const color = hexToRgb(s.color || "#6366f1");
            const geo = createPointGeometryQuads(
              s.data,
              xScale,
              yScaleFlipped,
              color,
              s.pointSize ?? 8,
              s.opacity ?? 0.85
            );
            if (geo.positions.length > 0) {
              drawGeo(
                pipe,
                [
                  { data: new Float32Array(geo.positions), slot: 0 },
                  { data: new Float32Array(geo.colors), slot: 1 },
                  { data: new Float32Array(geo.pointCoords), slot: 2 },
                ],
                geo.positions.length / 2
              );
            }
          }
          break;
        }
      }

      passEncoder.end();
      device.queue.submit([commandEncoder.finish()]);
    },
    onDestroy: () => {
      for (const buf of vertexBufferPool) buf.destroy();
      vertexBufferPool.length = 0;
      uniformBuffer.destroy();
    },
  });
}
