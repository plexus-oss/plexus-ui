import * as path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import registryData from "./registry.json" with { type: "json" };
import type { ComponentConfig, Registry } from "./schema.js";

/**
 * Base URL for downloading components from GitHub
 * Can be overridden with PLEXUSUI_REGISTRY_URL environment variable
 */
export const BASE_URL =
  process.env.PLEXUSUI_REGISTRY_URL ||
  "https://raw.githubusercontent.com/plexus-oss/ui/main/packages/components";

/**
 * Check if we're running in the monorepo (for local development)
 * If so, we can copy files directly from the file system
 */
export function isMonorepo(): boolean {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const componentsPath = path.resolve(__dirname, "../../../components");
    return fs.existsSync(componentsPath);
  } catch {
    return false;
  }
}

/**
 * Get local components path (only valid in monorepo)
 */
export function getLocalComponentsPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "../../../components");
}

/**
 * Convert registry data to Registry type
 * Does NOT prepend URLs - that happens at download time
 */
function loadRegistry(data: any): Registry {
  const registry: Registry = {};

  for (const [key, component] of Object.entries(data.components)) {
    registry[key] = component as ComponentConfig;
  }

  return registry;
}

/**
 * Get lib infrastructure component
 */
export function getLib(): ComponentConfig | undefined {
  return registryData.lib as ComponentConfig;
}

/**
 * Get file URL for downloading (prepends BASE_URL)
 * Use this at download time, not at registry load time
 */
export function getFileUrl(filePath: string): string {
  return `${BASE_URL}/${filePath}`;
}

/**
 * Get local file path (for monorepo development)
 */
export function getLocalFilePath(filePath: string): string {
  return path.join(getLocalComponentsPath(), filePath);
}

// Load registry from the single source of truth (registry.json)
export const registry: Registry = loadRegistry(registryData);

export function getComponent(name: string): ComponentConfig | undefined {
  return registry[name];
}

export function getAllComponents(): ComponentConfig[] {
  return Object.values(registry);
}

export function getComponentsByCategory(category: string): ComponentConfig[] {
  return Object.values(registry).filter((c) => c.category === category);
}
