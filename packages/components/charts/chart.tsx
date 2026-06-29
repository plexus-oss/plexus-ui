"use client";

/**
 * Chart — the config-driven chart component.
 *
 * One component renders line / area / bar / scatter from a flat config object
 * (matching the Plexus frontend's `UnifiedChart`): `showTooltip`, `showLegend`,
 * `referenceLines`, axis config. Pan & zoom are ALWAYS ON — wheel to zoom, drag
 * to pan, shift+drag to brush-zoom, with a "Reset zoom" affordance.
 *
 * @example
 * ```tsx
 * <Chart
 *   type="line"
 *   series={[{ name: "Temp", data, color: "#22c55e" }]}
 *   showTooltip
 *   showLegend
 *   referenceLines={[{ value: 45, severity: "critical", label: "45°C limit" }]}
 * />
 * ```
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type AlertBand, AlertBands } from "./alert-bands";
import { ChartRuler } from "./annotations";
import {
  ChartAxes,
  ChartRoot,
  ChartTooltip,
  formatValue,
  getDomain,
  type Margin,
  type Point,
  useBaseChart,
  type WebGLRenderer,
  type WebGPURenderer,
} from "./base-chart";
import { ChartPanZoom, type ChartPanZoomProps } from "./interactions";
import { type ReferenceLine, ReferenceLines } from "./reference-lines";
import {
  createUnifiedWebGLRenderer,
  createUnifiedWebGPURenderer,
  type UnifiedRendererProps,
  type UnifiedSeries,
} from "./unified-renderer";

// ============================================================================
// Types
// ============================================================================

export type { AlertBand, ReferenceLine, UnifiedSeries };

// Stable defaults so unset props don't create new objects per render,
// which would cascade into every downstream memo's deps and force re-renders.
const EMPTY_AXIS = {};

export type ChartType = "line" | "area" | "bar" | "scatter";

interface AxisConfig {
  label?: string;
  domain?: [number, number] | "auto";
  formatter?: (value: number) => string;
  /** "time" enables quantized time domains + nice clock-aligned tick labels. */
  type?: "number" | "time";
}

/** A data point. `x` may be a category string for bar charts. */
export interface ChartDataPoint {
  x: number | string;
  y: number;
}

/** Input series — like UnifiedSeries but `x` may be categorical (string). */
export interface ChartInputSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  baseline?: number;
  pointSize?: number;
  opacity?: number;
}

export interface ChartProps {
  type: ChartType;
  series: ChartInputSeries[];
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  width?: number | string;
  height?: number | string;
  showGrid?: boolean;
  showAxes?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  smooth?: boolean;
  showDataPoints?: boolean;
  referenceLines?: ReferenceLine[];
  /** Shaded alert/threshold bands along an axis (config, like referenceLines). */
  alertBands?: AlertBand[];
  /** Enable the click-drag measurement ruler. Plain drag measures; pan uses cmd/ctrl+drag. */
  ruler?: boolean;
  className?: string;
  preferWebGPU?: boolean;
  /**
   * Pan & zoom are always on. Use this to tune them (modifiers, bounds, brush)
   * or to hide the reset button. Pass `panZoom={{ enabled: false }}` to opt out.
   */
  panZoom?: ChartPanZoomProps;
  // Area-specific
  stacked?: boolean;
  // Bar-specific
  orientation?: "vertical" | "horizontal";
  barWidth?: number;
  grouped?: boolean;
}

// ============================================================================
// Context
// ============================================================================

interface ChartContextType {
  type: ChartType;
  series: UnifiedSeries[];
  smooth: boolean;
  showDataPoints: boolean;
  stacked: boolean;
  orientation: "vertical" | "horizontal";
  grouped: boolean;
  barWidth?: number;
  /** Category → position index map for categorical (string-x) bar charts. */
  categoryMap?: Map<string | number, number>;
}

const ChartDataContext = createContext<ChartContextType | null>(null);

function useChartData() {
  const ctx = useContext(ChartDataContext);
  if (!ctx) throw new Error("Chart components must be used within Chart.Root");
  return ctx;
}

function useChart() {
  return { ...useBaseChart(), ...useChartData() };
}

// ============================================================================
// Canvas — Single renderer for all chart types
// ============================================================================

