"use client";

import { DataGrid } from "@plexusui/components/charts/data-grid";
import { useEffect, useState } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";

// ============================================================================
// Example 1: Real-time Telemetry Table
// ============================================================================

interface TelemetryData {
  id: string;
  timestamp: number;
  satellite: string;
  altitude: number;
  velocity: number;
  temperature: number;
  signalStrength: number;
  status: string;
}

function generateTelemetryData(count: number): TelemetryData[] {
  const satellites = ["ISS", "Hubble", "JWST", "Sentinel-1", "Landsat-9", "Terra"];
  const statuses = ["Nominal", "Warning", "Critical", "Standby"];

  return Array.from({ length: count }, (_, i) => ({
    id: `SAT-${String(i + 1).padStart(4, "0")}`,
    timestamp: Date.now() - Math.random() * 3600000,
    satellite: satellites[i % satellites.length],
    altitude: 400 + Math.random() * 200, // km
    velocity: 7.5 + Math.random() * 0.5, // km/s
    temperature: -50 + Math.random() * 100, // °C
    signalStrength: 60 + Math.random() * 40, // dBm
    status: statuses[Math.floor(Math.random() * statuses.length)],
  }));
}

function TelemetryTable() {
  const [data, setData] = useState<TelemetryData[]>(() => generateTelemetryData(50));

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData];
        // Update random rows
        for (let i = 0; i < 5; i++) {
          const idx = Math.floor(Math.random() * newData.length);
          newData[idx] = {
            ...newData[idx],
            timestamp: Date.now(),
            altitude: 400 + Math.random() * 200,
            velocity: 7.5 + Math.random() * 0.5,
            temperature: -50 + Math.random() * 100,
            signalStrength: 60 + Math.random() * 40,
          };
        }
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const columns = [
    { id: "id", label: "Satellite ID", width: 120 },
    {
      id: "timestamp",
      label: "Last Contact",
      type: "timestamp" as const,
      width: 180,
      formatter: (value: unknown) => {
        const date = new Date(value as number);
        const now = Date.now();
        const diff = now - date.getTime();
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        return `${Math.floor(minutes / 60)}h ago`;
      },
    },
    { id: "satellite", label: "Mission", width: 120 },
    {
      id: "altitude",
      label: "Altitude (km)",
      type: "number" as const,
      alignment: "right" as const,
      width: 130,
      formatter: (value: unknown) => (value as number).toFixed(1),
    },
    {
      id: "velocity",
      label: "Velocity (km/s)",
      type: "number" as const,
      alignment: "right" as const,
      width: 140,
      formatter: (value: unknown) => (value as number).toFixed(2),
    },
    {
      id: "temperature",
      label: "Temp (°C)",
      type: "number" as const,
      alignment: "right" as const,
      width: 110,
      formatter: (value: unknown) => {
        const temp = value as number;
        const sign = temp >= 0 ? "+" : "";
        return `${sign}${temp.toFixed(1)}`;
      },
    },
    {
      id: "signalStrength",
      label: "Signal (dBm)",
      type: "number" as const,
      alignment: "right" as const,
      width: 130,
      formatter: (value: unknown) => (value as number).toFixed(0),
    },
    { id: "status", label: "Status", width: 100 },
  ];

  return (
    <ComponentPreview
      title="Real-time Satellite Telemetry"
      description="GPU-accelerated data grid with live updates. Monitors 50 satellites with 60fps rendering and virtual scrolling. Updates 5 random rows every 2 seconds."
      code={`<DataGrid
  columns={[
    { id: "id", label: "Satellite ID", width: 120 },
    {
      id: "timestamp",
      label: "Last Contact",
      type: "timestamp",
      formatter: (value) => formatRelativeTime(value)
    },
    {
      id: "altitude",
      label: "Altitude (km)",
      type: "number",
      alignment: "right"
    },
    // ... more columns
  ]}
  data={telemetryData}
  sortable
  highlightOnHover
  virtualScrolling
  preferWebGPU
  width={1200}
  height={600}
  onRowClick={(row) => console.log("Selected:", row)}
/>`}
      preview={
        <DataGrid
          columns={columns}
          data={data.map((item) => ({ ...item }))}
          width="100%"
          height={600}
          sortable
          highlightOnHover
          virtualScrolling
          preferWebGPU
          onRowClick={(row) => console.log("Selected satellite:", row)}
        />
      }
    />
  );
}

