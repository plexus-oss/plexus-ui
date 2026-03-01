"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { addHours, addMinutes, differenceInMinutes } from "date-fns";
import * as React from "react";
import { formatTimeInZone } from "../lib/timezone";
import { cn, normalizeDate } from "../lib/utils";
const GanttContext = React.createContext(null);
function useGantt() {
    const ctx = React.useContext(GanttContext);
    if (!ctx)
        throw new Error("useGantt must be used within GanttChart.Root");
    return ctx;
}
// ============================================================================
// Utilities
// ============================================================================
function createTimeScale(domain, range) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    const domainMs = d1.getTime() - d0.getTime();
    const rangePixels = r1 - r0;
    return (date) => {
        const ms = date.getTime() - d0.getTime();
        return r0 + (ms / domainMs) * rangePixels;
    };
}
function getTaskColor(task) {
    if (task.color)
        return task.color;
    if (task.status === "completed")
        return "rgb(16, 185, 129)";
    if (task.status === "in-progress")
        return "rgb(59, 130, 246)";
    if (task.status === "blocked")
        return "rgb(239, 68, 68)";
    if (task.status === "planned")
        return "rgb(139, 92, 246)";
    return "rgb(99, 102, 241)";
}
const TimelineHeader = React.memo(({ width, leftPanelWidth }) => {
    const { startTime, endTime, xScale, timezone, use12HourFormat } = useGantt();
    // Calculate pixels per hour to determine label density
    const timelineWidth = width - leftPanelWidth;
    const totalHours = differenceInMinutes(endTime, startTime) / 60;
    const pixelsPerHour = timelineWidth / totalHours;
    // Determine hour interval based on available space
    // More space = show more labels, less space = show fewer labels
    const hourInterval = React.useMemo(() => {
        if (pixelsPerHour >= 80)
            return 1; // Show all hours
        if (pixelsPerHour >= 40)
            return 2; // Show every 2 hours
        if (pixelsPerHour >= 25)
            return 3; // Show every 3 hours
        if (pixelsPerHour >= 20)
            return 4; // Show every 4 hours
        if (pixelsPerHour >= 12)
            return 6; // Show every 6 hours
        return 12; // Show every 12 hours
    }, [pixelsPerHour]);
    // Generate hour markers
    const hours = React.useMemo(() => {
        const result = [];
        let current = new Date(startTime);
        while (current <= endTime) {
            result.push(new Date(current));
            current = addHours(current, 1);
        }
        return result;
    }, [startTime, endTime]);
    return (_jsxs("g", { children: [_jsx("rect", { x: 0, y: 0, width: width, height: 40, fill: "currentColor", opacity: 0.03 }), _jsx("line", { x1: 0, y1: 40, x2: width, y2: 40, stroke: "currentColor", strokeWidth: 1, opacity: 0.1 }), _jsx("text", { x: 12, y: 25, fontSize: 11, fontWeight: 600, fill: "currentColor", opacity: 0.5, children: "CONTACT" }), _jsx("line", { x1: leftPanelWidth, y1: 0, x2: leftPanelWidth, y2: 40, stroke: "currentColor", strokeWidth: 1, opacity: 0.1 }), hours.map((hour, i) => {
                const x = xScale(hour);
                const isMidnight = hour.getHours() === 0;
                const currentHour = hour.getHours();
                const shouldShowLabel = isMidnight || currentHour % hourInterval === 0;
                if (!shouldShowLabel)
                    return null;
                const timeLabel = formatTimeInZone(hour, timezone, use12HourFormat);
                const dateLabel = isMidnight
                    ? new Intl.DateTimeFormat("en-US", {
                        timeZone: timezone,
                        month: "short",
                        day: "numeric",
                    }).format(hour)
                    : null;
                // Adjust font sizes based on zoom level
                const timeFontSize = pixelsPerHour >= 40 ? 10 : pixelsPerHour >= 20 ? 9 : 8;
                const dateFontSize = pixelsPerHour >= 40 ? 9 : 8;
                return (_jsxs("g", { children: [dateLabel && (_jsx("text", { x: x + 4, y: 14, fontSize: dateFontSize, fontWeight: 700, fill: "currentColor", opacity: 0.7, children: dateLabel })), _jsx("text", { x: x + 4, y: dateLabel ? 32 : 25, fontSize: timeFontSize, fontWeight: isMidnight ? 700 : 600, fill: "currentColor", opacity: isMidnight ? 0.8 : 0.6, children: timeLabel })] }, i));
            })] }));
});
TimelineHeader.displayName = "TimelineHeader";
const TaskRow = React.memo(({ taskGroup, index, leftPanelWidth, variant }) => {
    const { rowHeight, xScale, hoveredTask, setHoveredTask, onTaskClick, timezone, use12HourFormat } = useGantt();
    const y = 40 + index * rowHeight;
    const isAnyHovered = taskGroup.tasks.some((task) => hoveredTask === task.id);
    return (_jsxs("g", { children: [_jsx("rect", { x: 0, y: y, width: leftPanelWidth, height: rowHeight, fill: "currentColor", opacity: isAnyHovered ? 0.03 : 0 }), _jsx("line", { x1: 0, y1: y + rowHeight, x2: leftPanelWidth, y2: y + rowHeight, stroke: "currentColor", strokeWidth: 1, opacity: 0.05 }), _jsx("text", { x: 12, y: y + rowHeight / 2 + 4, fontSize: variant === "compact" ? 11 : 12, fontWeight: 500, fill: "currentColor", opacity: 0.9, children: taskGroup.name }), variant === "detailed" && taskGroup.description && (_jsx("text", { x: 12, y: y + rowHeight / 2 + 18, fontSize: 10, fill: "currentColor", opacity: 0.5, children: taskGroup.description })), taskGroup.tasks.map((task) => {
                const start = normalizeDate(task.start);
                const end = normalizeDate(task.end);
                const x1 = xScale(start);
                const x2 = xScale(end);
                const barWidth = Math.max(x2 - x1, 4);
                const color = getTaskColor(task);
                const isHovered = hoveredTask === task.id;
                const durationMinutes = differenceInMinutes(end, start);
                return (
                // biome-ignore lint/a11y/noStaticElementInteractions: SVG group with hover state for tooltip display
                _jsxs("g", { onMouseEnter: () => setHoveredTask(task.id), onMouseLeave: () => setHoveredTask(null), children: [_jsx("rect", { x: x1, y: y + rowHeight * 0.35, width: barWidth, height: rowHeight * 0.3, rx: 3, fill: color, opacity: 0.2 }), _jsx("rect", { x: x1, y: y + rowHeight * 0.35, width: barWidth, height: rowHeight * 0.3, rx: 3, fill: color, opacity: 0.8 }), _jsx("rect", { x: x1, y: y + rowHeight * 0.35, width: barWidth, height: rowHeight * 0.3, rx: 3, fill: "none", stroke: color, strokeWidth: isHovered ? 2 : 1 }), onTaskClick && (_jsx("foreignObject", { x: x1, y: y + rowHeight * 0.35, width: barWidth, height: rowHeight * 0.3, children: _jsx("button", { type: "button", onClick: () => onTaskClick(task), "aria-label": `${task.name} task`, style: {
                                    width: "100%",
                                    height: "100%",
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    borderRadius: "3px",
                                } }) })), barWidth > 40 && (_jsxs("text", { x: x1 + 6, y: y + rowHeight / 2 + 3, fontSize: 10, fontWeight: 500, fill: "white", children: [durationMinutes, "m"] })), isHovered && (_jsxs("g", { children: [_jsx("rect", { x: x1 - 4, y: y - 40, width: Math.max(barWidth + 8, 200), height: task.description ? 48 : 36, rx: 6, fill: "#000000", opacity: 0.9, stroke: "rgba(255, 255, 255, 0.2)", strokeWidth: 1 }), _jsx("text", { x: x1 + 4, y: y - 24, fontSize: 11, fontWeight: 600, fill: "#ffffff", children: task.name }), _jsxs("text", { x: x1 + 4, y: y - 12, fontSize: 10, fill: "#ffffff", opacity: 0.8, children: [formatTimeInZone(start, timezone, use12HourFormat), " \u2192", " ", formatTimeInZone(end, timezone, use12HourFormat), " (", durationMinutes, "m)"] }), task.description && (_jsx("text", { x: x1 + 4, y: y, fontSize: 9, fill: "#ffffff", opacity: 0.7, children: task.description }))] }))] }, task.id));
            })] }));
});
TaskRow.displayName = "TaskRow";
const GridLines = React.memo(({ leftPanelWidth, totalHeight }) => {
    const { startTime, endTime, xScale, taskGroups, rowHeight, extendedWidth } = useGantt();
    // Generate 15-minute intervals
    const intervals = React.useMemo(() => {
        const result = [];
        let current = new Date(startTime);
        while (current <= endTime) {
            result.push({
                time: new Date(current),
                isHour: current.getMinutes() === 0,
            });
            current = addMinutes(current, 15);
        }
        return result;
    }, [startTime, endTime]);
    return (_jsxs("g", { children: [intervals.map((interval, i) => {
                const x = xScale(interval.time);
                return (_jsx("line", { x1: x, y1: 40, x2: x, y2: totalHeight, stroke: "currentColor", strokeWidth: interval.isHour ? 1 : 0.5, opacity: interval.isHour ? 0.1 : 0.05 }, `v-${i}`));
            }), taskGroups.map((_, i) => {
                const y = 40 + (i + 1) * rowHeight;
                return (_jsx("line", { x1: leftPanelWidth, y1: y, x2: extendedWidth, y2: y, stroke: "currentColor", strokeWidth: 1, opacity: 0.05 }, `h-${i}`));
            }), _jsx("line", { x1: leftPanelWidth, y1: 40, x2: leftPanelWidth, y2: totalHeight, stroke: "currentColor", strokeWidth: 1, opacity: 0.1 })] }));
});
GridLines.displayName = "GridLines";
// ============================================================================
// Primitives
// ============================================================================
/**
 * Root component - provides context for all child components
 */
