"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { downsampleLTTB, downsampleMinMax } from "../lib/data-utils";
import { ChartBrushSelector } from "./interactions";
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Downsample a series of data points
 */
function downsampleSeries(data, maxPoints, method, getX, getY) {
    if (data.length <= maxPoints) {
        // No downsampling needed, convert to Point[]
        return data.map((point) => ({
            x: getX(point),
            y: getY(point),
        }));
    }
    // Convert to Point[] first
    const points = data.map((point) => ({
        x: getX(point),
        y: getY(point),
    }));
    // Apply downsampling
    if (method === "lttb") {
        return downsampleLTTB(points, maxPoints);
    }
    else {
        return downsampleMinMax(points, maxPoints);
    }
}
// ============================================================================
// ChartMinimap Component
// ============================================================================
/**
 * Minimap component with range selector for navigating large datasets
 *
 * Displays a downsampled overview of the full dataset with a draggable
 * brush selector that allows users to select a visible range.
 *
 * @example Basic usage with LineChart
 * ```tsx
 * import { ChartMinimap } from "@plexusui/components/charts";
 * import { LineChart } from "@plexusui/components/charts";
 *
 * const [visibleRange, setVisibleRange] = useState({ start: 0, end: 1000 });
 *
 * <ChartMinimap
 *   series={fullDataSeries}
 *   visibleRange={visibleRange}
 *   fullRange={{ min: 0, max: 10000 }}
 *   onRangeChange={(start, end) => setVisibleRange({ start, end })}
 *   ChartComponent={LineChart.Root}
 *   CanvasComponent={LineChart.Canvas}
 *   height={80}
 * />
 * ```
 *
 * @example With BarChart and custom formatting
 * ```tsx
 * <ChartMinimap
 *   series={timeSeriesData}
 *   visibleRange={visibleRange}
 *   fullRange={{ min: startTimestamp, max: endTimestamp }}
 *   onRangeChange={(start, end) => setVisibleRange({ start, end })}
 *   ChartComponent={BarChart.Root}
 *   CanvasComponent={BarChart.Canvas}
 *   formatLabel={(timestamp) => new Date(timestamp).toLocaleDateString()}
 *   maxPoints={200}
 *   downsampleMethod="minmax"
 *   height={100}
 * />
 * ```
 */
export function ChartMinimap({ series, visibleRange, fullRange, onRangeChange, ChartComponent, chartProps = {}, height = 80, width = "100%", maxPoints = 200, downsampleMethod = "lttb", formatLabel, selectionColor = "#3b82f6", containerClass = "chart-minimap-container", getX = (point) => point.x, getY = (point) => point.y, CanvasComponent, canvasProps = {}, showAxes = false, AxesComponent, }) {
    // Downsample the data for minimap display
    const downsampledSeries = React.useMemo(() => {
        return series.map((s) => ({
            name: s.name,
            data: downsampleSeries(s.data, maxPoints, downsampleMethod, getX, getY),
            color: s.color,
        }));
    }, [series, maxPoints, downsampleMethod, getX, getY]);
    // Debug logging
    React.useEffect(() => {
        console.log("ChartMinimap - downsampledSeries:", downsampledSeries.map((s) => ({
            name: s.name,
            pointCount: s.data.length,
            firstPoint: s.data[0],
            lastPoint: s.data[s.data.length - 1],
        })));
    }, [downsampledSeries]);
    // Calculate appropriate axis configuration for minimap
    const xAxisConfig = React.useMemo(() => {
        return {
            label: undefined, // No label in minimap to save space
            domain: [fullRange.min, fullRange.max],
            formatter: formatLabel,
        };
    }, [fullRange, formatLabel]);
    const yAxisConfig = React.useMemo(() => {
        // Calculate y-domain from downsampled data
        const allYValues = downsampledSeries.flatMap((s) => s.data.map((d) => d.y));
        const yMin = Math.min(...allYValues);
        const yMax = Math.max(...allYValues);
        console.log("ChartMinimap - yDomain:", {
            yMin,
            yMax,
            allYValues: allYValues.length,
        });
        return {
            label: undefined, // No label in minimap
            domain: [yMin, yMax],
        };
    }, [downsampledSeries]);
    return (_jsx("div", { className: `relative ${containerClass}`, style: { width, height }, children: _jsxs(ChartComponent, { series: downsampledSeries, xAxis: xAxisConfig, yAxis: yAxisConfig, width: width, height: height, preferWebGPU: true, ...chartProps, children: [CanvasComponent && _jsx(CanvasComponent, { showGrid: false, ...canvasProps }), showAxes && AxesComponent && _jsx(AxesComponent, {}), _jsx(ChartBrushSelector, { start: visibleRange.start, end: visibleRange.end, fullMin: fullRange.min, fullMax: fullRange.max, onSelectionChange: onRangeChange, formatLabel: formatLabel, color: selectionColor, containerClass: containerClass })] }) }));
}
/**
 * Container component that stacks a main chart with a minimap below it
 *
 * @example
 * ```tsx
 * <MinimapContainer
 *   minimap={
 *     <ChartMinimap
 *       series={fullData}
 *       visibleRange={range}
 *       onRangeChange={setRange}
 *       {...minimapProps}
 *     />
 *   }
 * >
 *   <LineChart series={visibleData} height={400} />
 * </MinimapContainer>
 * ```
 */
export function MinimapContainer({ children, minimap, gap = 16, className = "", }) {
    return (_jsxs("div", { className: `flex flex-col ${className}`, style: { gap: `${gap}px` }, children: [_jsx("div", { className: "flex-1", children: children }), _jsx("div", { className: "flex-shrink-0", children: minimap })] }));
}
//# sourceMappingURL=chart-minimap.js.map