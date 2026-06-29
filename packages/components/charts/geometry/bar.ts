/**
 * Bar geometry — rectangles for bar/column charts.
 */

interface BarDataPoint {
  x: number | string;
  y: number;
}

export function createBarGeometry(
  points: BarDataPoint[],
  xScale: (x: number) => number,
  yScale: (y: number) => number,
  color: [number, number, number],
  barWidth: number,
  orientation: "vertical" | "horizontal",
  categoryMap: Map<string | number, number>,
  seriesIndex: number,
  totalSeries: number,
  grouped: boolean,
  baseValue: number,
  /** Stacked mode: running total below this series at category x. */
  previousTotal?: (x: number | string) => number
) {
  const positions: number[] = [];
  const colors: number[] = [];

  const effectiveBarWidth = grouped ? barWidth / totalSeries : barWidth;
  const barOffset = grouped ? seriesIndex * effectiveBarWidth : 0;

  for (const point of points) {
    const categoryValue = categoryMap.get(point.x) ?? 0;
    // Stacked bars sit on the running total and rise by this series' value above
    // the baseline; unstacked bars run from the baseline to the value.
    const stackBase = previousTotal ? previousTotal(point.x) : baseValue;
    const stackTop = previousTotal ? stackBase + (point.y - baseValue) : point.y;

    if (orientation === "vertical") {
      const centerX = xScale(categoryValue);
      const x =
        centerX - (grouped ? totalSeries * effectiveBarWidth : effectiveBarWidth) / 2 + barOffset;
      const y0 = yScale(stackBase);
      const y1 = yScale(stackTop);
      const width = effectiveBarWidth;

      const yTop = Math.min(y0, y1);
      const yBottom = Math.max(y0, y1);

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
      const x0 = xScale(stackBase);
      const x1 = xScale(stackTop);
      const height = effectiveBarWidth;

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

    for (let i = 0; i < 6; i++) colors.push(...color, 0.85);
  }

  return { positions, colors };
}
