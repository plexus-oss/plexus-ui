/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */

import chalk from "chalk";
import fs from "fs-extra";
import ora from "ora";
import prompts from "prompts";
import {
  getComponent,
  getFileUrl,
  getLib,
  getLocalFilePath,
  isMonorepo,
  registry,
} from "../registry/index.js";
import {
  detectPackageManager,
  detectProjectStructure,
  downloadFile,
  getComponentDestinationPath,
  getComponentSubdirectory,
  getInstalledDependencies,
  installCommand,
  installDependencies,
  loadConfig,
  transformImports,
} from "../utils/index.js";

/**
 * Get file content - either from local file system (monorepo) or download from URL
 */
async function getFileContent(filePath: string): Promise<string> {
  if (isMonorepo()) {
    const localPath = getLocalFilePath(filePath);
    return await fs.readFile(localPath, "utf-8");
  } else {
    const url = getFileUrl(filePath);
    return await downloadFile(url);
  }
}

export async function add(components: string[], options: { overwrite?: boolean } = {}) {
  const availableComponents = Object.keys(registry);

  // If no components specified, prompt
  if (components.length === 0) {
    const response = await prompts({
      type: "multiselect",
      name: "components",
      message: "Which components would you like to add?",
      choices: availableComponents.map((c) => {
        const config = getComponent(c);
        return {
          title: `${c} ${config?.description ? `- ${config.description}` : ""}`,
          value: c,
          description: config?.category,
        };
      }),
      min: 1,
    });

    if (!response.components || response.components.length === 0) {
      console.log(chalk.yellow("\n❌ No components selected."));
      return;
    }

    components = response.components;
  }

  // Validate components
  const invalidComponents = components.filter(
    (c) => !availableComponents.includes(c.toLowerCase())
  );

  if (invalidComponents.length > 0) {
    console.log(chalk.red(`\n❌ Invalid components: ${invalidComponents.join(", ")}`));
    console.log(chalk.dim(`Available: ${availableComponents.join(", ")}`));
    return;
  }

  const spinner = ora("Setting up components...").start();

  try {
    // Detect project structure and load config
    const { componentsDir } = await detectProjectStructure();
    const plexusConfig = await loadConfig();

    // Create components directory
    await fs.ensureDir(componentsDir);
    spinner.text = "Resolving dependencies...";

    // Collect all components including registry dependencies
    const allComponentsToInstall = new Set<string>(components);
    const processedComponents = new Set<string>();

    function collectDependencies(componentName: string) {
      if (processedComponents.has(componentName)) return;
      processedComponents.add(componentName);

      const config = getComponent(componentName);
      if (!config) return;

      // Add registry dependencies (other plexus components this depends on)
      if (config.registryDependencies) {
        config.registryDependencies.forEach((dep) => {
          allComponentsToInstall.add(dep);
          collectDependencies(dep);
        });
      }
    }

    components.forEach(collectDependencies);

    // Detect files that already exist so we don't silently clobber local edits
    let overwrite = options.overwrite ?? false;
    if (!overwrite) {
      const existing: string[] = [];
      for (const component of allComponentsToInstall) {
        const config = component === "lib" ? getLib() : getComponent(component);
        if (!config) continue;
        for (const filePath of config.files) {
          const destPath = getComponentDestinationPath(filePath, componentsDir);
          if (await fs.pathExists(destPath)) existing.push(destPath);
        }
      }

      if (existing.length > 0) {
        spinner.stop();
        console.log(
          chalk.yellow(`\n⚠️  ${existing.length} file(s) already exist and may contain your edits:`)
        );
        existing.slice(0, 10).forEach((f) => console.log(chalk.dim(`   ${f}`)));
        if (existing.length > 10) {
          console.log(chalk.dim(`   …and ${existing.length - 10} more`));
        }

        const res = await prompts({
          type: "confirm",
          name: "value",
          message: "Overwrite existing files?",
          initial: false,
        });
        overwrite = res.value === true;
        spinner.start("Downloading components...");
      }
    }

    spinner.text = "Downloading components...";

    // Download and save each component
    const installedComponents: string[] = [];
    const skippedComponents: string[] = [];
    const skippedFiles: string[] = [];
    const failedComponents: Array<{ name: string; error: string }> = [];

    for (const component of allComponentsToInstall) {
      const config = component === "lib" ? getLib() : getComponent(component);

      if (!config) continue;

      spinner.text = `Adding ${component}...`;

      try {
        // Download or copy all files for this component
        let wroteAny = false;
        for (const filePath of config.files) {
          // Determine destination path; skip files that already exist unless
          // the user opted in to overwriting (protects local edits).
          const destPath = getComponentDestinationPath(filePath, componentsDir);
          if (!overwrite && (await fs.pathExists(destPath))) {
            skippedFiles.push(destPath);
            continue;
          }

          let content = await getFileContent(filePath);

          // Transform imports to use configured aliases for better tree-shaking
          content = transformImports(content, plexusConfig);

          const subdir = getComponentSubdirectory(filePath, componentsDir);

          if (subdir) {
            await fs.ensureDir(subdir);
          }

          await fs.outputFile(destPath, content);
          wroteAny = true;
        }
        // Only report as "added" if we actually wrote a file. A component whose
        // files all already exist (no --overwrite) is left untouched, so don't
        // claim it was installed/updated — that would mask a stale component.
        if (wroteAny) installedComponents.push(component);
        else skippedComponents.push(component);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        failedComponents.push({ name: component, error: errorMessage });
      }
    }

    // Show completion status
    if (failedComponents.length === 0) {
      if (installedComponents.length > 0) {
        spinner.succeed(chalk.green("Components added!"));
      } else {
        // Nothing was written — every requested file already existed.
        spinner.info(
          chalk.yellow(
            "Nothing to do — all files already exist. Re-run with --overwrite to update."
          )
        );
      }
    } else if (installedComponents.length > 0) {
      spinner.warn(chalk.yellow("Some components failed to install"));
    } else {
      spinner.fail(chalk.red("All components failed to install"));
    }

    // Collect all unique dependencies
    const allDeps = new Set<string>();
    const allDevDeps = new Set<string>();

    installedComponents.forEach((c) => {
      const config = getComponent(c);
      if (config) {
        config.dependencies?.forEach((dep) => allDeps.add(dep));
        config.devDependencies?.forEach((dep) => allDevDeps.add(dep));
      }
    });

    // Show results
    if (installedComponents.length > 0) {
      console.log(chalk.dim("\n✨ Components copied to:"));
      console.log(chalk.cyan(`   ${componentsDir}\n`));

      console.log(chalk.dim("📦 Installed components:"));
      installedComponents.forEach((c) => {
        const config = getComponent(c);
        console.log(
          chalk.cyan(`   • ${c}${config?.description ? ` - ${config.description}` : ""}`)
        );
      });
    }

    if (failedComponents.length > 0) {
      console.log(chalk.red("\n❌ Failed components:"));
      failedComponents.forEach(({ name, error }) => {
        console.log(chalk.red(`   • ${name}: ${error}`));
      });

      // Exit with error code if all components failed
      if (installedComponents.length === 0) {
        process.exit(1);
      }
    }

    if (skippedFiles.length > 0) {
      console.log(
        chalk.yellow(`\n⏭️  Skipped ${skippedFiles.length} existing file(s) to preserve your edits.`)
      );
      if (skippedComponents.length > 0) {
        console.log(
          chalk.dim(`   Left unchanged (already present): ${skippedComponents.join(", ")}`)
        );
      }
      console.log(chalk.dim("   Re-run with --overwrite to replace them with upstream."));
    }

    // Check what's already installed
    const installedDeps = await getInstalledDependencies();
    const missingDeps = Array.from(allDeps).filter((dep) => !installedDeps.has(dep));
    const missingDevDeps = Array.from(allDevDeps).filter((dep) => !installedDeps.has(dep));

    // Install missing dependencies
    if (missingDeps.length > 0 || missingDevDeps.length > 0) {
      console.log(chalk.dim("\n📦 Required dependencies:"));

      if (missingDeps.length > 0) {
        console.log(chalk.yellow(`   ${missingDeps.join(", ")}`));
      }
      if (missingDevDeps.length > 0) {
        console.log(chalk.yellow(`   ${missingDevDeps.join(", ")} (dev)`));
      }

      const shouldInstall = await prompts({
        type: "confirm",
        name: "value",
        message: "Install missing dependencies automatically?",
        initial: true,
      });

      if (shouldInstall.value) {
        try {
          await installDependencies(missingDeps, missingDevDeps);
          console.log(chalk.green("\n✅ Dependencies installed successfully!"));
        } catch (error) {
          console.log(
            chalk.yellow(`\n⚠️  ${error instanceof Error ? error.message : "Unknown error"}`)
          );
        }
      } else {
        const pm = detectPackageManager();
        console.log(chalk.dim("\n📦 To install dependencies manually, run:"));
        if (missingDeps.length > 0) {
          console.log(chalk.cyan(`   ${installCommand(pm, missingDeps, false)}`));
        }
        if (missingDevDeps.length > 0) {
          console.log(chalk.cyan(`   ${installCommand(pm, missingDevDeps, true)}`));
        }
      }
    } else {
      console.log(chalk.green("\n✅ All dependencies already installed!"));
    }

    console.log(chalk.dim("\n🎨 Import and use:"));
    const importAlias = plexusConfig?.aliases?.plexusui || "@/components/plexusui";

    components.forEach((c) => {
      const componentName = c
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
      console.log(chalk.cyan(`   import { ${componentName} } from '${importAlias}/${c}'`));
    });
  } catch (error) {
    spinner.fail("Failed to add components");
    console.error(chalk.red("\n❌ Error:"));
    console.error(chalk.dim(error instanceof Error ? error.message : "Unknown error"));
    if (error instanceof Error && error.stack) {
      console.error(chalk.dim("\nStack trace:"));
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}