const GanttChartRoot = React.forwardRef(({ tasks, timezone = "UTC", width: providedWidth, rowHeight = 48, timeWindowHours = 12, startTime: providedStartTime, interactive = true, onTaskClick, variant = "default", use12HourFormat = false, className, children, }, ref) => {
    const [hoveredTask, setHoveredTask] = React.useState(null);
    const [zoomLevel, setZoomLevel] = React.useState(1);
    const [containerWidth, setContainerWidth] = React.useState(providedWidth || 1200);
    const scrollContainerRef = React.useRef(null);
    const rootRef = React.useRef(null);
    // Infinite scroll state - track time range expansion
    const [timeRangeOffset, setTimeRangeOffset] = React.useState({
        startDays: 15, // Days before base time
        endDays: 15, // Days after base time
    });
    // Observe container width for responsiveness
    React.useEffect(() => {
        // If width is explicitly provided, use it and don't observe
        if (providedWidth) {
            setContainerWidth(providedWidth);
            return;
        }
        const element = rootRef.current;
        if (!element)
            return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                if (width > 0) {
                    setContainerWidth(width);
                }
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [providedWidth]);
    // Use containerWidth instead of fixed width
    const width = containerWidth;
    // Group tasks by name
    const taskGroups = React.useMemo(() => {
        const groups = new Map();
        for (const task of tasks) {
            if (!groups.has(task.name)) {
                groups.set(task.name, {
                    name: task.name,
                    tasks: [],
                    description: task.description,
                });
            }
            groups.get(task.name).tasks.push(task);
        }
        return Array.from(groups.values());
    }, [tasks]);
    // Layout
    const leftPanelWidth = variant === "detailed" ? 240 : variant === "compact" ? 160 : 200;
    const totalHeight = 40 + taskGroups.length * rowHeight;
    // Apply zoom to time window
    const effectiveTimeWindowHours = timeWindowHours / zoomLevel;
    // Calculate time window with infinite scroll support
    const { startTime, endTime, initialScrollPosition, totalScrollHours } = React.useMemo(() => {
        const now = new Date();
        const baseStart = providedStartTime ? normalizeDate(providedStartTime) : now;
        // Create a scrollable timeline that expands dynamically
        const start = addHours(baseStart, -timeRangeOffset.startDays * 24);
        const end = addHours(baseStart, timeRangeOffset.endDays * 24);
        const totalHours = (timeRangeOffset.startDays + timeRangeOffset.endDays) * 24;
        return {
            startTime: start,
            endTime: end,
            initialScrollPosition: baseStart,
            totalScrollHours: totalHours,
        };
    }, [providedStartTime, timeRangeOffset]);
    const pixelsPerHour = (width - leftPanelWidth) / effectiveTimeWindowHours;
    const extendedWidth = leftPanelWidth + totalScrollHours * pixelsPerHour;
    const xScale = React.useMemo(() => createTimeScale([startTime, endTime], [leftPanelWidth, extendedWidth]), [startTime, endTime, leftPanelWidth, extendedWidth]);
    // Function to scroll to current time
    const scrollToNow = React.useCallback(() => {
        if (!scrollContainerRef.current)
            return;
        const container = scrollContainerRef.current;
        const viewportWidth = container.clientWidth - leftPanelWidth;
        const oneHourInPixels = viewportWidth / effectiveTimeWindowHours;
        const actualNow = new Date();
        const nowPosition = xScale(actualNow);
        const scrollPosition = nowPosition - leftPanelWidth - oneHourInPixels;
        container.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: "smooth",
        });
    }, [xScale, leftPanelWidth, effectiveTimeWindowHours]);
    const contextValue = React.useMemo(() => ({
        tasks,
        taskGroups,
        timezone,
        rowHeight,
        startTime,
        endTime,
        xScale,
        hoveredTask: interactive ? hoveredTask : null,
        setHoveredTask: interactive ? setHoveredTask : () => { },
        onTaskClick: interactive ? onTaskClick : undefined,
        variant,
        leftPanelWidth,
        totalHeight,
        width,
        extendedWidth,
        scrollContainerRef,
        initialScrollPosition,
        zoomLevel,
        setZoomLevel,
        timeWindowHours: effectiveTimeWindowHours,
        use12HourFormat,
        setTimeRangeOffset,
        scrollToNow,
    }), [
        tasks,
        taskGroups,
        timezone,
        rowHeight,
        startTime,
        endTime,
        xScale,
        hoveredTask,
        interactive,
        onTaskClick,
        variant,
        leftPanelWidth,
        totalHeight,
        width,
        extendedWidth,
        initialScrollPosition,
        zoomLevel,
        effectiveTimeWindowHours,
        use12HourFormat,
        scrollToNow,
    ]);
    // Combine refs
    const combinedRef = React.useCallback((node) => {
        rootRef.current = node;
        if (typeof ref === "function") {
            ref(node);
        }
        else if (ref) {
            ref.current = node;
        }
    }, [ref]);
    return (_jsx(GanttContext.Provider, { value: contextValue, children: _jsx("div", { ref: combinedRef, className: cn("gantt-chart", className), style: { width: providedWidth ? `${providedWidth}px` : "100%" }, children: children }) }));
});
GanttChartRoot.displayName = "GanttChart.Root";
/**
 * Container component - wraps the scrollable SVG content with border and rounded corners
 */
