export interface ApiProp {
  name: string;
  type: string;
  default: string;
  description: string;
}

interface ApiReferenceTableProps {
  props: ApiProp[];
}

export function ApiReferenceTable({ props }: ApiReferenceTableProps) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th className="text-left p-3 font-semibold">Prop</th>
            <th className="text-left p-3 font-semibold">Type</th>
            <th className="text-left p-3 font-semibold">Default</th>
            <th className="text-left p-3 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {props.map((prop, index) => (
            <tr key={prop.name + index}>
              <td className="p-3 font-mono text-xs">{prop.name}</td>
              <td className="p-3 font-mono text-xs">{prop.type}</td>
              <td
                className={`p-3 ${
                  prop.default === "required"
                    ? "text-zinc-600 dark:text-zinc-400"
                    : "font-mono text-xs"
                }`}
              >
                {prop.default}
              </td>
              <td className="p-3 text-zinc-600 dark:text-zinc-400">{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
