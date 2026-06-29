import * as path from "node:path";
import fs from "fs-extra";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/**
 * Detect the package manager used by the project at `cwd`.
 * Prefers the lockfile on disk, then the `npm_config_user_agent` of the
 * process that invoked the CLI (set by npx/pnpm dlx/yarn dlx/bunx), then npm.
 */
export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) {
    return "bun";
  }
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm";

  const ua = process.env.npm_config_user_agent || "";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("bun")) return "bun";

  return "npm";
}

/**
 * Build the install command for a set of packages with the given package
 * manager. `dev` controls whether they are installed as devDependencies.
 */
export function installCommand(pm: PackageManager, deps: string[], dev: boolean): string {
  const list = deps.join(" ");
  switch (pm) {
    case "pnpm":
      return `pnpm add ${dev ? "-D " : ""}${list}`;
    case "yarn":
      return `yarn add ${dev ? "-D " : ""}${list}`;
    case "bun":
      return `bun add ${dev ? "-d " : ""}${list}`;
    default:
      return `npm install ${dev ? "-D " : ""}${list}`;
  }
}