function Canvas({ showGrid = false }: { showGrid?: boolean }) {
  const ctx = useChart();
  // Read the canvas ref (and its sized dimensions) straight from the base
  // chart context. Going through the merged `useChart()` spread loses the ref's
  // identity, so the compiler treats `ctx.canvasRef`/its `.current` as a
  // non-ref hook value. The direct read keeps it a real, mutable ref.
  const { canvasRef, width: viewWidth, height: viewHeight } = useBaseChart();
  const rendererRef = useRef<
    WebGLRenderer<UnifiedRendererProps> | WebGPURenderer<UnifiedRendererProps> | null
  >(null);
  const [rendererReady, setRendererReady] = useState(false);

  // Init the renderer once ChartRoot has chosen a render mode (and, for WebGPU,
  // resolved its device). We consume ctx.gpuDevice — the single device owned by
  // ChartRoot (shared via GPUDeviceProvider, or self-acquired and torn down
  // there) — instead of acquiring a second one here. Resize lives in a separate
  // effect so dimension changes don't recompile shaders / re-upload buffers.
  useEffect(() => {
    const canvas = ctx.canvasRef.current;
    if (!canvas || !ctx.renderMode) return;

    let mounted = true;

    function initRenderer() {
      if (!canvas) return;
      if (ctx.renderMode === "webgpu") {
        // Wait for ChartRoot's device; this effect re-runs once it resolves.
        if (!ctx.gpuDevice) return;
        try {
          const renderer = createUnifiedWebGPURenderer(canvas, ctx.gpuDevice);
          if (!mounted) {
            renderer.destroy();
            return;
          }
          rendererRef.current = renderer;
          setRendererReady(true);
          return;
        } catch (error) {
          console.warn("WebGPU failed, falling back to WebGL:", error);
        }
      }
      try {
        const renderer = createUnifiedWebGLRenderer(canvas);
        if (!mounted) {
          renderer.destroy();
          return;
        }
        rendererRef.current = renderer;
        setRendererReady(true);
      } catch (error) {
        console.error("WebGL failed:", error);
      }
    }

    initRenderer();
    return () => {
      mounted = false;
      setRendererReady(false);
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
    // `ctx` is a fresh merged object each render; depend on the specific stable
    // fields so the renderer re-inits only on mode/device/canvas change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.renderMode, ctx.gpuDevice, ctx.canvasRef]);

  // Resize: just reset the canvas backing store and CSS size — no teardown.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = ctx.devicePixelRatio;
    canvas.width = ctx.width * dpr;
    canvas.height = ctx.height * dpr;
    canvas.style.width = `${ctx.width}px`;
    canvas.style.height = `${ctx.height}px`;
  }, [canvasRef, ctx.width, ctx.height, ctx.devicePixelRatio]);

  // Render
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !ctx.renderMode || !rendererReady || !ctx.isVisible) return;

    const dpr = ctx.devicePixelRatio;
    let rafId: number | null = null;

    async function render() {
      const r = rendererRef.current;
      const c = ctx.canvasRef.current;
      if (!r || !c) return;
      // Geometry is built in device pixels, so size-like series fields must be
      // dpr-scaled too (matching barWidth below) — otherwise strokes/points draw
      // at half thickness on HiDPI displays.
      const scaledSeries = ctx.series.map((s) => ({
        ...s,
        strokeWidth: (s.strokeWidth ?? 2) * dpr,
        pointSize: (s.pointSize ?? 8) * dpr,
      }));
      await r.render({
        canvas: c,
        type: ctx.type,
        series: scaledSeries,
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
        smooth: ctx.smooth,
        stacked: ctx.stacked,
        orientation: ctx.orientation,
        barWidth: ctx.barWidth ? ctx.barWidth * dpr : undefined,
        grouped: ctx.grouped,
        categoryMap: ctx.categoryMap,
      });
    }

    rafId = requestAnimationFrame(() => render());
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [
    ctx.type,
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
    ctx.smooth,
    ctx.stacked,
    ctx.orientation,
    ctx.barWidth,
    ctx.grouped,
    ctx.categoryMap,
    showGrid,
    rendererReady,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ width: `${viewWidth}px`, height: `${viewHeight}px` }}
    />
  );
}

// ============================================================================
// DataPoints — SVG overlay for line/scatter data point dots
// ============================================================================

function DataPoints() {
  const ctx = useChart();
  if (!ctx.showDataPoints || ctx.type === "scatter" || ctx.type === "bar") return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: ctx.width, height: ctx.height }}
      aria-hidden="true"
    >
      {ctx.series.map((s, sIdx) =>
        s.data.map((p, pIdx) => {
          const cx = ctx.xScale(p.x);
          const cy = ctx.yScale(p.y);
          if (cx < ctx.margin.left || cx > ctx.width - ctx.margin.right) return null;
          if (cy < ctx.margin.top || cy > ctx.height - ctx.margin.bottom) return null;
          return (
            <circle key={`${sIdx}-${pIdx}`} cx={cx} cy={cy} r={1.5} fill={s.color || "#6366f1"} />
          );
        })
      )}
    </svg>
  );
}

