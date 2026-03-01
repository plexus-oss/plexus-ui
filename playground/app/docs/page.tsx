export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl mb-4">Installation</h1>
        <p className="text-lg text-gray-400 mb-8">
          Get started with Plexus UI components in your React project.
        </p>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Prerequisites</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>React 18 or higher</li>
            <li>A modern browser with WebGPU support (Chrome 113+, Edge 113+)</li>
            <li>Node.js 18 or higher</li>
          </ul>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
          <p className="text-gray-400 mb-4">
            Initialize Plexus UI in your project with a single command:
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
            <code className="text-sm font-mono text-green-400">npx @plexusui/cli init</code>
          </div>
          <p className="text-sm text-gray-500">
            This will set up the necessary configuration and directory structure for Plexus UI
            components.
          </p>
        </section>

        {/* Adding Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Adding Components</h2>
          <p className="text-gray-400 mb-4">Add individual components to your project:</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
            <code className="text-sm font-mono text-green-400">
              npx @plexusui/cli add [component-name]
            </code>
          </div>
          <p className="text-gray-400 mb-4">For example, to add the GPU-accelerated line chart:</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
            <code className="text-sm font-mono text-green-400">
              npx @plexusui/cli add gpu-line-chart
            </code>
          </div>
        </section>

        {/* List Available Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Available Components</h2>
          <p className="text-gray-400 mb-4">View all available components:</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
            <code className="text-sm font-mono text-green-400">npx @plexusui/cli list</code>
          </div>
          <p className="text-gray-400 mb-4">Filter by category:</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
            <code className="text-sm font-mono text-green-400">
              npx @plexusui/cli list --category charts
            </code>
          </div>
          <p className="text-sm text-gray-500">Categories: 3d, charts, orbital, primitives</p>
        </section>

        {/* Check for Updates */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Check for Updates</h2>
          <p className="text-gray-400 mb-4">See if a component has been updated:</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
            <code className="text-sm font-mono text-green-400">
              npx @plexusui/cli diff [component-name]
            </code>
          </div>
        </section>

        {/* Usage Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage Example</h2>
          <p className="text-gray-400 mb-4">
            Once installed, import and use components in your React application:
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm font-mono text-gray-300">
              {`import { GPULineChart } from "@/components/plexus/gpu-line-chart";

export function TelemetryDashboard() {
  const [data, setData] = useState<number[]>([]);

  return (
    <GPULineChart
      data={data}
      width={800}
      height={400}
      lineColor="#22c55e"
    />
  );
}`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Resources</h2>
          <ul className="space-y-2">
            <li>
              <a
                href="https://github.com/plexus-space/ui"
                className="text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Repository
              </a>
            </li>
            <li>
              <a
                href="https://plexus.company"
                className="text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Plexus Aerospace Platform
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
