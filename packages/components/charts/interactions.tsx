/** biome-ignore-all lint/complexity/noUselessFragments: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use client";

import * as React from "react";
import { useBaseChart } from "./base-chart";

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
// Brush Selector Component (Draggable Timeline Selection)
// ============================================================================

export interface ChartBrushSelectorProps {
  /**
   * Start of selection range (in data coordinates)
   */
  start: number;

  /**
   * End of selection range (in data coordinates)
   */
  end: number;

  /**
   * Minimum value of full data range
   */
  fullMin: number;

  /**
   * Maximum value of full data range
   */
  fullMax: number;

  /**
   * Callback when selection changes
   */
  onSelectionChange: (newStart: number, newEnd: number) => void;

  /**
   * Format function for displaying dates
   */
  formatLabel?: (value: number) => string;

  /**
   * Selection color
   */
  color?: string;

  /**
   * Container class name (used for calculating positions)
   */
  containerClass?: string;
}

/**
 * Draggable brush selector for timeline navigation
 * Similar to video editing crop tools
 *
 * @example
 * ```tsx
 * <BarChart.Root series={minimapSeries}>
 *   <BarChart.Canvas />
 *   <ChartBrushSelector
 *     start={visibleRange.start}
 *     end={visibleRange.end}
 *     fullMin={fullTimeRange.min}
 *     fullMax={fullTimeRange.max}
 *     onSelectionChange={(start, end) =>
 *       setBrushSelection({ xStart: start, xEnd: end })
 *     }
 *   />
 * </BarChart.Root>
 * ```
 */
export function ChartBrushSelector({
  start,
  end,
  fullMin,
  fullMax,
  onSelectionChange,
  formatLabel,
  color = "#3b82f6",
  containerClass = "minimap-container",
}: ChartBrushSelectorProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizingLeft, setIsResizingLeft] = React.useState(false);
  const [isResizingRight, setIsResizingRight] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({
    x: 0,
    startVal: 0,
    endVal: 0,
  });

  const rangeWidth = fullMax - fullMin;
  const leftPercent = ((start - fullMin) / rangeWidth) * 100;
  const widthPercent = ((end - start) / rangeWidth) * 100;

  // Debug logging
  React.useEffect(() => {
    console.log("ChartBrushSelector render:", {
      start,
      end,
      fullMin,
      fullMax,
      leftPercent: leftPercent.toFixed(2) + "%",
      widthPercent: widthPercent.toFixed(2) + "%",
      containerClass,
      selectionBox: {
        leftPosition: leftPercent + "%",
        width: widthPercent + "%",
      },
    });
  }, [start, end, fullMin, fullMax, leftPercent, widthPercent, containerClass]);

  const handleMouseDown = (e: React.MouseEvent, type: "left" | "right" | "body") => {
    e.preventDefault();
    e.stopPropagation();

    if (type === "left") {
      setIsResizingLeft(true);
    } else if (type === "right") {
      setIsResizingRight(true);
    } else {
      setIsDragging(true);
    }

    setDragStart({ x: e.clientX, startVal: start, endVal: end });
  };

  React.useEffect(() => {
    if (!isDragging && !isResizingLeft && !isResizingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector(`.${containerClass}`) as HTMLElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const deltaX = e.clientX - dragStart.x;
      const deltaValue = (deltaX / containerWidth) * rangeWidth;

      if (isDragging) {
        // Move entire selection
        const duration = dragStart.endVal - dragStart.startVal;
        let newStart = dragStart.startVal + deltaValue;
        let newEnd = dragStart.endVal + deltaValue;

        // Clamp to bounds
        if (newStart < fullMin) {
          newStart = fullMin;
          newEnd = fullMin + duration;
        }
        if (newEnd > fullMax) {
          newEnd = fullMax;
          newStart = fullMax - duration;
        }

        onSelectionChange(newStart, newEnd);
      } else if (isResizingLeft) {
        // Resize from left
        let newStart = dragStart.startVal + deltaValue;
        newStart = Math.max(fullMin, Math.min(newStart, dragStart.endVal - rangeWidth * 0.01)); // Min 1% width
        onSelectionChange(newStart, dragStart.endVal);
      } else if (isResizingRight) {
        // Resize from right
        let newEnd = dragStart.endVal + deltaValue;
        newEnd = Math.min(fullMax, Math.max(newEnd, dragStart.startVal + rangeWidth * 0.01)); // Min 1% width
        onSelectionChange(dragStart.startVal, newEnd);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    isResizingLeft,
    isResizingRight,
    dragStart,
    rangeWidth,
    fullMin,
    fullMax,
    onSelectionChange,
    containerClass,
  ]);

  return (
    <div className="absolute inset-0" style={{ zIndex: 100 }}>
      {/* Dimmed overlay on left */}
      <div
        className="absolute inset-y-0 bg-black/50"
        style={{ left: 0, width: `${leftPercent}%`, pointerEvents: "none" }}
      />

      {/* Dimmed overlay on right */}
      <div
        className="absolute inset-y-0 bg-black/50"
        style={{
          left: `${leftPercent + widthPercent}%`,
          right: 0,
          pointerEvents: "none",
        }}
      />

      {/* Selection box */}
      <div
        className={`absolute inset-y-0 group ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          zIndex: 101,
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => handleMouseDown(e, "body")}
      >
        {/* Border with rounded corners */}
        <div
          className="absolute inset-0 border-4 rounded-lg pointer-events-none"
          style={{ borderColor: color }}
        />

        {/* Left handle */}
        <div
          className="absolute left-0 inset-y-0 w-8 cursor-ew-resize flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, "left")}
          style={{
            zIndex: 103,
            pointerEvents: "auto",
            marginLeft: "-16px", // Half of w-8 to center on edge
          }}
        >
          {/* White circular handle */}
          <div
            className="w-6 h-12 bg-white rounded-full border-2 border-gray-400 hover:scale-110 transition-transform shadow-lg"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
          />
        </div>

        {/* Right handle */}
        <div
          className="absolute right-0 inset-y-0 w-8 cursor-ew-resize flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, "right")}
          style={{
            zIndex: 103,
            pointerEvents: "auto",
            marginRight: "-16px", // Half of w-8 to center on edge
          }}
        >
          {/* White circular handle */}
          <div
            className="w-6 h-12 bg-white rounded-full border-2 border-gray-400 hover:scale-110 transition-transform shadow-lg"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
          />
        </div>

        {/* Center position indicator (vertical dashed line) */}
        <div className="absolute left-1/2 inset-y-0 w-px border-l-2 border-dashed border-white/40 pointer-events-none" />
      </div>
    </div>
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
