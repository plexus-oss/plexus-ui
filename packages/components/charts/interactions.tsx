/** biome-ignore-all lint/complexity/noUselessFragments: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import * as React from "react";
import { useBaseChart } from "./base-chart";
import { useChartPanZoom } from "./use-chart-pan-zoom";

// ============================================================================
// Interaction Types
// ============================================================================

export interface ClickEvent {
  dataX: number;
  dataY: number;
  screenX: number;
  screenY: number;
}

export interface BrushSelection {
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
}

export interface CrosshairPosition {
  dataX: number;
  dataY: number;
  screenX: number;
  screenY: number;
}

// ============================================================================
// Click Interaction Component
// ============================================================================

export interface ChartClickProps {
  /**
   * Callback when user clicks on the chart
   */
  onClick?: (event: ClickEvent) => void;

  /**
   * Callback when user double-clicks on the chart
   */
  onDoubleClick?: (event: ClickEvent) => void;

  /**
   * Visual feedback for clicks (optional)
   */
  showClickMarker?: boolean;

  /**
   * Click marker color
   */
  markerColor?: string;

  /**
   * Click marker duration in ms
   */
  markerDuration?: number;
}

export function ChartClick({
  onClick,
  onDoubleClick,
  showClickMarker = false,
  markerColor = "#3b82f6",
  markerDuration = 500,
}: ChartClickProps) {
  const ctx = useBaseChart();
  const [clickMarkers, setClickMarkers] = React.useState<
    Array<{ x: number; y: number; timestamp: number }>
  >([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Check if click is within chart bounds
    if (
      screenX < ctx.margin.left ||
      screenX > ctx.width - ctx.margin.right ||
      screenY < ctx.margin.top ||
      screenY > ctx.height - ctx.margin.bottom
    ) {
      return;
    }

    // Convert to data coordinates
    const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
    const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;
    const relX = screenX - ctx.margin.left;
    const relY = screenY - ctx.margin.top;

    const dataX = ctx.xDomain[0] + (relX / innerWidth) * (ctx.xDomain[1] - ctx.xDomain[0]);
    const dataY =
      ctx.yDomain[0] + ((innerHeight - relY) / innerHeight) * (ctx.yDomain[1] - ctx.yDomain[0]);

    onClick?.({ dataX, dataY, screenX, screenY });

    // Show visual marker
    if (showClickMarker) {
      setClickMarkers((prev) => [...prev, { x: screenX, y: screenY, timestamp: Date.now() }]);

      // Remove marker after duration
      setTimeout(() => {
        setClickMarkers((prev) => prev.filter((m) => Date.now() - m.timestamp < markerDuration));
      }, markerDuration);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (
      screenX < ctx.margin.left ||
      screenX > ctx.width - ctx.margin.right ||
      screenY < ctx.margin.top ||
      screenY > ctx.height - ctx.margin.bottom
    ) {
      return;
    }

    const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
    const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;
    const relX = screenX - ctx.margin.left;
    const relY = screenY - ctx.margin.top;

    const dataX = ctx.xDomain[0] + (relX / innerWidth) * (ctx.xDomain[1] - ctx.xDomain[0]);
    const dataY =
      ctx.yDomain[0] + ((innerHeight - relY) / innerHeight) * (ctx.yDomain[1] - ctx.yDomain[0]);

    onDoubleClick?.({ dataX, dataY, screenX, screenY });
  };

  return (
    <>
      <div
        className="absolute inset-0 cursor-crosshair"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{ zIndex: 10 }}
      />
      {showClickMarker &&
        clickMarkers.map((marker, idx) => (
          <div
            key={`${marker.timestamp}-${idx}`}
            className="absolute pointer-events-none animate-ping"
            style={{
              left: marker.x - 4,
              top: marker.y - 4,
              width: 8,
              height: 8,
              backgroundColor: markerColor,
              borderRadius: "50%",
              opacity: 0.8,
              zIndex: 20,
            }}
          />
        ))}
    </>
  );
}

// ============================================================================
// Brush Selection Component
// ============================================================================

export interface ChartBrushProps {
  /**
   * Callback when brush selection is completed
   */
  onBrushEnd?: (selection: BrushSelection) => void;

  /**
   * Callback during brush (while dragging)
   */
  onBrushing?: (selection: BrushSelection) => void;

  /**
   * Brush fill color
   */
  brushColor?: string;

  /**
   * Brush opacity
   */
  brushOpacity?: number;

  /**
   * Brush border color
   */
  brushBorderColor?: string;

  /**
   * Enable horizontal brush (X-axis selection)
   */
  enableX?: boolean;

  /**
   * Enable vertical brush (Y-axis selection)
   */
  enableY?: boolean;
}

export function ChartBrush({
  onBrushEnd,
  onBrushing,
  brushColor = "#3b82f6",
  brushOpacity = 0.2,
  brushBorderColor = "#3b82f6",
  enableX = true,
  enableY = true,
}: ChartBrushProps) {
  const ctx = useBaseChart();
  const [brushStart, setBrushStart] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [brushEnd, setBrushEnd] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const convertToDataCoords = (screenX: number, screenY: number) => {
    const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
    const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;
    const relX = screenX - ctx.margin.left;
    const relY = screenY - ctx.margin.top;

    const dataX = ctx.xDomain[0] + (relX / innerWidth) * (ctx.xDomain[1] - ctx.xDomain[0]);
    const dataY =
      ctx.yDomain[0] + ((innerHeight - relY) / innerHeight) * (ctx.yDomain[1] - ctx.yDomain[0]);

    return { dataX, dataY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x < ctx.margin.left ||
      x > ctx.width - ctx.margin.right ||
      y < ctx.margin.top ||
      y > ctx.height - ctx.margin.bottom
    ) {
      return;
    }

    setBrushStart({ x, y });
    setBrushEnd({ x, y });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !brushStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clampedX = Math.max(ctx.margin.left, Math.min(ctx.width - ctx.margin.right, x));
    const clampedY = Math.max(ctx.margin.top, Math.min(ctx.height - ctx.margin.bottom, y));

    setBrushEnd({ x: clampedX, y: clampedY });
    if (onBrushing) {
      const start = convertToDataCoords(brushStart.x, brushStart.y);
      const end = convertToDataCoords(clampedX, clampedY);

      onBrushing({
        xStart: Math.min(start.dataX, end.dataX),
        xEnd: Math.max(start.dataX, end.dataX),
        yStart: Math.min(start.dataY, end.dataY),
        yEnd: Math.max(start.dataY, end.dataY),
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !brushStart || !brushEnd) {
      setIsDragging(false);
      setBrushStart(null);
      setBrushEnd(null);
      return;
    }

    setIsDragging(false);

    const start = convertToDataCoords(brushStart.x, brushStart.y);
    const end = convertToDataCoords(brushEnd.x, brushEnd.y);

    const selection: BrushSelection = {
      xStart: Math.min(start.dataX, end.dataX),
      xEnd: Math.max(start.dataX, end.dataX),
      yStart: Math.min(start.dataY, end.dataY),
      yEnd: Math.max(start.dataY, end.dataY),
    };

    onBrushEnd?.(selection);

    setBrushStart(null);
    setBrushEnd(null);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  // Calculate brush rectangle
  const brushRect =
    brushStart && brushEnd
      ? {
          x: enableX ? Math.min(brushStart.x, brushEnd.x) : ctx.margin.left,
          y: enableY ? Math.min(brushStart.y, brushEnd.y) : ctx.margin.top,
          width: enableX
            ? Math.abs(brushEnd.x - brushStart.x)
            : ctx.width - ctx.margin.left - ctx.margin.right,
          height: enableY
            ? Math.abs(brushEnd.y - brushStart.y)
            : ctx.height - ctx.margin.top - ctx.margin.bottom,
        }
      : null;

  return (
    <>
      <div
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ zIndex: 10 }}
      />
      {brushRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: brushRect.x,
            top: brushRect.y,
            width: brushRect.width,
            height: brushRect.height,
            backgroundColor: brushColor,
            opacity: brushOpacity,
            border: `2px solid ${brushBorderColor}`,
            zIndex: 15,
          }}
        />
      )}
    </>
  );
}