// ============================================================================
// Example 2: Large Dataset with Virtual Scrolling
// ============================================================================

interface FlightData {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departure: number;
  arrival: number;
  passengers: number;
  distance: number;
  status: string;
}

function generateFlightData(count: number): FlightData[] {
  const airlines = ["Delta", "United", "American", "Southwest", "JetBlue"];
  const airports = ["JFK", "LAX", "ORD", "DFW", "ATL", "SFO", "SEA", "MIA"];
  const statuses = ["On Time", "Delayed", "Departed", "Arrived", "Cancelled"];

  return Array.from({ length: count }, (_, i) => {
    const origin = airports[Math.floor(Math.random() * airports.length)];
    let destination = airports[Math.floor(Math.random() * airports.length)];
    while (destination === origin) {
      destination = airports[Math.floor(Math.random() * airports.length)];
    }

    const departureTime = Date.now() + Math.random() * 86400000; // Within 24 hours
    const flightDuration = 1 + Math.random() * 5; // 1-6 hours

    return {
      flightNumber: `${airlines[i % airlines.length]
        .substring(0, 2)
        .toUpperCase()}${String(100 + i).padStart(4, "0")}`,
      airline: airlines[i % airlines.length],
      origin,
      destination,
      departure: departureTime,
      arrival: departureTime + flightDuration * 3600000,
      passengers: Math.floor(50 + Math.random() * 200),
      distance: Math.floor(200 + Math.random() * 3000),
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
  });
}

function FlightDashboard() {
  const [data] = useState<FlightData[]>(() => generateFlightData(10000));

  const columns = [
    { id: "flightNumber", label: "Flight", width: 100 },
    { id: "airline", label: "Airline", width: 120 },
    { id: "origin", label: "From", width: 80, alignment: "center" as const },
    { id: "destination", label: "To", width: 80, alignment: "center" as const },
    {
      id: "departure",
      label: "Departure",
      width: 140,
      formatter: (value: unknown) => new Date(value as number).toLocaleTimeString(),
    },
    {
      id: "arrival",
      label: "Arrival",
      width: 140,
      formatter: (value: unknown) => new Date(value as number).toLocaleTimeString(),
    },
    {
      id: "passengers",
      label: "PAX",
      type: "number" as const,
      alignment: "right" as const,
      width: 80,
    },
    {
      id: "distance",
      label: "Distance (mi)",
      type: "number" as const,
      alignment: "right" as const,
      width: 130,
      formatter: (value: unknown) => (value as number).toLocaleString(),
    },
    { id: "status", label: "Status", width: 100 },
  ];

  return (
    <ComponentPreview
      title="Flight Dashboard - 10,000 Rows"
      description="Virtual scrolling enables smooth 60fps rendering of 10,000 flights. Only visible rows are rendered to the DOM. GPU acceleration renders backgrounds and borders. Try scrolling and sorting!"
      code={`// Generate 10,000 rows of flight data
const flights = generateFlightData(10000);

<DataGrid
  columns={columns}
  data={flights}
  width={1200}
  height={600}
  sortable          // Enable column sorting
  virtualScrolling  // Only render visible rows
  alternateRows     // Zebra striping
  preferWebGPU      // Use WebGPU if available
/>`}
      preview={
        <DataGrid
          columns={columns}
          data={data.map((item) => ({ ...item }))}
          width="100%"
          height={600}
          sortable
          virtualScrolling
          alternateRows
          preferWebGPU
        />
      }
    />
  );
}

// ============================================================================
// Example 3: Primitive Composition
// ============================================================================

function PrimitiveCompositionExample() {
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  const data = [
    {
      id: 1,
      name: "Apollo 11",
      crew: 3,
      duration: "8d 3h",
      distance: "768,000 km",
      success: "Yes",
    },
    {
      id: 2,
      name: "Apollo 13",
      crew: 3,
      duration: "5d 23h",
      distance: "622,268 km",
      success: "Partial",
    },
    {
      id: 3,
      name: "Gemini 4",
      crew: 2,
      duration: "4d 2h",
      distance: "2,576,000 km",
      success: "Yes",
    },
    {
      id: 4,
      name: "Mercury 3",
      crew: 1,
      duration: "15m 22s",
      distance: "486 km",
      success: "Yes",
    },
    {
      id: 5,
      name: "Skylab 4",
      crew: 3,
      duration: "84d 1h",
      distance: "34,000,000 km",
      success: "Yes",
    },
  ];

  const columns = [
    { id: "name", label: "Mission", width: 200 },
    {
      id: "crew",
      label: "Crew Size",
      type: "number" as const,
      alignment: "center" as const,
      width: 120,
    },
    { id: "duration", label: "Duration", width: 150 },
    {
      id: "distance",
      label: "Distance Traveled",
      alignment: "right" as const,
      width: 200,
    },
    {
      id: "success",
      label: "Success",
      alignment: "center" as const,
      width: 130,
    },
  ];

  return (
    <ComponentPreview
      title="Primitive Composition Pattern"
      description="Use DataGrid.Root, DataGrid.Canvas, DataGrid.Header, and DataGrid.Body primitives for full control over composition and layout. Add custom components between primitives."
      code={`<DataGrid.Root
  columns={columns}
  data={missionData}
  width={1000}
  height={400}
  sortable
>
  {/* Canvas renders GPU-accelerated backgrounds */}
  <DataGrid.Canvas />

  {/* Header with sortable columns */}
  <DataGrid.Header />

  {/* Custom info banner */}
  {selectedRow && (
    <div className="absolute bottom-0 left-0 right-0 bg-blue-500/20 p-4 z-20">
      <p className="text-sm text-blue-200">
        Selected: {selectedRow.name} - {selectedRow.duration}
      </p>
    </div>
  )}

  {/* Body with virtualized rows */}
  <DataGrid.Body />
</DataGrid.Root>`}
      preview={
        <div className="relative">
          <DataGrid.Root
            columns={columns}
            data={data}
            width="100%"
            height={400}
            sortable
            highlightOnHover
            preferWebGPU
            onRowClick={(row) => setSelectedRow(row)}
          >
            <DataGrid.Canvas />
            <DataGrid.Header />
            <DataGrid.Body />

            {/* Custom overlay when row is selected */}
            {selectedRow && (
              <div className="absolute bottom-0 left-0 right-0 bg-blue-500/20 backdrop-blur-sm p-4 z-20 border-t border-blue-500/30">
                <p className="text-sm text-blue-100">
                  <span className="font-semibold">Selected Mission:</span>{" "}
                  {selectedRow.name as string} •{" "}
                  <span className="opacity-80">Duration: {selectedRow.duration as string}</span> •{" "}
                  <span className="opacity-80">Distance: {selectedRow.distance as string}</span>
                </p>
              </div>
            )}
          </DataGrid.Root>
        </div>
      }
    />
  );
}

// ============================================================================
// Example 4: Custom Formatters and Sorting
// ============================================================================

interface EngineMetric {
  engine: string;
  thrust: number;
  fuelFlow: number;
  temperature: number;
  pressure: number;
  efficiency: number;
  runtime: number;
}

function EngineMonitor() {
  const data: EngineMetric[] = [
    {
      engine: "Engine 1",
      thrust: 156.8,
      fuelFlow: 45.2,
      temperature: 1250,
      pressure: 320,
      efficiency: 94.5,
      runtime: 1245,
    },
    {
      engine: "Engine 2",
      thrust: 155.9,
      fuelFlow: 44.8,
      temperature: 1245,
      pressure: 318,
      efficiency: 95.2,
      runtime: 1248,
    },
    {
      engine: "Engine 3",
      thrust: 157.2,
      fuelFlow: 45.5,
      temperature: 1255,
      pressure: 322,
      efficiency: 94.1,
      runtime: 1242,
    },
    {
      engine: "Engine 4",
      thrust: 154.3,
      fuelFlow: 44.1,
      temperature: 1240,
      pressure: 315,
      efficiency: 95.8,
      runtime: 1250,
    },
  ];

  const columns = [
    { id: "engine", label: "Engine", width: 150 },
    {
      id: "thrust",
      label: "Thrust (kN)",
      type: "number" as const,
      alignment: "right" as const,
      width: 150,
      formatter: (value: unknown) => `${(value as number).toFixed(1)} kN`,
    },
    {
      id: "fuelFlow",
      label: "Fuel Flow (kg/s)",
      type: "number" as const,
      alignment: "right" as const,
      width: 180,
      formatter: (value: unknown) => `${(value as number).toFixed(1)} kg/s`,
    },
    {
      id: "temperature",
      label: "EGT (°C)",
      type: "number" as const,
      alignment: "right" as const,
      width: 140,
      formatter: (value: unknown) => {
        const temp = value as number;
        return `${temp}°C`;
      },
    },
    {
      id: "pressure",
      label: "Pressure (bar)",
      type: "number" as const,
      alignment: "right" as const,
      width: 160,
      formatter: (value: unknown) => `${value} bar`,
    },
    {
      id: "efficiency",
      label: "Efficiency (%)",
      type: "number" as const,
      alignment: "right" as const,
      width: 160,
      formatter: (value: unknown) => `${(value as number).toFixed(1)}%`,
    },
    {
      id: "runtime",
      label: "Runtime",
      type: "number" as const,
      alignment: "right" as const,
      width: 140,
      formatter: (value: unknown) => {
        const hours = Math.floor((value as number) / 60);
        const minutes = (value as number) % 60;
        return `${hours}h ${minutes}m`;
      },
    },
  ];

  return (
    <ComponentPreview
      title="Custom Formatters & Precision Metrics"
      description="Custom formatters display values with units, colors, and formatting. Each column can have its own formatter function for precise data presentation."
      code={`const columns = [
  {
    id: "thrust",
    label: "Thrust (kN)",
    type: "number",
    alignment: "right",
    formatter: (value) => \`\${value.toFixed(1)} kN\`
  },
  {
    id: "temperature",
    label: "EGT (°C)",
    type: "number",
    alignment: "right",
    formatter: (value) => \`\${value}°C\`
  },
  // ... more columns
];

<DataGrid columns={columns} data={engineData} />`}
      preview={
        <DataGrid
          columns={columns}
          data={data.map((item) => ({ ...item }))}
          width={1200}
          height={400}
          sortable
          highlightOnHover
          preferWebGPU
        />
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const dataGridProps: ApiProp[] = [
  {
    name: "data",
    type: "T[]",
    default: "required",
    description: "Array of data objects to display in the grid",
  },
  {
    name: "columns",
    type: "Column<T>[]",
    default: "required",
    description:
      "Column definitions. Column: { key: keyof T, header: string, width?: number, align?: 'left'|'center'|'right', formatter?: (value) => ReactNode }",
  },
  {
    name: "sortable",
    type: "boolean",
    default: "false",
    description: "Enable column sorting",
  },
  {
    name: "filterable",
    type: "boolean",
    default: "false",
    description: "Enable column filtering",
  },
  {
    name: "paginated",
    type: "boolean",
    default: "false",
    description: "Enable pagination",
  },
  {
    name: "pageSize",
    type: "number",
    default: "10",
    description: "Number of rows per page (when paginated)",
  },
  {
    name: "striped",
    type: "boolean",
    default: "true",
    description: "Alternate row background colors",
  },
  {
    name: "hoverable",
    type: "boolean",
    default: "true",
    description: "Highlight rows on hover",
  },
  {
    name: "compact",
    type: "boolean",
    default: "false",
    description: "Use compact row height",
  },
  {
    name: "onRowClick",
    type: "(row: T) => void",
    default: "undefined",
    description: "Callback when a row is clicked",
  },
  {
    name: "loading",
    type: "boolean",
    default: "false",
    description: "Show loading state",
  },
  {
    name: "emptyMessage",
    type: "string",
    default: '"No data available"',
    description: "Message to show when data is empty",
  },
  {
    name: "className",
    type: "string",
    default: '""',
    description: "Additional CSS classes",
  },
];

const columnType: ApiProp[] = [
  {
    name: "key",
    type: "keyof T",
    default: "required",
    description: "Property key from the data object",
  },
  {
    name: "header",
    type: "string | ReactNode",
    default: "required",
    description: "Column header label",
  },
  {
    name: "width",
    type: "number | string",
    default: "auto",
    description: "Column width (px or %)",
  },
  {
    name: "align",
    type: '"left" | "center" | "right"',
    default: '"left"',
    description: "Text alignment",
  },
  {
    name: "sortable",
    type: "boolean",
    default: "true",
    description: "Enable sorting for this column",
  },
  {
    name: "formatter",
    type: "(value: any, row: T) => ReactNode",
    default: "undefined",
    description: "Custom cell renderer",
  },
];

const dataGridRootProps: ApiProp[] = [
  {
    name: "data",
    type: "T[]",
    default: "required",
    description: "Array of data objects",
  },
  {
    name: "columns",
    type: "Column<T>[]",
    default: "required",
    description: "Column definitions",
  },
  {
    name: "sortable",
    type: "boolean",
    default: "false",
    description: "Enable sorting",
  },
  {
    name: "filterable",
    type: "boolean",
    default: "false",
    description: "Enable filtering",
  },
  {
    name: "paginated",
    type: "boolean",
    default: "false",
    description: "Enable pagination",
  },
  {
    name: "children",
    type: "ReactNode",
    default: "undefined",
    description: "Primitive components (Table, Header, Body, Footer, Pagination)",
  },
];

const dataGridPrimitiveProps: ApiProp[] = [
  {
    name: "DataGrid.Table",
    type: "component",
    default: "-",
    description:
      "Table container. Props: striped?: boolean, hoverable?: boolean, compact?: boolean",
  },
  {
    name: "DataGrid.Header",
    type: "component",
    default: "-",
    description: "Table header with column labels",
  },
  {
    name: "DataGrid.Body",
    type: "component",
    default: "-",
    description: "Table body with data rows",
  },
  {
    name: "DataGrid.Footer",
    type: "component",
    default: "-",
    description: "Table footer (optional)",
  },
  {
    name: "DataGrid.Pagination",
    type: "component",
    default: "-",
    description: "Pagination controls",
  },
];

// ============================================================================
// Export all examples
// ============================================================================

export function DataGridExamples() {
  return (
    <div className="space-y-12">
      {/* Examples Section */}
      <div className="space-y-8">
        <TelemetryTable />
        <FlightDashboard />
        <EngineMonitor />
        <PrimitiveCompositionExample />
      </div>

      {/* API Reference Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            DataGrid component for displaying tabular data with sorting, filtering, and pagination
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">DataGrid (All-in-One)</h3>
          <ApiReferenceTable props={dataGridProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Column Type</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Configuration for table columns
          </p>
          <ApiReferenceTable props={columnType} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">DataGrid.Root </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Root component for building custom layouts with primitives
          </p>
          <ApiReferenceTable props={dataGridRootProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primitive Components</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use with DataGrid.Root for complete control over composition
          </p>
          <ApiReferenceTable props={dataGridPrimitiveProps} />
        </div>
      </div>
    </div>
  );
}

export default DataGridExamples;
