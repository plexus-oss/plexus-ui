import type { PlexusConfig } from "./config.js";

/**
 * Transform relative imports to use configured aliases for better tree-shaking
 *
 * Examples:
 * - `import { cn } from "../lib/utils"` -> `import { cn } from "@/components/plexusui/lib/utils"`
 * - `import type { CSSColor } from "../lib/types"` -> `import type { CSSColor } from "@/components/plexusui/lib/types"`
 */
export function transformImports(content: string, config: PlexusConfig | null): string {
  if (!config) return content;

  const plexusAlias = config.aliases.plexusui;

  // Match import statements with relative paths to lib
  // Matches: import { ... } from "../lib/..."
  // Matches: import type { ... } from "../lib/..."
  const importRegex =
    /import\s+(type\s+)?(\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+["']\.\.\/lib\/([^"']+)["']/g;

  return content.replace(importRegex, (match, typeKeyword, imports, libPath) => {
    // Remove .js, .ts, .tsx extensions if present
    const cleanPath = libPath.replace(/\.(js|ts|tsx)$/, "");

    // Build the new import with the alias
    const type = typeKeyword ? "type " : "";
    return `import ${type}${imports} from "${plexusAlias}/lib/${cleanPath}"`;
  });
}