// ============================================================================
// Crosshair Component
// ============================================================================

export interface ChartCrosshairProps {
  /**
   * Show horizontal line
   */
  showHorizontal?: boolean;

  /**
   * Show vertical line
   */
  showVertical?: boolean;

  /**
   * Crosshair line color
   */
  lineColor?: string;

  /**
   * Crosshair line width
   */
  lineWidth?: number;

  /**
   * Crosshair line style
   */
  lineStyle?: "solid" | "dashed" | "dotted";

  /**
   * Show value labels on axes
   */
  showLabels?: boolean;

  /**
   * Label background color
   */
  labelBgColor?: string;

  /**
   * Label text color
   */
  labelTextColor?: string;

  /**
   * Callback when crosshair moves
   */
  onMove?: (position: CrosshairPosition) => void;
}

export function ChartCrosshair({
  showHorizontal = true,
  showVertical = true,
  lineColor = "#666",
  lineWidth = 1,
  lineStyle = "dashed",
  showLabels = true,
  labelBgColor = "#000",
  labelTextColor = "#fff",
  onMove,
}: ChartCrosshairProps) {
  const ctx = useBaseChart();
  const [position, setPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if within chart bounds
    if (
      x < ctx.margin.left ||
      x > ctx.width - ctx.margin.right ||
      y < ctx.margin.top ||
      y > ctx.height - ctx.margin.bottom
    ) {
      setPosition(null);
      return;
    }

    setPosition({ x, y });

    // Convert to data coordinates and call callback
    if (onMove) {
      const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
      const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;
      const relX = x - ctx.margin.left;
      const relY = y - ctx.margin.top;

      const dataX = ctx.xDomain[0] + (relX / innerWidth) * (ctx.xDomain[1] - ctx.xDomain[0]);
      const dataY =
        ctx.yDomain[0] + ((innerHeight - relY) / innerHeight) * (ctx.yDomain[1] - ctx.yDomain[0]);

      onMove({ dataX, dataY, screenX: x, screenY: y });
    }
  };

  const handleMouseLeave = () => {
    setPosition(null);
  };

  // Format values for labels
  const formatValue = (value: number, formatter?: (v: number) => string) => {
    return formatter ? formatter(value) : value.toFixed(2);
  };

  const getDataValues = () => {
    if (!position) return null;

    const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
    const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;
    const relX = position.x - ctx.margin.left;
    const relY = position.y - ctx.margin.top;

    const dataX = ctx.xDomain[0] + (relX / innerWidth) * (ctx.xDomain[1] - ctx.xDomain[0]);
    const dataY =
      ctx.yDomain[0] + ((innerHeight - relY) / innerHeight) * (ctx.yDomain[1] - ctx.yDomain[0]);

    return { dataX, dataY };
  };

  const dataValues = getDataValues();

  // Determine line style
  const borderStyle =
    lineStyle === "dashed" ? "2px 4px" : lineStyle === "dotted" ? "1px 2px" : undefined;

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ zIndex: 25, pointerEvents: "auto" }}
      >
        {position && (
          <>
            {/* Vertical line */}
            {showVertical && (
              <div
                className="absolute"
                style={{
                  left: position.x,
                  top: ctx.margin.top,
                  height: ctx.height - ctx.margin.top - ctx.margin.bottom,
                  width: lineWidth,

                  opacity: 0.6,
                  borderLeft: borderStyle ? `${lineWidth}px dashed ${lineColor}` : undefined,
                  backgroundColor: borderStyle ? "transparent" : lineColor,
                }}
              />
            )}

            {/* Horizontal line */}
            {showHorizontal && (
              <div
                className="absolute"
                style={{
                  top: position.y,
                  left: ctx.margin.left,
                  width: ctx.width - ctx.margin.left - ctx.margin.right,
                  height: lineWidth,

                  opacity: 0.6,
                  borderTop: borderStyle ? `${lineWidth}px dashed ${lineColor}` : undefined,
                  backgroundColor: borderStyle ? "transparent" : lineColor,
                }}
              />
            )}

            {/* Value labels */}
            {showLabels && dataValues && (
              <>
                {/* X-axis label */}
                <div
                  className="absolute px-2 py-1 text-xs font-mono rounded"
                  style={{
                    left: position.x,
                    top: ctx.height - ctx.margin.bottom + 5,
                    transform: "translateX(-50%)",
                    backgroundColor: labelBgColor,
                    color: labelTextColor,
                    opacity: 0.9,
                    zIndex: 30,
                  }}
                >
                  {formatValue(dataValues.dataX, ctx.xAxis?.formatter)}
                </div>

                {/* Y-axis label */}
                <div
                  className="absolute px-2 py-1 text-xs font-mono rounded"
                  style={{
                    left: ctx.margin.left - 5,
                    top: position.y,
                    transform: "translate(-100%, -50%)",
                    backgroundColor: labelBgColor,
                    color: labelTextColor,
                    opacity: 0.9,
                    zIndex: 30,
                  }}
                >
                  {formatValue(dataValues.dataY, ctx.yAxis?.formatter)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Pan / Zoom Component (drives the chart viewport)
// ============================================================================

type PanZoomModifier = "ctrl" | "meta" | "ctrlOrMeta" | "none";

export interface ChartPanZoomProps {
  /** Master enable switch. Default true. */
  enabled?: boolean;
  /** Modifier required for wheel-zoom. Default "ctrlOrMeta" (cmd/ctrl + scroll). */
  zoomKey?: PanZoomModifier;
  /** Modifier required for drag-pan. Default "ctrlOrMeta" (cmd/ctrl + drag). */
  panKey?: PanZoomModifier;
  /** Allow shift+drag to rubber-band a sub-range to zoom into. Default true. */
  enableBrush?: boolean;
  /** Smallest zoom-in span, in x data units. */
  minSpan?: number;
  /** Largest span, in x data units. */
  maxSpan?: number;
  /**
   * Hard clamp — the view can never travel outside these x bounds. Omit (the
   * default) to allow zooming/panning past the rendered data.
   */
  bounds?: [number, number];
  /** Show a "Reset" button while the view is panned/zoomed. Default true. */
  showReset?: boolean;
  /** Color of the brush rectangle. Default matches the brush selection blue. */
  brushColor?: string;
}

/**
 * Pan & zoom the x-axis viewport. Drop it inside any `*.Root` and it works —
 * it reads the chart's domain from context and writes the new viewport back via
 * `setXDomain`, which is the feedback path the base chart exposes for this.
 *
 * Gestures (matching the frontend): cmd/ctrl + wheel = zoom (cursor-centered),
 * cmd/ctrl + drag = pan, shift+drag = brush-zoom. The view is NOT clamped to the
 * data extent by default, so you can zoom/pan past the rendered data.
 *
 * @example
 * ```tsx
 * <LineChart.Root series={data} xDomain={[0, 100]}>
 *   <LineChart.Canvas />
 *   <LineChart.Axes />
 *   <ChartPanZoom />
 * </LineChart.Root>
 * ```
 */
export function ChartPanZoom({
  enabled = true,
  zoomKey = "ctrlOrMeta",
  panKey = "ctrlOrMeta",
  enableBrush = true,
  minSpan,
  maxSpan,
  bounds,
  showReset = true,
  brushColor = "#3b82f6",
}: ChartPanZoomProps) {
  const ctx = useBaseChart();

  const { brushRect, reset } = useChartPanZoom({
    containerRef: ctx.containerRef,
    margin: { left: ctx.margin.left, right: ctx.margin.right },
    // Controlled by the chart context — pan/zoom writes straight back to it.
    domain: ctx.xDomain,
    // No default clamp — allow zooming/panning outside the rendered data.
    bounds,
    minSpan,
    maxSpan,
    enabled,
    zoomKey,
    panKey,
    enableBrush,
    onPreview: (d) => ctx.setXDomain(d),
    onCommit: (d) => ctx.setXDomain(d),
    onInteractionStart: () => {
      // Pan/zoom and the tooltip fight over the same pixels — drop any hover.
      ctx.setHoveredPoint(null);
      ctx.setTooltipData(null);
    },
  });

  const handleReset = React.useCallback(() => {
    reset();
    ctx.resetDomains();
  }, [reset, ctx]);

  return (
    <>
      {/* Active brush-zoom rectangle */}
      {brushRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: brushRect.left,
            width: brushRect.width,
            top: ctx.margin.top,
            height: ctx.height - ctx.margin.top - ctx.margin.bottom,
            backgroundColor: brushColor,
            opacity: 0.15,
            border: `1px solid ${brushColor}`,
          }}
        />
      )}

      {showReset && ctx.isDomainOverridden && (
        <button
          type="button"
          onClick={handleReset}
          className="absolute top-2 right-2 z-50 px-2 py-1 text-xs font-medium rounded-md bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors"
        >
          Reset zoom
        </button>
      )}
    </>
  );
}

// ============================================================================
// Combined Interaction Component (Convenience)
// ============================================================================

export interface ChartInteractionsProps
  extends ChartClickProps,
    Partial<ChartBrushProps>,
    Partial<ChartCrosshairProps> {
  /**
   * Enable click interactions
   */
  enableClick?: boolean;

  /**
   * Enable brush selection
   */
  enableBrush?: boolean;

  /**
   * Enable crosshair
   */
  enableCrosshair?: boolean;

  /**
   * Enable pan/zoom of the x-axis viewport (wheel = zoom, drag = pan).
   */
  enablePanZoom?: boolean;

  /**
   * Pan/zoom options (forwarded to ChartPanZoom).
   */
  panZoom?: ChartPanZoomProps;
}

/**
 * Combined interaction component for convenience
 * Provides click, brush, and crosshair interactions in one component
 *
 * @example
 * ```tsx
 * <LineChart.Root series={data}>
 *   <LineChart.Canvas />
 *   <LineChart.Axes />
 *   <ChartInteractions
 *     enableClick
 *     onClick={(e) => console.log('Clicked at', e.dataX, e.dataY)}
 *     enableBrush
 *     onBrushEnd={(sel) => console.log('Selected', sel)}
 *     enableCrosshair
 *     showLabels
 *   />
 * </LineChart.Root>
 * ```
 */
export function ChartInteractions({
  enableClick = false,
  enableBrush = false,
  enableCrosshair = false,
  enablePanZoom = false,
  panZoom,
  onClick,
  onDoubleClick,
  showClickMarker,
  markerColor,
  markerDuration,
  onBrushEnd,
  onBrushing,
  brushColor,
  brushOpacity,
  brushBorderColor,
  enableX,
  enableY,
  showHorizontal,
  showVertical,
  lineColor,
  lineWidth,
  lineStyle,
  showLabels,
  labelBgColor,
  labelTextColor,
  onMove,
}: ChartInteractionsProps) {
  return (
    <>
      {enablePanZoom && <ChartPanZoom {...panZoom} />}
      {enableClick && (
        <ChartClick
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          showClickMarker={showClickMarker}
          markerColor={markerColor}
          markerDuration={markerDuration}
        />
      )}
      {enableBrush && (
        <ChartBrush
          onBrushEnd={onBrushEnd}
          onBrushing={onBrushing}
          brushColor={brushColor}
          brushOpacity={brushOpacity}
          brushBorderColor={brushBorderColor}
          enableX={enableX}
          enableY={enableY}
        />
      )}
      {enableCrosshair && (
        <ChartCrosshair
          showHorizontal={showHorizontal}
          showVertical={showVertical}
          lineColor={lineColor}
          lineWidth={lineWidth}
          lineStyle={lineStyle}
          showLabels={showLabels}
          labelBgColor={labelBgColor}
          labelTextColor={labelTextColor}
          onMove={onMove}
        />
      )}
    </>
  );
}
