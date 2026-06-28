import * as path from "path";

/**
 * Determine the destination path for a component file based on its source path.
 * Handles lib/, primitives/, charts/, and root-level components.
 */
export function getComponentDestinationPath(
  sourceFilePath: string,
  baseComponentsDir: string
): string {
  const filename = path.basename(sourceFilePath);
  const dirname = path.dirname(sourceFilePath);

  // Library files - preserve lib/ structure
  if (dirname.includes("lib")) {
    return path.join(baseComponentsDir, "lib", filename);
  }

  // Primitive components - preserve primitives/ structure
  if (dirname.includes("primitives")) {
    // Handle shaders subdirectory
    if (dirname.includes("shaders")) {
      return path.join(baseComponentsDir, "primitives", "shaders", filename);
    }
    return path.join(baseComponentsDir, "primitives", filename);
  }

  // Chart components - preserve charts/ structure
  if (dirname.includes("charts")) {
    return path.join(baseComponentsDir, "charts", filename);
  }

  // Regular components - place at root
  return path.join(baseComponentsDir, filename);
}

/**
 * Get the subdirectory path that needs to be created for a component file.
 * Returns null if no subdirectory is needed.
 */
export function getComponentSubdirectory(
  sourceFilePath: string,
  baseComponentsDir: string
): string | null {
  const dirname = path.dirname(sourceFilePath);

  if (dirname.includes("lib")) {
    return path.join(baseComponentsDir, "lib");
  }

  if (dirname.includes("primitives")) {
    if (dirname.includes("shaders")) {
      return path.join(baseComponentsDir, "primitives", "shaders");
    }
    return path.join(baseComponentsDir, "primitives");
  }

  if (dirname.includes("charts")) {
    return path.join(baseComponentsDir, "charts");
  }

  return null;
}
