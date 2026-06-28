/**
 * Component metadata for playground
 * Loaded from the single source of truth: packages/components/registry.json
 */

import registryData from "@plexusui/components/registry.json";

export interface ComponentMetadata {
  id: string;
  name: string;
  displayName?: string;
  category: string;
  description?: string;
  files: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  tier?: "free" | "pro";
  textures?: string[];
}
/**
 * Get all components from registry regardless of category
 */
export function getAllComponentsFromRegistry(registry: any): ComponentMetadata[] {
  return Object.entries(registry.components).map(([id, component]: [string, any]) => ({
    id,
    name: component.name,
    displayName: component.displayName || component.name,
    category: component.category,
    description: component.description,
    files: component.files || [],
    dependencies: component.dependencies,
    devDependencies: component.devDependencies,
    registryDependencies: component.registryDependencies,
    tier: component.tier || "free",
    textures: component.textures || [],
  }));
}

export type ComponentTier = "free" | "pro";

export interface Component {
  id: string;
  name: string;
  category: string;
  description?: string;
  textures: string[];
  tier?: ComponentTier;
}

/**
 * Transform registry components into playground format
 */
function transformToPlaygroundFormat(
  metadata: ReturnType<typeof getAllComponentsFromRegistry>
): Component[] {
  return metadata.map((component: ComponentMetadata) => ({
    id: component.id,
    name: component.displayName || component.name,
    category: component.category.charAt(0).toUpperCase() + component.category.slice(1),
    description: component.description,
    textures: component.textures || [],
    tier: component.tier || "free",
  }));
}

export const components: Component[] = transformToPlaygroundFormat(
  getAllComponentsFromRegistry(registryData)
);
