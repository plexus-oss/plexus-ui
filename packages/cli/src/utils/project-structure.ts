import fs from "fs-extra";
import * as path from "path";
import { loadConfig } from "./config.js";

export interface ProjectStructure {
  componentsDir: string;
  srcDir: string;
  hasSrc: boolean;
}

/**
 * Detect the project structure and determine where to install components.
 * Checks config first, then falls back to auto-detection.
 */
export async function detectProjectStructure(): Promise<ProjectStructure> {
  const cwd = process.cwd();

  // First, try to load from config
  const config = await loadConfig();
  if (config?.resolvedPaths?.plexusui) {
    const componentsDir = config.resolvedPaths.plexusui;
    const srcDir = path.dirname(config.resolvedPaths.components);
    const hasSrc = srcDir.includes("src");

    return {
      componentsDir,
      srcDir,
      hasSrc,
    };
  }

  // Fallback to auto-detection
  // Check for src/app directory (Next.js app router with src)
  if (await fs.pathExists(path.join(cwd, "src", "app"))) {
    return {
      componentsDir: path.join(cwd, "src", "components", "plexusui"),
      srcDir: path.join(cwd, "src"),
      hasSrc: true,
    };
  }

  // Check for app directory (Next.js app router)
  if (await fs.pathExists(path.join(cwd, "app"))) {
    return {
      componentsDir: path.join(cwd, "components", "plexusui"),
      srcDir: cwd,
      hasSrc: false,
    };
  }

  // Check for src/components directory (Next.js/React app)
  if (await fs.pathExists(path.join(cwd, "src", "components"))) {
    return {
      componentsDir: path.join(cwd, "src", "components", "plexusui"),
      srcDir: path.join(cwd, "src"),
      hasSrc: true,
    };
  }

  // Check for components directory
  if (await fs.pathExists(path.join(cwd, "components"))) {
    return {
      componentsDir: path.join(cwd, "components", "plexusui"),
      srcDir: cwd,
      hasSrc: false,
    };
  }

  // Default: assume components directory at root
  return {
    componentsDir: path.join(cwd, "components", "plexusui"),
    srcDir: cwd,
    hasSrc: false,
  };
}
