/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */

import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs-extra";
import * as path from "path";

/**
 * Check which dependencies are already installed in the current project
 */
export async function getInstalledDependencies(): Promise<Set<string>> {
  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, "package.json");

  if (!(await fs.pathExists(packageJsonPath))) {
    return new Set();
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath);
    const installed = new Set<string>();

    // Check both dependencies and devDependencies
    if (packageJson.dependencies) {
      Object.keys(packageJson.dependencies).forEach((dep) => installed.add(dep));
    }
    if (packageJson.devDependencies) {
      Object.keys(packageJson.devDependencies).forEach((dep) => installed.add(dep));
    }

    return installed;
  } catch {
    return new Set();
  }
}

/**
 * Install npm dependencies and dev dependencies
 */
export async function installDependencies(deps: string[], devDeps: string[]): Promise<void> {
  const cwd = process.cwd();

  try {
    if (deps.length > 0) {
      console.log(chalk.dim("\n📦 Installing dependencies..."));
      execSync(`npm install ${deps.join(" ")}`, {
        cwd,
        stdio: "inherit",
      });
    }

    if (devDeps.length > 0) {
      console.log(chalk.dim("\n📦 Installing dev dependencies..."));
      execSync(`npm install -D ${devDeps.join(" ")}`, {
        cwd,
        stdio: "inherit",
      });
    }
  } catch (_error) {
    throw new Error(
      `Failed to install dependencies. Please run manually:\n` +
        (deps.length > 0 ? `  npm install ${deps.join(" ")}\n` : "") +
        (devDeps.length > 0 ? `  npm install -D ${devDeps.join(" ")}` : "")
    );
  }
}
