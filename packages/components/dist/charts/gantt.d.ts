import * as React from "react";
/**
 * Task status types for visual indication
 */
export type TaskStatus = "planned" | "in-progress" | "completed" | "blocked";
/**
 * Task data for Gantt chart visualization
 */
export interface Task {
    /** Unique identifier for the task */
    id: string;
    /** Display name for the task */
    name: string;
    /**
     * Task start time as Date object or Unix timestamp
     * @example new Date(), Date.now(), 1609459200000
     */
    start: Date | number;
    /**
     * Task end time as Date object or Unix timestamp
     * @example new Date(), Date.now(), 1609459200000
     */
    end: Date | number;
    /**
     * Current status of the task affecting color and appearance
     * @default "planned"
     */
    status?: TaskStatus;
    /**
     * Custom color for the task bar in any CSS color format
     * @example "#06b6d4", "rgb(6, 182, 212)"
     */
    color?: string;
    /**
     * Additional description text shown in detailed variant
     * @example "Ground station contact", "Telemetry downlink"
     */
    description?: string;
}
/**
 * Props for GanttChart.Root component
 */
export interface GanttChartRootProps {
    /**
     * Array of tasks to display on the timeline
     * @required
     */
    tasks: Task[];
    /**
     * Timezone for date formatting (IANA timezone identifier)
     * @default "UTC"
     * @example "America/Los_Angeles", "Europe/London", "Asia/Tokyo"
     */
    timezone?: string;
    /**
     * Chart width in pixels (if not provided, uses container width)
     * @example 800, 1200, 1920
     */
    width?: number;
    /**
     * Height of each task row in pixels
     * @default 48
     * @range 30-100
     */
    rowHeight?: number;
    /**
     * Time window to display in hours
     * @default 12
     * @range 1-168
     * @example 6, 12, 24, 48
     */
    timeWindowHours?: number;
    /**
     * Start time for the chart timeline as Date object or Unix timestamp
     * @default new Date() (current time)
     */
    startTime?: Date | number;
    /**
     * Enable task interactions (hover effects, click handlers)
     * @default true
     */
    interactive?: boolean;
    /**
     * Callback function invoked when a task is clicked
     * @param task The clicked task object
     * @example (task) => console.log('Clicked:', task.name)
     */
    onTaskClick?: (task: Task) => void;
    /**
     * Visual variant style preset
     * @default "default"
     */
    variant?: "default" | "compact" | "detailed";
    /**
     * Use 12-hour time format instead of 24-hour
     * @default false
     */
    use12HourFormat?: boolean;
    /**
     * Additional CSS class names
     */
    className?: string;
    /**
     * Child components (Container, Viewport, etc.)
     */
    children?: React.ReactNode;
}
/**
 * Root component - provides context for all child components
 */
declare const GanttChartRoot: React.ForwardRefExoticComponent<GanttChartRootProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Props for GanttChart.Container component
 * Wraps the scrollable SVG content with proper styling
 */
export type GanttChartContainerProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Container component - wraps the scrollable SVG content with border and rounded corners
 */
declare const GanttChartContainer: React.ForwardRefExoticComponent<GanttChartContainerProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Props for GanttChart.Viewport component
 * Handles horizontal scrolling for the timeline
 */
export type GanttChartViewportProps = React.SVGProps<SVGSVGElement>;
/**
 * Viewport component - handles horizontal scrolling and contains the SVG timeline
 */
declare const GanttChartViewport: React.ForwardRefExoticComponent<Omit<GanttChartViewportProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
/**
 * Props for GanttChart.Grid component
 * Renders vertical time grid lines and horizontal row dividers
 */
export type GanttChartGridProps = React.SVGProps<SVGGElement>;
/**
 * Grid component - renders the timeline grid with vertical time intervals and horizontal row dividers
 */
declare const GanttChartGrid: React.ForwardRefExoticComponent<Omit<GanttChartGridProps, "ref"> & React.RefAttributes<SVGGElement>>;
/**
 * Props for GanttChart.Header component
 * Renders the timeline header with time labels
 */
export type GanttChartHeaderProps = React.SVGProps<SVGGElement>;
/**
 * Header component - renders the timeline header with hour markers and date labels
 */
declare const GanttChartHeader: React.ForwardRefExoticComponent<Omit<GanttChartHeaderProps, "ref"> & React.RefAttributes<SVGGElement>>;
/**
 * Props for GanttChart.Tasks component
 * Renders all task bars on the timeline
 */
export type GanttChartTasksProps = React.SVGProps<SVGGElement>;
/**
 * Tasks component - renders all task bars with interactive hover effects and tooltips
 */
declare const GanttChartTasks: React.ForwardRefExoticComponent<Omit<GanttChartTasksProps, "ref"> & React.RefAttributes<SVGGElement>>;
/**
 * Props for GanttChart.CurrentTime component
 * Displays a vertical line indicating the current time
 */
export type GanttChartCurrentTimeProps = React.SVGProps<SVGGElement>;
/**
 * Current time indicator component - displays a red vertical line and dot showing current time position
 * Updates every second to track real-time progress
 */
declare const GanttChartCurrentTime: React.ForwardRefExoticComponent<Omit<GanttChartCurrentTimeProps, "ref"> & React.RefAttributes<SVGGElement>>;
/**
 * Props for GanttChart.LeftPanel component
 * Sticky panel displaying task names that doesn't scroll horizontally
 */
export type GanttChartLeftPanelProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Left panel component - sticky task names panel that remains visible during horizontal scrolling
 */
declare const GanttChartLeftPanel: React.ForwardRefExoticComponent<GanttChartLeftPanelProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Props for GanttChart.Controls component
 * Displays zoom controls for adjusting the timeline view
 */
export type GanttChartControlsProps = React.HTMLAttributes<HTMLDivElement>;
/**
 * Controls component - provides zoom in/out buttons for adjusting the timeline view
 */
declare const GanttChartControls: React.ForwardRefExoticComponent<GanttChartControlsProps & React.RefAttributes<HTMLDivElement>>;
/**
 * All-in-one Gantt chart component with default composition
 * This is the simplest way to use the component - just pass tasks!
 */
export declare const GanttChart: typeof GanttChartRoot & {
    Root: typeof GanttChartRoot;
    Container: typeof GanttChartContainer;
    Viewport: typeof GanttChartViewport;
    Grid: typeof GanttChartGrid;
    Header: typeof GanttChartHeader;
    Tasks: typeof GanttChartTasks;
    CurrentTime: typeof GanttChartCurrentTime;
    LeftPanel: typeof GanttChartLeftPanel;
    Controls: typeof GanttChartControls;
};
export {};
//# sourceMappingURL=gantt.d.ts.map