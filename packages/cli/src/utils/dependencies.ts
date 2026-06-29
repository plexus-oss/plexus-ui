/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */

import { execSync } from "node:child_process";
import * as path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";
import { detectPackageManager, installCommand } from "./package-manager.js";

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
  const pm = detectPackageManager(cwd);

  try {
    if (deps.length > 0) {
      console.log(chalk.dim(`\n📦 Installing dependencies with ${pm}...`));
      execSync(installCommand(pm, deps, false), {
        cwd,
        stdio: "inherit",
      });
    }

    if (devDeps.length > 0) {
      console.log(chalk.dim(`\n📦 Installing dev dependencies with ${pm}...`));
      execSync(installCommand(pm, devDeps, true), {
        cwd,
        stdio: "inherit",
      });
    }
  } catch (_error) {
    throw new Error(
      `Failed to install dependencies. Please run manually:\n` +
        (deps.length > 0 ? `  ${installCommand(pm, deps, false)}\n` : "") +
        (devDeps.length > 0 ? `  ${installCommand(pm, devDeps, true)}` : "")
    );
  }
}
