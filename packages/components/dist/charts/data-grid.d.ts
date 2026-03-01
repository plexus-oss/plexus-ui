/**
 * Data Grid Component
 *
 * A GPU-accelerated data table for rendering large datasets at 60fps.
 * Combines shadcn/ui table aesthetics with WebGPU performance for virtualized rendering.
 *
 * Features:
 * - WebGPU/WebGL accelerated background and grid rendering
 * - Virtual scrolling for 100k+ rows
 * - Sortable columns with customizable sort functions
 * - Theme-aware styling (dark/light mode)
 * - Customizable column widths, alignment, and formatters
 * - Row hover and click interactions
 * - Primitive composition pattern for full control
 *
 * @example
 * ```tsx
 * <DataGrid
 *   columns={[
 *     { id: "name", label: "Name", width: 200 },
 *     { id: "value", label: "Value", type: "number", alignment: "right" }
 *   ]}
 *   data={[
 *     { name: "Alpha", value: 123 },
 *     { name: "Beta", value: 456 }
 *   ]}
 *   sortable
 *   virtualScrolling
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Primitive composition for custom layouts
 * <DataGrid.Root columns={columns} data={data}>
 *   <DataGrid.Canvas />
 *   <DataGrid.Header />
 *   <DataGrid.Body />
 * </DataGrid.Root>
 * ```
 */
export type ColumnAlignment = "left" | "center" | "right";
export type ColumnType = "text" | "number" | "status" | "timestamp" | "badge";
export interface Column<T = unknown> {
    /** Unique identifier for the column */
    id: string;
    /** Display label in header */
    label: string;
    /** Fixed column width in pixels (auto-distributed if not specified) */
    width?: number;
    /** Text alignment for cells */
    alignment?: ColumnAlignment;
    /** Column data type (affects default formatting and alignment) */
    type?: ColumnType;
    /** Custom value formatter */
    formatter?: (value: T) => string;
    /** Custom sort function (if undefined, uses default sort) */
    sortFn?: (a: T, b: T) => number;
    /** Whether this column is sortable (default: true if grid is sortable) */
    sortable?: boolean;
}
export interface DataGridProps {
    /** Column definitions */
    columns: Column[];
    /** Row data (array of objects) */
    data: Record<string, unknown>[];
    /** Grid width (supports responsive values like "100%" or fixed pixels) */
    width?: number | string;
    /** Grid height (supports responsive values like "100%" or fixed pixels) */
    height?: number | string;
    /** Row height in pixels */
    rowHeight?: number;
    /** Header height in pixels */
    headerHeight?: number;
    /** Show column headers */
    showHeader?: boolean;
    /** Alternate row background colors */
    alternateRows?: boolean;
    /** Highlight row on hover */
    highlightOnHover?: boolean;
    /** Enable virtual scrolling for large datasets */
    virtualScrolling?: boolean;
    /** Enable column sorting */
    sortable?: boolean;
    /** Custom CSS class */
    className?: string;
    /** Prefer WebGPU over WebGL */
    preferWebGPU?: boolean;
    /** Callback when row is clicked */
    onRowClick?: (row: Record<string, unknown>, index: number) => void;
    /** Callback when column header is clicked (for sorting) */
    onSort?: (columnId: string, direction: "asc" | "desc" | null) => void;
}
interface RootProps extends DataGridProps {
    children: React.ReactNode;
}
export declare function DataGrid({ columns, data, width, height, rowHeight, headerHeight, showHeader, alternateRows, highlightOnHover, virtualScrolling, sortable, preferWebGPU, className, onRowClick, onSort, }: DataGridProps): import("react/jsx-runtime").JSX.Element;
export declare namespace DataGrid {
    var Root: ({ children, columns, data, width, height, rowHeight, headerHeight, showHeader, alternateRows, highlightOnHover, virtualScrolling, sortable, preferWebGPU, className, onRowClick, onSort, }: RootProps) => import("react/jsx-runtime").JSX.Element;
    var Canvas: () => import("react/jsx-runtime").JSX.Element;
    var Header: () => import("react/jsx-runtime").JSX.Element | null;
    var Body: () => import("react/jsx-runtime").JSX.Element;
}
export default DataGrid;
//# sourceMappingURL=data-grid.d.ts.map