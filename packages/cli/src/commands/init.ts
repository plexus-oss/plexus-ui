import { execSync } from "node:child_process";
import * as path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";
import ora from "ora";
import prompts from "prompts";
import { detectProjectStructure, type PlexusConfig } from "../utils/index.js";

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
    // Compute aliases based on user input
    const componentsPath = config.componentsPath;
    const plexusuiPath = path.join(componentsPath, "plexusui");
    const hasAtSymbol = componentsPath.startsWith("@/");

    const componentsAlias = hasAtSymbol ? componentsPath : `@/${componentsPath}`;
    const utilsAlias = structure.hasSrc ? "@/lib/utils" : "@/lib/utils";
    const plexusuiAlias = `${componentsAlias}/plexusui`;

    // Create config object
    const plexusConfig: PlexusConfig = {
      $schema: "https://plexus.ui/schema.json",
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
      console.log("  npm install react react-dom three @react-three/fiber @react-three/drei");
      console.log("  npm install -D @types/react @types/react-dom @types/three\n");
      console.log(chalk.green("✅ Configuration complete!"));
      console.log(chalk.dim("\nAdd components with:"));
      console.log(chalk.cyan("  npx @plexusui/cli add line-chart"));
      return;
    }

    const depSpinner = ora("Installing peer dependencies...").start();

    // Install runtime dependencies (React + Three.js ecosystem)
    execSync("npm install react react-dom three @react-three/fiber @react-three/drei", {
      stdio: "pipe",
      cwd,
    });

    // Install dev dependencies
    execSync("npm install -D @types/react @types/react-dom @types/three", {
      stdio: "pipe",
      cwd,
    });

    depSpinner.succeed(chalk.green("Dependencies installed!"));

    console.log(chalk.green("\n✅ Ready to go!"));
    console.log(chalk.dim("\nAdd components with:"));
    console.log(chalk.cyan("  npx @plexusui/cli add line-chart"));
    console.log(chalk.dim("\nOr interactively:"));
    console.log(chalk.cyan("  npx @plexusui/cli add"));
  } catch (error) {
    spinner.fail("Failed to create configuration");
    console.error(chalk.dim(error instanceof Error ? error.message : "Unknown error"));
    process.exit(1);
  }
}
