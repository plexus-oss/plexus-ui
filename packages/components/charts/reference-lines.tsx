"use client";

import { ChartReferenceLine } from "./annotations";

export interface ReferenceLine {
  /** Y value where the line should be drawn */
  value: number;
  /** Line color */
  color?: string;
  /** Line style */
  style?: "solid" | "dashed" | "dotted";
  /** Line width */
  width?: number;
  /** Optional label to show on the line */
  label?: string;
  /** Label position */
  labelPosition?: "left" | "right";
  /** Severity for styling (critical = red, warning = yellow, info = blue) */
  severity?: "critical" | "warning" | "info";
}

interface ReferenceLineProps {
  lines: ReferenceLine[];
}

const SEVERITY_COLORS = {
  critical: "#ef4444", // red-500
  warning: "#f59e0b", // amber-500
  info: "#3b82f6", // blue-500
};

/**
 * Draw a set of horizontal threshold/limit lines on a chart.
 *
 * Thin adapter over the canonical {@link ChartReferenceLine} (`axis="y"`) so
 * the config-driven `referenceLines` prop and the annotations API share one
 * renderer instead of two near-identical overlays that drift apart. Maps the
 * severity → color shorthand and the left/right label position onto the
 * underlying start/end label anchors.
 */
export function ReferenceLines({ lines }: ReferenceLineProps) {
  if (!lines || lines.length === 0) return null;

  return (
    <>
      {lines.map((line, idx) => (
        <ChartReferenceLine
          key={idx}
          axis="y"
          value={line.value}
          label={line.label}
          showLabel={!!line.label}
          color={line.severity ? SEVERITY_COLORS[line.severity] : line.color || "#888888"}
          lineStyle={line.style || "dashed"}
          thickness={line.width ?? 1.5}
          labelPosition={line.labelPosition === "right" ? "end" : "start"}
        />
      ))}
    </>
  );
}

/**
 * Helper to convert column limits to reference lines
 */
export function limitsToReferenceLines(limits: {
  min?: number;
  max?: number;
  severity?: "critical" | "warning" | "info";
}): ReferenceLine[] {
  const lines: ReferenceLine[] = [];

  if (limits.min !== undefined) {
    lines.push({
      value: limits.min,
      severity: limits.severity || "warning",
      style: "dashed",
      label: `Min: ${limits.min}`,
      labelPosition: "left",
    });
  }

  if (limits.max !== undefined) {
    lines.push({
      value: limits.max,
      severity: limits.severity || "warning",
      style: "dashed",
      label: `Max: ${limits.max}`,
      labelPosition: "left",
    });
  }

  return lines;
}
