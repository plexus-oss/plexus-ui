/**
 * Area fill geometry — triangulated fill between data and baseline.
 */
import type { Point } from "../base-chart";

export function createAreaGeometry(
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

  for (let i = 0; i < points.length - 1; i++) {
    const x1 = xScale(points[i].x);
    const x2 = xScale(points[i + 1].x);
    // Bottom edge: the running stack total below this series (or the baseline).
    const base1 = previousY ? previousY(points[i].x) : baseline;
    const base2 = previousY ? previousY(points[i + 1].x) : baseline;
    // Top edge: when stacked, raise this series' contribution above the stack
    // total so bands actually sum; unstacked, the top is just the raw value.
    const top1 = previousY ? base1 + (points[i].y - baseline) : points[i].y;
    const top2 = previousY ? base2 + (points[i + 1].y - baseline) : points[i + 1].y;
    const y1 = yScale(top1);
    const y2 = yScale(top2);
    const baseY1 = yScale(base1);
    const baseY2 = yScale(base2);

    positions.push(x1, y1, x2, y2, x1, baseY1, x2, y2, x2, baseY2, x1, baseY1);
    for (let j = 0; j < 6; j++) colors.push(...color, fillOpacity);
  }

  return { positions, colors };
}