const GanttChartContainer = React.forwardRef(({ className, style, children, ...props }, ref) => {
    return (_jsx("div", { ref: ref, className: cn("gantt-chart-container", className), style: {
            position: "relative",
            width: "100%",
            borderRadius: "8px",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            ...style,
        }, ...props, children: children }));
});
GanttChartContainer.displayName = "GanttChart.Container";
/**
 * Viewport component - handles horizontal scrolling and contains the SVG timeline
 */
const GanttChartViewport = React.forwardRef(({ className, children, ...props }, ref) => {
    const { scrollContainerRef, extendedWidth, totalHeight, xScale, leftPanelWidth, timeWindowHours, width, setTimeRangeOffset, } = useGantt();
    const [isDragging, setIsDragging] = React.useState(false);
    const [startX, setStartX] = React.useState(0);
    const [scrollLeft, setScrollLeft] = React.useState(0);
    const hasInitialized = React.useRef(false);
    const lastXScaleRef = React.useRef(null);
    // Set initial scroll position to show "now" with ~1 hour of history visible
    React.useEffect(() => {
        if (!scrollContainerRef.current)
            return;
        // Only skip if we've already initialized with THIS xScale
        // This allows re-initialization when xScale changes (e.g., after resize)
        if (hasInitialized.current && lastXScaleRef.current === xScale)
            return;
        const container = scrollContainerRef.current;
        // Use requestAnimationFrame to ensure layout is complete before scrolling
        const scrollToInitialPosition = () => {
            if (!container)
                return;
            // Use width from context to match xScale calculation
            const viewportWidth = width - leftPanelWidth;
            // Wait for proper dimensions
            if (viewportWidth <= 0) {
                requestAnimationFrame(scrollToInitialPosition);
                return;
            }
            // Calculate the pixel width for 1 hour of time (consistent with xScale)
            const oneHourInPixels = viewportWidth / timeWindowHours;
            // Always scroll to the actual current time
            const actualNow = new Date();
            const nowPosition = xScale(actualNow);
            const scrollPosition = nowPosition - leftPanelWidth - oneHourInPixels;
            container.scrollTo({
                left: Math.max(0, scrollPosition),
                behavior: "auto",
            });
            hasInitialized.current = true;
            lastXScaleRef.current = xScale;
        };
        requestAnimationFrame(scrollToInitialPosition);
    }, [xScale, leftPanelWidth, timeWindowHours, width, scrollContainerRef.current]);
    // Infinite scroll detection
    React.useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container)
            return;
        let isExpanding = false;
        const handleScroll = () => {
            if (isExpanding)
                return;
            const scrollPosition = container.scrollLeft;
            const maxScroll = container.scrollWidth - container.clientWidth;
            const threshold = container.clientWidth; // Expand when within 1 viewport width of edge
            // Expand left (past)
            if (scrollPosition < threshold) {
                isExpanding = true;
                const oldScrollWidth = container.scrollWidth;
                setTimeRangeOffset((prev) => {
                    // Calculate scroll adjustment before updating
                    setTimeout(() => {
                        if (container) {
                            const newScrollWidth = container.scrollWidth;
                            const addedWidth = newScrollWidth - oldScrollWidth;
                            container.scrollLeft = scrollPosition + addedWidth;
                            isExpanding = false;
                        }
                    }, 10);
                    return {
                        startDays: prev.startDays + 7, // Add 7 days to the past
                        endDays: prev.endDays,
                    };
                });
            }
            // Expand right (future)
            if (maxScroll - scrollPosition < threshold) {
                isExpanding = true;
                setTimeRangeOffset((prev) => {
                    setTimeout(() => {
                        isExpanding = false;
                    }, 10);
                    return {
                        startDays: prev.startDays,
                        endDays: prev.endDays + 7, // Add 7 days to the future
                    };
                });
            }
        };
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [scrollContainerRef, setTimeRangeOffset]);
    // Drag to scroll handlers
    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current)
            return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };
    const handleMouseLeave = () => {
        setIsDragging(false);
    };
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    const handleMouseMove = (e) => {
        if (!isDragging || !scrollContainerRef.current)
            return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: `
        .gantt-chart-viewport::-webkit-scrollbar {
          display: none;
        }
      ` }), _jsx("div", { ref: scrollContainerRef, className: "gantt-chart-viewport", role: "application", "aria-label": "Gantt chart timeline", style: {
                    overflowX: "auto",
                    overflowY: "hidden",
                    width: "100%",
                    cursor: isDragging ? "grabbing" : "grab",
                    userSelect: "none",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }, onMouseDown: handleMouseDown, onMouseLeave: handleMouseLeave, onMouseUp: handleMouseUp, onMouseMove: handleMouseMove, children: _jsx("svg", { ref: ref, width: extendedWidth, height: totalHeight, className: cn("gantt-chart-svg", className), style: { display: "block" }, role: "img", "aria-label": "Gantt chart", ...props, children: children }) })] }));
});
GanttChartViewport.displayName = "GanttChart.Viewport";
/**
 * Grid component - renders the timeline grid with vertical time intervals and horizontal row dividers
 */
