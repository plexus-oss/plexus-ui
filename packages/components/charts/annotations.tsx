/**
 * Chart Annotation System
 *
 * Minimal text annotation tool for labeling data.
 */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative SVG annotations do not need titles */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: chart annotation overlays require custom pointer handling */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: chart annotation interactions are pointer-driven */
"use client";

import * as React from "react";
import { useBaseChart } from "./base-chart";

// ============================================================================
// Types
// ============================================================================

export interface Annotation {
  id: string;
  dataX: number;
  dataY: number;
  text: string;
}

export interface ChartAnnotationsProps {
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  enabled?: boolean;
  color?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// Annotation Item Component
// ============================================================================

interface AnnotationItemProps {
  annotation: Annotation;
  isEditing: boolean;
  color: string;
  onEdit: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  dataToScreen: (dataX: number, dataY: number) => { x: number; y: number };
}

function AnnotationItem({
  annotation,
  isEditing,
  color,
  onEdit,
  onUpdate,
  onDelete,
  dataToScreen,
}: AnnotationItemProps) {
  const [text, setText] = React.useState(annotation.text);
  const [isHovered, setIsHovered] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const screen = dataToScreen(annotation.dataX, annotation.dataY);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setText(annotation.text);
  }, [annotation.text]);

  const handleSave = () => {
    if (text.trim()) {
      onUpdate(annotation.id, text.trim());
    } else {
      onDelete(annotation.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setText(annotation.text);
      onEdit("");
    }
  };

  return (
    <>
      {/* Dot marker */}
      <div
        className="absolute w-2 h-2 rounded-full pointer-events-none"
        style={{
          left: screen.x,
          top: screen.y,
          transform: "translate(-50%, -50%)",
          backgroundColor: color,
          zIndex: 35,
          boxShadow: "0 0 0 2px rgba(0,0,0,0.3)",
        }}
      />

      {/* Label */}
      <div
        className="absolute"
        style={{
          left: screen.x,
          top: screen.y - 24,
          transform: "translateX(-50%)",
          zIndex: isEditing ? 50 : 40,
          pointerEvents: "auto",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`
            relative px-2 py-1 rounded shadow-md text-xs font-medium
            transition-all duration-150
            ${isEditing ? "ring-1" : ""}
            ${isHovered ? "shadow-lg" : ""}
          `}
          style={{
            backgroundColor: color,
            color: "#fff",
            borderColor: "#fff",
            cursor: isEditing ? "text" : "pointer",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditing) onEdit(annotation.id);
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-white placeholder-white/50 text-xs font-medium"
              placeholder="Label..."
              style={{ width: "80px", minWidth: "60px" }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="whitespace-nowrap">{annotation.text}</div>
          )}

          {/* Delete button */}
          {isHovered && !isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(annotation.id);
              }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              style={{ fontSize: "10px", lineHeight: "1" }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Main Annotations Component
// ============================================================================

export function ChartAnnotations({
  annotations,
  onChange,
  enabled = true,
  color = "#6366f1",
}: ChartAnnotationsProps) {
  const ctx = useBaseChart();
  const [editingId, setEditingId] = React.useState<string>("");

  const dataToScreen = React.useCallback(
    (dataX: number, dataY: number) => {
      const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
      const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;

      const normalizedX = (dataX - ctx.xDomain[0]) / (ctx.xDomain[1] - ctx.xDomain[0]);
      const normalizedY = (dataY - ctx.yDomain[0]) / (ctx.yDomain[1] - ctx.yDomain[0]);

      const x = ctx.margin.left + normalizedX * innerWidth;
      const y = ctx.height - ctx.margin.bottom - normalizedY * innerHeight;

      return { x, y };
    },
    [ctx]
  );

  const screenToData = React.useCallback(
    (screenX: number, screenY: number) => {
      const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
      const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;
      const relX = screenX - ctx.margin.left;
      const relY = screenY - ctx.margin.top;

      const dataX = ctx.xDomain[0] + (relX / innerWidth) * (ctx.xDomain[1] - ctx.xDomain[0]);
      const dataY =
        ctx.yDomain[0] + ((innerHeight - relY) / innerHeight) * (ctx.yDomain[1] - ctx.yDomain[0]);

      return { dataX, dataY };
    },
    [ctx]
  );

  const handleChartClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Check if within chart bounds
    if (
      screenX < ctx.margin.left ||
      screenX > ctx.width - ctx.margin.right ||
      screenY < ctx.margin.top ||
      screenY > ctx.height - ctx.margin.bottom
    ) {
      return;
    }

    const { dataX, dataY } = screenToData(screenX, screenY);

    const newAnnotation: Annotation = {
      id: generateId(),
      dataX,
      dataY,
      text: "",
    };

    onChange([...annotations, newAnnotation]);
    setEditingId(newAnnotation.id);
  };

  const handleUpdate = (id: string, text: string) => {
    onChange(annotations.map((a) => (a.id === id ? { ...a, text } : a)));
    setEditingId("");
  };

  const handleDelete = (id: string) => {
    onChange(annotations.filter((a) => a.id !== id));
    setEditingId("");
  };

  return (
    <>
      {/* Click overlay - only active when enabled and not editing */}
      {enabled && !editingId && (
        <div
          className="absolute inset-0"
          onClick={handleChartClick}
          style={{
            zIndex: 25,
            cursor: "crosshair",
            pointerEvents: "auto",
          }}
        />
      )}

      {/* Render annotations */}
      {annotations.map((annotation) => (
        <AnnotationItem
          key={annotation.id}
          annotation={annotation}
          isEditing={editingId === annotation.id}
          color={color}
          onEdit={setEditingId}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          dataToScreen={dataToScreen}
        />
      ))}
    </>
  );
}

// ============================================================================
// Reference Lines (for thresholds/limits)
// ============================================================================

export interface ChartReferenceLineProps {
  value: number;
  axis: "x" | "y";
  label?: string;
  color?: string;
  lineStyle?: "solid" | "dashed" | "dotted";
  thickness?: number;
  labelPosition?: "start" | "end" | "center";
  showLabel?: boolean;
}

export function ChartReferenceLine({
  value,
  axis,
  label,
  color = "#ef4444",
  lineStyle = "dashed",
  thickness = 2,
  labelPosition = "end",
  showLabel = true,
}: ChartReferenceLineProps) {
  const ctx = useBaseChart();

  const getScreenPosition = () => {
    if (axis === "x") {
      const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
      const normalizedX = (value - ctx.xDomain[0]) / (ctx.xDomain[1] - ctx.xDomain[0]);
      return ctx.margin.left + normalizedX * innerWidth;
    } else {
      const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;
      const normalizedY = (value - ctx.yDomain[0]) / (ctx.yDomain[1] - ctx.yDomain[0]);
      return ctx.height - ctx.margin.bottom - normalizedY * innerHeight;
    }
  };

  const position = getScreenPosition();

  const borderStyleCSS =
    lineStyle === "dashed" ? "4px 4px" : lineStyle === "dotted" ? "2px 2px" : undefined;

  const isHorizontal = axis === "y";

  const getLabelPosition = () => {
    if (isHorizontal) {
      const x =
        labelPosition === "start"
          ? ctx.margin.left + 10
          : labelPosition === "end"
            ? ctx.width - ctx.margin.right - 10
            : (ctx.margin.left + ctx.width - ctx.margin.right) / 2;

      return { x, y: position };
    } else {
      const y =
        labelPosition === "start"
          ? ctx.margin.top + 20
          : labelPosition === "end"
            ? ctx.height - ctx.margin.bottom - 10
            : (ctx.margin.top + ctx.height - ctx.margin.bottom) / 2;

      return { x: position, y };
    }
  };

  const labelPos = getLabelPosition();

  return (
    <>
      {/* Line */}
      <div
        className="absolute pointer-events-none"
        style={{
          ...(isHorizontal
            ? {
                top: position,
                left: ctx.margin.left,
                width: ctx.width - ctx.margin.left - ctx.margin.right,
                height: thickness,
                borderTop: borderStyleCSS ? `${thickness}px ${lineStyle} ${color}` : undefined,
                backgroundColor: borderStyleCSS ? "transparent" : color,
              }
            : {
                left: position,
                top: ctx.margin.top,
                height: ctx.height - ctx.margin.top - ctx.margin.bottom,
                width: thickness,
                borderLeft: borderStyleCSS ? `${thickness}px ${lineStyle} ${color}` : undefined,
                backgroundColor: borderStyleCSS ? "transparent" : color,
              }),
          opacity: 0.8,
          zIndex: 20,
        }}
      />

      {/* Label */}
      {showLabel && label && (
        <div
          className="absolute px-2 py-1 text-xs font-mono rounded pointer-events-none"
          style={{
            left: labelPos.x,
            top: labelPos.y,
            transform: isHorizontal
              ? labelPosition === "end"
                ? "translate(-100%, -50%)"
                : labelPosition === "start"
                  ? "translate(0, -50%)"
                  : "translate(-50%, -50%)"
              : labelPosition === "end"
                ? "translate(-50%, -100%)"
                : labelPosition === "start"
                  ? "translate(-50%, 0)"
                  : "translate(-50%, -50%)",
            backgroundColor: color,
            color: "#fff",
            opacity: 0.9,
            zIndex: 30,
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

// ============================================================================
// Region/Span Annotations (for marking time ranges or segments)
// ============================================================================

export interface ChartRegionProps {
  /**
   * Start X coordinate in data space
   */
  startX: number;

  /**
   * End X coordinate in data space
   */
  endX: number;

  /**
   * Label for the region
   */
  label?: string;

  /**
   * Region color
   */
  color?: string;

  /**
   * Region opacity
   */
  opacity?: number;

  /**
   * Show label
   */
  showLabel?: boolean;
}

export function ChartRegion({
  startX,
  endX,
  label,
  color = "#3b82f6",
  opacity = 0.1,
  showLabel = true,
}: ChartRegionProps) {
  const ctx = useBaseChart();

  const getScreenX = (dataX: number) => {
    const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
    const normalizedX = (dataX - ctx.xDomain[0]) / (ctx.xDomain[1] - ctx.xDomain[0]);
    return ctx.margin.left + normalizedX * innerWidth;
  };

  const x1 = getScreenX(startX);
  const x2 = getScreenX(endX);
  const width = x2 - x1;

  return (
    <>
      {/* Shaded region */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: x1,
          top: ctx.margin.top,
          width: Math.max(0, width),
          height: ctx.height - ctx.margin.top - ctx.margin.bottom,
          backgroundColor: color,
          opacity,
          zIndex: 15,
        }}
      />

      {/* Label */}
      {showLabel && label && width > 40 && (
        <div
          className="absolute px-2 py-1 text-xs font-medium rounded pointer-events-none"
          style={{
            left: x1 + width / 2,
            top: ctx.margin.top + 10,
            transform: "translateX(-50%)",
            backgroundColor: color,
            color: "#fff",
            opacity: 0.9,
            zIndex: 30,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

// ============================================================================
// Ruler/Measurement Tool
// ============================================================================

export interface Measurement {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
}

export interface ChartRulerProps {
  /**
   * Callback when measurement is complete
   */
  onMeasure?: (measurement: Measurement) => void;

  /**
   * Array of completed measurements to render on the chart
   */
  measurements?: Measurement[];

  /**
   * Ruler color
   */
  color?: string;

  /**
   * Enable ruler mode
   */
  enabled?: boolean;

  /**
   * Show measurement values on completed measurements
   */
  showValues?: boolean;
}

export function ChartRuler({
  onMeasure,
  measurements = [],
  color = "#f59e0b",
  enabled = true,
  showValues = true,
}: ChartRulerProps) {
  const ctx = useBaseChart();
  const [startPoint, setStartPoint] = React.useState<{
    dataX: number;
    dataY: number;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [currentPoint, setCurrentPoint] = React.useState<{
    dataX: number;
    dataY: number;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const screenToData = React.useCallback(
    (screenX: number, screenY: number) => {
      const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
      const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;
      const relX = screenX - ctx.margin.left;
      const relY = screenY - ctx.margin.top;

      const dataX = ctx.xDomain[0] + (relX / innerWidth) * (ctx.xDomain[1] - ctx.xDomain[0]);
      const dataY =
        ctx.yDomain[0] + ((innerHeight - relY) / innerHeight) * (ctx.yDomain[1] - ctx.yDomain[0]);

      return { dataX, dataY };
    },
    [ctx]
  );

  const dataToScreen = React.useCallback(
    (dataX: number, dataY: number) => {
      const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
      const innerHeight = ctx.height - ctx.margin.top - ctx.margin.bottom;

      const normalizedX = (dataX - ctx.xDomain[0]) / (ctx.xDomain[1] - ctx.xDomain[0]);
      const normalizedY = (dataY - ctx.yDomain[0]) / (ctx.yDomain[1] - ctx.yDomain[0]);

      const x = ctx.margin.left + normalizedX * innerWidth;
      const y = ctx.height - ctx.margin.bottom - normalizedY * innerHeight;

      return { x, y };
    },
    [ctx]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;

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

    const { dataX, dataY } = screenToData(screenX, screenY);
    setStartPoint({ dataX, dataY, screenX, screenY });
    setCurrentPoint({ dataX, dataY, screenX, screenY });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !startPoint) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = Math.max(
      ctx.margin.left,
      Math.min(ctx.width - ctx.margin.right, e.clientX - rect.left)
    );
    const screenY = Math.max(
      ctx.margin.top,
      Math.min(ctx.height - ctx.margin.bottom, e.clientY - rect.top)
    );

    const { dataX, dataY } = screenToData(screenX, screenY);
    setCurrentPoint({ dataX, dataY, screenX, screenY });
  };

  const handleMouseUp = () => {
    if (!isDragging || !startPoint || !currentPoint) {
      setIsDragging(false);
      setStartPoint(null);
      setCurrentPoint(null);
      return;
    }

    setIsDragging(false);

    const deltaX = currentPoint.dataX - startPoint.dataX;
    const deltaY = currentPoint.dataY - startPoint.dataY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const measurement: Measurement = {
      startX: startPoint.dataX,
      startY: startPoint.dataY,
      endX: currentPoint.dataX,
      endY: currentPoint.dataY,
      deltaX,
      deltaY,
      distance,
    };

    onMeasure?.(measurement);

    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  if (!enabled) return null;

  return (
    <>
      {/* Overlay for capturing clicks */}
      <div
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          zIndex: 25,
          cursor: isDragging ? "crosshair" : "crosshair",
          pointerEvents: "auto",
        }}
      />

      {/* Completed measurements */}
      {measurements.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 30 }}
          width={ctx.width}
          height={ctx.height}
        >
          {measurements.map((m, i) => {
            const start = dataToScreen(m.startX, m.startY);
            const end = dataToScreen(m.endX, m.endY);
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            return (
              <g key={i}>
                {/* Line */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  opacity={0.6}
                />
                {/* Start point */}
                <circle
                  cx={start.x}
                  cy={start.y}
                  r={3}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  opacity={0.8}
                />
                {/* End point */}
                <circle
                  cx={end.x}
                  cy={end.y}
                  r={3}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  opacity={0.8}
                />
                {/* Label */}
                {showValues && (
                  <text
                    x={midX}
                    y={midY - 10}
                    textAnchor="middle"
                    fill={color}
                    fontSize="10"
                    fontFamily="monospace"
                    opacity={0.8}
                  >
                    {`ΔX:${m.deltaX.toFixed(1)} ΔY:${m.deltaY.toFixed(1)}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* Current measurement line (while dragging) */}
      {isDragging && startPoint && currentPoint && (
        <>
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 35 }}
            width={ctx.width}
            height={ctx.height}
          >
            {/* Line */}
            <line
              x1={startPoint.screenX}
              y1={startPoint.screenY}
              x2={currentPoint.screenX}
              y2={currentPoint.screenY}
              stroke={color}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            {/* Start point */}
            <circle
              cx={startPoint.screenX}
              cy={startPoint.screenY}
              r={4}
              fill={color}
              stroke="#fff"
              strokeWidth={2}
            />
            {/* End point */}
            <circle
              cx={currentPoint.screenX}
              cy={currentPoint.screenY}
              r={4}
              fill={color}
              stroke="#fff"
              strokeWidth={2}
            />
          </svg>

          {/* Measurement label */}
          <div
            className="absolute px-2 py-1 text-xs font-mono rounded shadow-lg pointer-events-none"
            style={{
              left: (startPoint.screenX + currentPoint.screenX) / 2,
              top: (startPoint.screenY + currentPoint.screenY) / 2 - 30,
              transform: "translate(-50%, 0)",
              backgroundColor: color,
              color: "#fff",
              zIndex: 40,
              whiteSpace: "pre-line",
            }}
          >
            {`ΔX: ${(currentPoint.dataX - startPoint.dataX).toFixed(2)}\nΔY: ${(
              currentPoint.dataY - startPoint.dataY
            ).toFixed(2)}`}
          </div>
        </>
      )}
    </>
  );
}
