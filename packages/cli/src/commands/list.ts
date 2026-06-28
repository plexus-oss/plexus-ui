import chalk from "chalk";
import fs from "fs-extra";
import * as path from "path";
import { getAllComponents, getComponentsByCategory } from "../registry/index.js";
import { detectProjectStructure, getComponentDestinationPath } from "../utils/index.js";

async function isComponentInstalled(
  componentName: string,
  componentsDir: string,
  files: string[]
): Promise<boolean> {
  if (files.length === 0) return false;

  // Check if the main file exists
  const mainFile = files[0];
  const filePath = getComponentDestinationPath(mainFile, componentsDir);

  return await fs.pathExists(filePath);
}

export async function list(options: { category?: string } = {}) {
  console.log(chalk.bold("\n📦 Available Plexus UI Components\n"));

  const { componentsDir } = await detectProjectStructure();

  if (options.category) {
    const components = getComponentsByCategory(options.category);

    if (components.length === 0) {
      console.log(chalk.yellow(`No components found in category: ${options.category}`));
      return;
    }

    console.log(chalk.bold(`Category: ${options.category}\n`));
    for (const component of components) {
      const installed = await isComponentInstalled(component.name, componentsDir, component.files);
      const status = installed ? chalk.green("✓") : chalk.dim("○");
      console.log(`${status} ${chalk.cyan(component.name)}`);
      if (component.description) {
        console.log(chalk.dim(`    ${component.description}`));
      }
      console.log();
    }
  } else {
    // Group by category - dynamically derived from registry
    const allComponents = getAllComponents();
    const categories = [
      ...new Set(allComponents.map((c) => c.category).filter((cat) => cat !== undefined)),
    ].sort() as string[];

    for (const cat of categories) {
      const components = getComponentsByCategory(cat);
      if (components.length === 0) continue;

      console.log(chalk.bold(`${cat.toUpperCase()}`));
      for (const component of components) {
        const installed = await isComponentInstalled(
          component.name,
          componentsDir,
          component.files
        );
        const status = installed ? chalk.green("✓") : chalk.dim("○");
        console.log(`  ${status} ${chalk.cyan(component.name)}`);
        if (component.description) {
          console.log(chalk.dim(`      ${component.description}`));
        }
      }
      console.log();
    }
  }

  console.log(
    chalk.dim("Legend: ") +
      chalk.green("✓") +
      chalk.dim(" installed  ") +
      chalk.dim("○ not installed")
  );
  console.log(chalk.dim("\nTo add a component, run:"));
  console.log(chalk.cyan("  npx plexus-ui add <component-name>\n"));
}