const GanttChartGrid = React.forwardRef(({ className, children, ...props }, ref) => {
    const { leftPanelWidth, totalHeight } = useGantt();
    return (_jsxs("g", { ref: ref, className: cn("gantt-chart-grid", className), ...props, children: [_jsx(GridLines, { leftPanelWidth: leftPanelWidth, totalHeight: totalHeight }), children] }));
});
GanttChartGrid.displayName = "GanttChart.Grid";
/**
 * Header component - renders the timeline header with hour markers and date labels
 */
const GanttChartHeader = React.forwardRef(({ className, children, ...props }, ref) => {
    const { extendedWidth, leftPanelWidth } = useGantt();
    return (_jsxs("g", { ref: ref, className: cn("gantt-chart-header", className), ...props, children: [_jsx(TimelineHeader, { width: extendedWidth, leftPanelWidth: leftPanelWidth }), children] }));
});
GanttChartHeader.displayName = "GanttChart.Header";
/**
 * Tasks component - renders all task bars with interactive hover effects and tooltips
 */
const GanttChartTasks = React.forwardRef(({ className, children, ...props }, ref) => {
    const { taskGroups, leftPanelWidth, variant } = useGantt();
    return (_jsxs("g", { ref: ref, className: cn("gantt-chart-tasks", className), ...props, children: [taskGroups.map((taskGroup, i) => (_jsx(TaskRow, { taskGroup: taskGroup, index: i, leftPanelWidth: leftPanelWidth, variant: variant }, taskGroup.name))), children] }));
});
GanttChartTasks.displayName = "GanttChart.Tasks";
/**
 * Current time indicator component - displays a red vertical line and dot showing current time position
 * Updates every second to track real-time progress
 */
