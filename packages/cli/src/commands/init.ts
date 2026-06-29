import { execSync } from "node:child_process";
import * as path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";
import ora from "ora";
import prompts from "prompts";
import {
  detectPackageManager,
  detectProjectStructure,
  installCommand,
  type PlexusConfig,
} from "../utils/index.js";

/**
 * Ensure the project's tsconfig.json maps the `@/*` alias the generated
 * config (and the component imports) rely on. No-op for JS projects.
 */
async function ensureTsconfigPaths(cwd: string, hasSrc: boolean) {
  const tsconfigPath = path.join(cwd, "tsconfig.json");
  if (!(await fs.pathExists(tsconfigPath))) return;

  const target = hasSrc ? "./src/*" : "./*";

  // biome-ignore lint/suspicious/noExplicitAny: tsconfig is free-form JSON
  let tsconfig: any;
  try {
    tsconfig = await fs.readJson(tsconfigPath);
  } catch {
    console.log(chalk.yellow("\n⚠️  Could not parse tsconfig.json automatically."));
    console.log(chalk.dim(`   Map "@/*" → "${target}" so component imports resolve.`));
    return;
  }

  if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
  const compilerOptions = tsconfig.compilerOptions;
  if (!compilerOptions.paths) compilerOptions.paths = {};
  const paths = compilerOptions.paths;
  if (paths["@/*"]) return; // already wired

  const { addPath } = await prompts({
    type: "confirm",
    name: "addPath",
    message: `Add "@/*" → "${target}" path alias to tsconfig.json?`,
    initial: true,
  });

  if (!addPath) {
    console.log(chalk.dim(`   Skipped. Add it manually so "@/..." imports resolve.`));
    return;
  }

  if (compilerOptions.baseUrl === undefined) compilerOptions.baseUrl = ".";
  paths["@/*"] = [target];
  await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
  console.log(chalk.green('\n✅ Added "@/*" path alias to tsconfig.json'));
}

export async function init() {
  const cwd = process.cwd();
  const configPath = path.join(cwd, "plexusui.config.json");

  console.log(chalk.bold("\n🚀 Welcome to Plexus UI!\n"));

  // Check if config already exists
  if (await fs.pathExists(configPath)) {
    console.log(chalk.yellow("⚠️  plexusui.config.json already exists."));
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "Overwrite existing configuration?",
      initial: false,
    });

    if (!overwrite) {
      console.log(chalk.dim("\nKeeping existing configuration."));
      return;
    }
  }

  // Check if package.json exists
  const packageJsonPath = path.join(cwd, "package.json");
  if (!(await fs.pathExists(packageJsonPath))) {
    console.log(chalk.red("❌ No package.json found. Please run this in a Node.js project."));
    return;
  }

  console.log(chalk.dim("This will configure Plexus UI for your project.\n"));

  // Detect project structure
  const structure = await detectProjectStructure();

  // Prompt for configuration
  const config = await prompts([
    {
      type: "confirm",
      name: "typescript",
      message: "Use TypeScript?",
      initial: true,
    },
    {
      type: "text",
      name: "componentsPath",
      message: "Where should components be installed?",
      initial: structure.hasSrc ? "src/components" : "components",
    },
  ]);

  if (config.componentsPath === undefined) {
    console.log(chalk.red("\n❌ Configuration cancelled."));
    return;
  }

  const spinner = ora("Creating configuration...").start();

  try {
    // Compute aliases based on user input.
    // The `@/*` alias already maps into `src/` on src-based projects, so a
    // leading `src/` must be stripped — otherwise we'd emit `@/src/components`
    // which resolves to `src/src/components`.
    const componentsPath = config.componentsPath;
    const plexusuiPath = path.join(componentsPath, "plexusui");
    const hasAtSymbol = componentsPath.startsWith("@/");

    const aliasBase = componentsPath.replace(/^src\//, "");
    const componentsAlias = hasAtSymbol ? componentsPath : `@/${aliasBase}`;
    const utilsAlias = "@/lib/utils";
    const plexusuiAlias = `${componentsAlias}/plexusui`;

    // Create config object
    const plexusConfig: PlexusConfig = {
      $schema: "https://raw.githubusercontent.com/plexus-oss/plexus-ui/main/schema.json",
      tsx: config.typescript,
      aliases: {
        components: componentsAlias,
        utils: utilsAlias,
        plexusui: plexusuiAlias,
      },
      resolvedPaths: {
        components: path.join(
          cwd,
          componentsPath.replace("@/", "").replace("src/", structure.hasSrc ? "src/" : "")
        ),
        plexusui: path.join(
          cwd,
          plexusuiPath.replace("@/", "").replace("src/", structure.hasSrc ? "src/" : "")
        ),
      },
    };

    // Write config file
    await fs.writeJson(configPath, plexusConfig, { spaces: 2 });

    spinner.succeed(chalk.green("Configuration created!"));

    console.log(chalk.dim("\n📝 Config saved to:"));
    console.log(chalk.cyan(`   ${configPath}\n`));

    // Wire the `@/*` path alias the generated config depends on
    if (config.typescript) {
      await ensureTsconfigPaths(cwd, structure.hasSrc);
    }

    const pm = detectPackageManager(cwd);
    const runtimeDeps = ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"];
    const devDeps = ["@types/react", "@types/react-dom", "@types/three"];

    // Ask about installing dependencies
    const { installDeps } = await prompts({
      type: "confirm",
      name: "installDeps",
      message: "Install required peer dependencies (react and react-dom)?",
      initial: true,
    });

    if (!installDeps) {
      console.log(chalk.yellow("\nSkipped dependency installation."));
      console.log(chalk.dim("You'll need to install these manually:\n"));
      console.log(`  ${installCommand(pm, runtimeDeps, false)}`);
      console.log(`  ${installCommand(pm, devDeps, true)}\n`);
      console.log(chalk.green("✅ Configuration complete!"));
      console.log(chalk.dim("\nAdd components with:"));
      console.log(chalk.cyan("  npx plexus-ui add line-chart"));
      return;
    }

    const depSpinner = ora(`Installing peer dependencies with ${pm}...`).start();

    // Install runtime dependencies (React + Three.js ecosystem)
    execSync(installCommand(pm, runtimeDeps, false), {
      stdio: "pipe",
      cwd,
    });

    // Install dev dependencies
    execSync(installCommand(pm, devDeps, true), {
      stdio: "pipe",
      cwd,
    });

    depSpinner.succeed(chalk.green("Dependencies installed!"));

    console.log(chalk.green("\n✅ Ready to go!"));
    console.log(chalk.dim("\nAdd components with:"));
    console.log(chalk.cyan("  npx plexus-ui add line-chart"));
    console.log(chalk.dim("\nOr interactively:"));
    console.log(chalk.cyan("  npx plexus-ui add"));
  } catch (error) {
    spinner.fail("Failed to create configuration");
    console.error(chalk.dim(error instanceof Error ? error.message : "Unknown error"));
    process.exit(1);
  }
}