// ============================================================================
// Legend
// ============================================================================

/** Legend row, rendered from a plain series list (no chart context required). */
function LegendRow({ series }: { series: Array<{ name: string; color?: string }> }) {
  if (series.length === 0) return null;

  // Deduplicate by name (future-dashed series share names)
  const seen = new Set<string>();
  const unique = series.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-2 py-1.5">
      {unique.map((s, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || "#6366f1" }} />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.name}</span>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  const ctx = useChart();
  return <LegendRow series={ctx.series} />;
}

// ============================================================================
// Tooltip
// ============================================================================

function Tooltip() {
  const ctx = useChart();

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

    // Fall back to the shared `formatValue` (matches the axis labels) when the
    // caller hasn't supplied a formatter, so the tooltip and axis agree.
    const fmtX = (v: number) => (ctx.xAxis?.formatter ? ctx.xAxis.formatter(v) : formatValue(v));
    const fmtY = (v: number) => (ctx.yAxis?.formatter ? ctx.yAxis.formatter(v) : formatValue(v));

    // Scatter has no shared-x columns, so X-only matching would pick the wrong
    // point; hit-test in 2D against the nearest point within a pixel radius.
    if (ctx.type === "scatter") {
      let best: { s: UnifiedSeries; p: Point; dist: number } | null = null;
      const radius = 24; // px
      for (const s of ctx.series) {
        for (const p of s.data) {
          const dx = ctx.xScale(p.x) - x;
          const dy = ctx.yScale(p.y) - y;
          const dist = Math.hypot(dx, dy);
          if (dist < radius && (!best || dist < best.dist)) best = { s, p, dist };
        }
      }
      if (!best) {
        ctx.setHoveredPoint(null);
        ctx.setTooltipData(null);
        return;
      }
      const color = best.s.color || "#6366f1";
      ctx.setHoveredPoint({
        seriesIdx: 0,
        pointIdx: 0,
        screenX: ctx.xScale(best.p.x),
        screenY: ctx.yScale(best.p.y),
        data: { xValue: best.p.x, yValue: best.p.y, color },
      });
      ctx.setTooltipData({
        title: fmtX(best.p.x),
        items: [{ label: best.s.name, value: fmtY(best.p.y), color }],
      });
      return;
    }

    // Line/area/bar: snap to the nearest X column, then show every series at it.
    let closestXDist = Infinity;
    let closestXValue = 0;
    let closestScreenX = 0;
    // Proximity gate in PIXELS — `dist` below is pixel distance, so the
    // threshold must be too. (The old `(domainRange/800)*100` was in data units,
    // so on wide-range axes like time-in-ms it ballooned to ~1e5px and never
    // excluded anything, popping a tooltip anywhere in the plot.)
    const threshold = 50;

    for (const s of ctx.series) {
      for (const p of s.data) {
        const px = ctx.xScale(p.x);
        const dist = Math.abs(px - x);
        if (dist < threshold && dist < closestXDist) {
          closestXDist = dist;
          closestXValue = p.x;
          closestScreenX = px;
        }
      }
    }

    if (closestXDist === Infinity) {
      ctx.setHoveredPoint(null);
      ctx.setTooltipData(null);
      return;
    }

    // Data-unit tolerance for matching the same x across series (not a pixel gate).
    const xThresh = (ctx.xDomain[1] - ctx.xDomain[0]) * 0.001;
    const items: Array<{ label: string; value: string; color?: string }> = [];
    let primaryScreenY = 0;

    for (const s of ctx.series) {
      let closest: Point | null = null;
      let closestD = Infinity;
      for (const p of s.data) {
        const d = Math.abs(p.x - closestXValue);
        if (d < xThresh && d < closestD) {
          closestD = d;
          closest = p;
        }
      }
      if (closest) {
        if (items.length === 0) primaryScreenY = ctx.yScale(closest.y);
        items.push({
          label: s.name,
          value: fmtY(closest.y),
          color: s.color || "#6366f1",
        });
      }
    }

    if (items.length === 0) return;

    ctx.setHoveredPoint({
      seriesIdx: 0,
      pointIdx: 0,
      screenX: closestScreenX,
      screenY: primaryScreenY,
      data: { xValue: closestXValue },
    });
    ctx.setTooltipData({
      title: fmtX(closestXValue),
      items,
    });
  };

  const dots = useMemo(() => {
    const hData = ctx.hoveredPoint?.data as
      | { xValue?: number; yValue?: number; color?: string }
      | undefined;
    // `== null` not `!`: x === 0 is a valid category/value, not "no hover".
    if (hData?.xValue == null) return null;
    // Scatter highlights the single hovered point (2D), not a per-series column.
    if (ctx.type === "scatter") {
      if (hData.yValue == null) return null;
      return [
        {
          screenX: ctx.xScale(hData.xValue),
          screenY: ctx.yScale(hData.yValue),
          color: hData.color || "#6366f1",
        },
      ];
    }
    const xThresh = (ctx.xDomain[1] - ctx.xDomain[0]) * 0.001;
    return ctx.series
      .map((s) => {
        const p = s.data.find((pt) => Math.abs(pt.x - hData.xValue!) < xThresh);
        if (!p) return null;
        return {
          screenX: ctx.xScale(p.x),
          screenY: ctx.yScale(p.y),
          color: s.color || "#6366f1",
        };
      })
      .filter(Boolean) as Array<{
      screenX: number;
      screenY: number;
      color: string;
    }>;
    // `ctx` is a fresh merged object each render; depend on the specific fields
    // used so the memo only recomputes when those actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.hoveredPoint, ctx.series, ctx.xScale, ctx.yScale, ctx.xDomain, ctx.type]);

  return (
    <>
      <ChartTooltip onHover={handleHover} />
      {ctx.hoveredPoint &&
        dots?.map((dot, idx) => (
          <div
            key={idx}
            className="absolute pointer-events-none z-20"
            style={{ left: dot.screenX - 6, top: dot.screenY - 6 }}
          >
            <div
              className="w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900"
              style={{ backgroundColor: dot.color }}
            />
          </div>
        ))}
    </>
  );
}

// ============================================================================
// Root
// ============================================================================

interface RootProps {
  type: ChartType;
  series: ChartInputSeries[];
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  width?: number | string;
  height?: number | string;
  margin?: Margin;
  preferWebGPU?: boolean;
  smooth?: boolean;
  showDataPoints?: boolean;
  stacked?: boolean;
  orientation?: "vertical" | "horizontal";
  grouped?: boolean;
  barWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

function Root({
  type,
  series,
  xAxis = EMPTY_AXIS,
  yAxis = EMPTY_AXIS,
  width = 800,
  height = 400,
  margin,
  preferWebGPU = true,
  smooth = true,
  showDataPoints = false,
  stacked = false,
  orientation = "vertical",
  grouped = false,
  barWidth,
  className,
  children,
}: RootProps) {
  // Bars are always positioned by category, so they're categorical even when x
  // is numeric (e.g. timestamps). Line/area/scatter only go categorical if x is
  // a string. Categorical data is converted to numeric indices; the original x
  // values are kept (categoryValues) so axis formatters still see them.
  const { numericSeries, categoryMap, categoryValues, isCategorical } = useMemo(() => {
    const hasStringX = series.some((s) => s.data.some((p) => typeof p.x === "string"));
    const categorical = type === "bar" || hasStringX;
    if (!categorical) {
      return {
        numericSeries: series as unknown as UnifiedSeries[],
        categoryMap: undefined as Map<string | number, number> | undefined,
        categoryValues: undefined as Map<number, string | number> | undefined,
        isCategorical: false,
      };
    }
    const cats: (string | number)[] = [];
    const seen = new Set<string | number>();
    for (const s of series) {
      for (const p of s.data) {
        if (!seen.has(p.x)) {
          seen.add(p.x);
          cats.push(p.x);
        }
      }
    }
    // Order numeric categories ascending (e.g. timestamps); keep string order.
    if (cats.every((c) => typeof c === "number")) {
      (cats as number[]).sort((a, b) => a - b);
    }
    const toIndex = new Map<string | number, number>();
    const values = new Map<number, string | number>();
    // The renderer keys bar positions by the (already-indexed) x value, so it
    // gets an identity index→index map sized to the category count.
    const renderMap = new Map<string | number, number>();
    cats.forEach((c, i) => {
      toIndex.set(c, i);
      values.set(i, c);
      renderMap.set(i, i);
    });
    const ns: UnifiedSeries[] = series.map((s) => ({
      ...s,
      data: s.data.map((p) => ({ x: toIndex.get(p.x) ?? 0, y: p.y })),
    }));
    return {
      numericSeries: ns,
      categoryMap: renderMap,
      categoryValues: values,
      isCategorical: true,
    };
  }, [series, type]);

  // Which axis carries the categories. Horizontal bars run their categories
  // down the Y axis (values along X); everything else categorical (vertical
  // bars, string-x line/area/scatter) keeps categories on X. The bar geometry
  // reads categories via the matching scale, so the two must agree.
  const categoryAxis: "x" | "y" = type === "bar" && orientation === "horizontal" ? "y" : "x";

  // Derive domains only when series content changes — otherwise a new array
  // reference per render forces ChartRoot's memos to invalidate every tick.
  const categoryDomain = useMemo<[number, number]>(
    () => [-0.5, Math.max((categoryMap?.size ?? 0) - 0.5, 0.5)],
    [categoryMap]
  );

  // The value axis. Value is always in `.y` after categorical indexing. Bars
  // anchor at zero with no padding so a value of 80 vs 100 doesn't read 10x
  // bigger off a clipped baseline; other types keep 10% headroom. When stacked,
  // the visible extent is the per-category cumulative sum, not the largest
  // single value — otherwise the stack overflows the top of the plot.
  const valueDomain = useMemo<[number, number]>(() => {
    if (stacked) {
      const totals = new Map<number, number>();
      for (const s of numericSeries) {
        for (const p of s.data) totals.set(p.x, (totals.get(p.x) ?? 0) + p.y);
      }
      const sums = [...totals.values()];
      const maxSum = Math.max(0, ...sums);
      const minSum = Math.min(0, ...sums);
      if (type === "bar") return [minSum, maxSum];
      const pad = (maxSum - minSum) * 0.1 || 1;
      return [minSum === 0 ? 0 : minSum - pad, maxSum + pad];
    }
    const allPoints = numericSeries.flatMap((s) => s.data);
    const domain = getDomain(allPoints, (p) => p.y, type === "bar" ? 0 : 0.1);
    return type === "bar" ? [Math.min(0, domain[0]), Math.max(0, domain[1])] : domain;
  }, [numericSeries, type, stacked]);

  const xDomain = useMemo<[number, number]>(() => {
    if (isCategorical && categoryAxis === "x") return categoryDomain;
    if (xAxis.domain && xAxis.domain !== "auto") return [xAxis.domain[0], xAxis.domain[1]];
    // Horizontal bars: X is the value axis. Non-categorical: X is the real x.
    if (categoryAxis === "y") return valueDomain;
    const allPoints = numericSeries.flatMap((s) => s.data);
    return getDomain(allPoints, (p) => p.x, 0);
  }, [numericSeries, xAxis.domain, isCategorical, categoryAxis, categoryDomain, valueDomain]);

  const yDomain = useMemo<[number, number]>(() => {
    if (categoryAxis === "y") return categoryDomain;
    if (yAxis.domain && yAxis.domain !== "auto") return [yAxis.domain[0], yAxis.domain[1]];
    return valueDomain;
  }, [yAxis.domain, categoryAxis, categoryDomain, valueDomain]);

  // The categorical axis gets integer index ticks; the value axis lets
  // ChartRoot derive its own.
  const categoryTicks = useMemo<number[] | undefined>(
    () =>
      isCategorical && categoryMap
        ? Array.from({ length: categoryMap.size }, (_, i) => i)
        : undefined,
    [isCategorical, categoryMap]
  );
  const xTicks = categoryAxis === "x" ? categoryTicks : undefined;
  const yTicks = categoryAxis === "y" ? categoryTicks : undefined;

  // Map index ticks back to the original category value so a caller's formatter
  // (e.g. a date formatter) still receives real values; drop "time" handling
  // since categorical axes use index ticks, not clock ticks.
  const makeCategoryFormatter = useMemo(() => {
    if (!isCategorical || !categoryValues) return null;
    return (userFmt?: (v: number) => string) => (v: number) => {
      const orig = categoryValues.get(Math.round(v));
      if (orig === undefined) return "";
      return userFmt ? userFmt(orig as number) : String(orig);
    };
  }, [isCategorical, categoryValues]);

  const resolvedXAxis = useMemo<AxisConfig>(() => {
    if (categoryAxis === "x" && makeCategoryFormatter) {
      return { ...xAxis, type: undefined, formatter: makeCategoryFormatter(xAxis.formatter) };
    }
    return xAxis;
  }, [xAxis, categoryAxis, makeCategoryFormatter]);

  const resolvedYAxis = useMemo<AxisConfig>(() => {
    if (categoryAxis === "y" && makeCategoryFormatter) {
      return { ...yAxis, type: undefined, formatter: makeCategoryFormatter(yAxis.formatter) };
    }
    return yAxis;
  }, [yAxis, categoryAxis, makeCategoryFormatter]);

  const chartContextValue = useMemo(
    () => ({
      type,
      series: numericSeries,
      smooth,
      showDataPoints,
      stacked,
      orientation,
      grouped,
      barWidth,
      categoryMap,
    }),
    [
      type,
      numericSeries,
      smooth,
      showDataPoints,
      stacked,
      orientation,
      grouped,
      barWidth,
      categoryMap,
    ]
  );

  // We always hand ChartRoot a computed numeric domain, so tell it which axes
  // are data-derived (auto) vs explicitly controlled: a controlled domain change
  // should reset an in-progress pan/zoom, but streaming/auto growth should not.
  const xDomainAuto = !(xAxis.domain && xAxis.domain !== "auto");
  const yDomainAuto = !(yAxis.domain && yAxis.domain !== "auto");

  return (
    <ChartRoot
      width={width}
      height={height}
      margin={margin}
      xAxis={resolvedXAxis}
      yAxis={resolvedYAxis}
      xDomain={xDomain}
      yDomain={yDomain}
      xDomainAuto={xDomainAuto}
      yDomainAuto={yDomainAuto}
      xTicks={xTicks}
      yTicks={yTicks}
      preferWebGPU={preferWebGPU}
      className={className}
    >
      <ChartDataContext.Provider value={chartContextValue}>{children}</ChartDataContext.Provider>
    </ChartRoot>
  );
}

// ============================================================================
// Composed API
// ============================================================================

export function Chart({
  type,
  series,
  xAxis = EMPTY_AXIS,
  yAxis = EMPTY_AXIS,
  width = 800,
  height = 400,
  showGrid = true,
  showAxes = true,
  showXAxis,
  showYAxis,
  showTooltip = false,
  showLegend = false,
  smooth = true,
  showDataPoints = false,
  referenceLines,
  alertBands,
  ruler = false,
  preferWebGPU = true,
  panZoom,
  stacked = false,
  orientation = "vertical",
  grouped = false,
  barWidth,
  className,
}: ChartProps) {
  // Pan/zoom is always on unless explicitly disabled via panZoom.enabled === false.
  const panZoomEnabled = panZoom?.enabled !== false;

  const plot = (
    <Root
      type={type}
      series={series}
      xAxis={xAxis}
      yAxis={yAxis}
      width={width}
      height={height}
      preferWebGPU={preferWebGPU}
      smooth={smooth}
      showDataPoints={showDataPoints}
      stacked={stacked}
      orientation={orientation}
      grouped={grouped}
      barWidth={barWidth}
      className={className}
    >
      <Canvas showGrid={showGrid} />
      {(showAxes || showXAxis || showYAxis) && (
        <ChartAxes showXAxis={showXAxis ?? showAxes} showYAxis={showYAxis ?? showAxes} />
      )}
      {showTooltip && <Tooltip />}
      <DataPoints />
      {alertBands && alertBands.length > 0 && <AlertBands bands={alertBands} />}
      {referenceLines && referenceLines.length > 0 && <ReferenceLines lines={referenceLines} />}
      {ruler && <ChartRuler />}
      {panZoomEnabled && <ChartPanZoom {...panZoom} />}
    </Root>
  );

  if (!showLegend) return plot;

  // The plot area is a fixed-height container with an absolutely-positioned
  // canvas, so the legend can't live inside it (it would overlap the data). Put
  // it in its own row below, computed straight from `series` (no chart context).
  return (
    <div
      className="flex flex-col"
      style={{ width: typeof width === "number" ? `${width}px` : width }}
    >
      {plot}
      <LegendRow series={series} />
    </div>
  );
}

Chart.Root = Root;
Chart.Canvas = Canvas;
Chart.Axes = ChartAxes;
Chart.Tooltip = Tooltip;
Chart.Legend = Legend;
Chart.PanZoom = ChartPanZoom;
Chart.Ruler = ChartRuler;
Chart.AlertBands = AlertBands;
Chart.displayName = "Chart";

/** Alias matching the Plexus frontend's component name (for de-dup later). */
export const UnifiedChart = Chart;
export type UnifiedChartProps = ChartProps;