const GanttChartCurrentTime = React.forwardRef(({ className, children, ...props }, ref) => {
    const [currentTime, setCurrentTime] = React.useState(null);
    const [isMounted, setIsMounted] = React.useState(false);
    const { startTime, endTime, xScale, totalHeight } = useGantt();
    // Set initial time and mounted state on client only
    React.useEffect(() => {
        setIsMounted(true);
        setCurrentTime(new Date());
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    // Don't render until mounted on client to avoid hydration mismatch
    if (!isMounted || !currentTime)
        return null;
    // Use raw Date object - no timezone conversion needed
    // The xScale already handles the positioning correctly
    const now = currentTime;
    if (now < startTime || now > endTime)
        return null;
    const x = xScale(now);
    return (_jsxs("g", { ref: ref, className: cn("gantt-chart-current-time", className), ...props, children: [_jsx("line", { x1: x, y1: 40, x2: x, y2: totalHeight, stroke: "rgb(239, 68, 68)", strokeWidth: 2, strokeDasharray: "4,4", opacity: 0.7 }), _jsx("circle", { cx: x, cy: 25, r: 4, fill: "rgb(239, 68, 68)" }), children] }));
});
GanttChartCurrentTime.displayName = "GanttChart.CurrentTime";
/**
 * Left panel component - sticky task names panel that remains visible during horizontal scrolling
 */
const GanttChartLeftPanel = React.forwardRef(({ className, style, children, ...props }, ref) => {
    const { leftPanelWidth, totalHeight, taskGroups, rowHeight, variant } = useGantt();
    return (_jsxs("div", { ref: ref, className: cn("gantt-chart-left-panel", className), style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: `${leftPanelWidth}px`,
            height: `${totalHeight}px`,
            pointerEvents: "none",
            zIndex: 10,
            ...style,
        }, ...props, children: [_jsxs("svg", { width: leftPanelWidth, height: totalHeight, role: "img", "aria-label": "Task names panel", children: [_jsx("rect", { x: 0, y: 0, width: leftPanelWidth, height: 40, fill: "var(--background)", opacity: 0.98 }), _jsx("line", { x1: 0, y1: 40, x2: leftPanelWidth, y2: 40, stroke: "currentColor", strokeWidth: 1, opacity: 0.1 }), _jsx("text", { x: 12, y: 25, fontSize: 11, fontWeight: 600, fill: "currentColor", opacity: 0.5, children: "CONTACT" }), taskGroups.map((taskGroup, i) => {
                        const y = 40 + i * rowHeight;
                        return (_jsxs("g", { children: [_jsx("rect", { x: 0, y: y, width: leftPanelWidth, height: rowHeight, fill: "var(--background)", opacity: 0.98 }), _jsx("line", { x1: 0, y1: y + rowHeight, x2: leftPanelWidth, y2: y + rowHeight, stroke: "currentColor", strokeWidth: 1, opacity: 0.05 }), _jsx("text", { x: 12, y: y + rowHeight / 2 + 4, fontSize: variant === "compact" ? 11 : 12, fontWeight: 500, fill: "currentColor", opacity: 0.9, children: taskGroup.name }), variant === "detailed" && taskGroup.description && (_jsx("text", { x: 12, y: y + rowHeight / 2 + 18, fontSize: 10, fill: "currentColor", opacity: 0.5, children: taskGroup.description }))] }, taskGroup.name));
                    }), _jsx("line", { x1: leftPanelWidth, y1: 0, x2: leftPanelWidth, y2: totalHeight, stroke: "currentColor", strokeWidth: 1, opacity: 0.1 })] }), children] }));
});
GanttChartLeftPanel.displayName = "GanttChart.LeftPanel";
/**
 * Controls component - provides zoom in/out buttons for adjusting the timeline view
 */
const GanttChartControls = React.forwardRef(({ className, style, children, ...props }, ref) => {
    const { zoomLevel, setZoomLevel, scrollToNow } = useGantt();
    return (_jsxs("div", { ref: ref, className: cn("gantt-chart-controls flex items-center gap-2", className), style: style, ...props, children: [_jsxs("button", { type: "button", onClick: scrollToNow, className: "inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors gap-1.5", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", role: "img", "aria-label": "Clock icon", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("polyline", { points: "12 6 12 12 16 14" })] }), _jsx("span", { className: "text-xs", children: "Live" })] }), _jsx("div", { className: "w-px h-5 bg-zinc-200 dark:bg-zinc-700" }), _jsx("button", { type: "button", onClick: () => setZoomLevel(Math.max(0.25, zoomLevel - 0.25)), disabled: zoomLevel <= 0.25, className: "inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:pointer-events-none", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", role: "img", "aria-label": "Zoom out icon", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "m21 21-4.35-4.35" }), _jsx("line", { x1: "8", y1: "11", x2: "14", y2: "11" })] }) }), _jsxs("span", { className: "text-xs font-mono text-zinc-600 dark:text-zinc-400 min-w-12 text-center", children: [zoomLevel, "x"] }), _jsx("button", { type: "button", onClick: () => setZoomLevel(Math.min(4, zoomLevel + 0.25)), disabled: zoomLevel >= 4, className: "inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:pointer-events-none", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", role: "img", "aria-label": "Zoom in icon", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "m21 21-4.35-4.35" }), _jsx("line", { x1: "11", y1: "8", x2: "11", y2: "14" }), _jsx("line", { x1: "8", y1: "11", x2: "14", y2: "11" })] }) }), children] }));
});
GanttChartControls.displayName = "GanttChart.Controls";
// ============================================================================
// All-in-One Component
// ============================================================================
/**
 * All-in-one Gantt chart component with default composition
 * This is the simplest way to use the component - just pass tasks!
 */
export const GanttChart = React.forwardRef((props, ref) => {
    return (_jsxs(GanttChartRoot, { ref: ref, ...props, children: [_jsx("div", { className: "flex justify-end p-4 w-full", children: _jsx(GanttChartControls, {}) }), _jsxs(GanttChartContainer, { children: [_jsxs(GanttChartViewport, { children: [_jsx(GanttChartGrid, {}), _jsx(GanttChartHeader, {}), _jsx(GanttChartTasks, {}), _jsx(GanttChartCurrentTime, {})] }), _jsx(GanttChartLeftPanel, {})] })] }));
});
GanttChart.displayName = "GanttChart";
// Attach primitives for composition API
GanttChart.Root = GanttChartRoot;
GanttChart.Container = GanttChartContainer;
GanttChart.Viewport = GanttChartViewport;
GanttChart.Grid = GanttChartGrid;
GanttChart.Header = GanttChartHeader;
GanttChart.Tasks = GanttChartTasks;
GanttChart.CurrentTime = GanttChartCurrentTime;
GanttChart.LeftPanel = GanttChartLeftPanel;
GanttChart.Controls = GanttChartControls;
//# sourceMappingURL=gantt.js.map