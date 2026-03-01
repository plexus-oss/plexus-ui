import chalk from "chalk";
import fs from "fs-extra";
import ora from "ora";
import { getComponent } from "../registry/index.js";
import {
  detectProjectStructure,
  downloadFile,
  getComponentDestinationPath,
} from "../utils/index.js";

export async function diff(componentName: string) {
  const spinner = ora(`Checking ${componentName}...`).start();

  try {
    const config = getComponent(componentName);

    if (!config) {
      spinner.fail(chalk.red(`Component "${componentName}" not found`));
      return;
    }

    const { componentsDir } = await detectProjectStructure();

    // Check if component exists locally by checking for first file
    const mainFile = config.files[0];
    const localPath = getComponentDestinationPath(mainFile, componentsDir);

    if (!(await fs.pathExists(localPath))) {
      spinner.info(chalk.yellow(`Component "${componentName}" is not installed locally`));
      console.log(chalk.dim("\nTo install it, run:"));
      console.log(chalk.cyan(`  npx @plexusui/cli add ${componentName}\n`));
      return;
    }

    // Check all files in the component
    spinner.text = "Comparing files...";
    const filesWithDiff: string[] = [];
    const missingFiles: string[] = [];
    let totalFiles = 0;

    for (const file of config.files) {
      totalFiles++;

      // Determine local file path
      const filePath = getComponentDestinationPath(file, componentsDir);

      // Check if file exists
      if (!(await fs.pathExists(filePath))) {
        missingFiles.push(file);
        continue;
      }

      // Download remote version and compare
      try {
        const remoteUrl = `https://raw.githubusercontent.com/plexus-space/ui/main/packages/components/${file}`;
        const remoteContent = await downloadFile(remoteUrl);
        const localContent = await fs.readFile(filePath, "utf-8");

        if (remoteContent !== localContent) {
          filesWithDiff.push(file);
        }
      } catch (_error) {
        // If download fails, skip this file
        console.log(chalk.dim(`\n⚠️  Could not download ${file}`));
      }
    }

    // Show results
    if (missingFiles.length > 0) {
      spinner.warn(chalk.yellow(`${componentName} is partially installed`));
      console.log(chalk.dim("\n⚠️  Missing files:"));
      missingFiles.forEach((file) => {
        console.log(chalk.yellow(`   • ${file}`));
      });
    } else if (filesWithDiff.length > 0) {
      spinner.warn(chalk.yellow(`${componentName} has updates available`));
      console.log(chalk.dim("\n📝 Files with changes:"));
      filesWithDiff.forEach((file) => {
        console.log(chalk.yellow(`   • ${file}`));
      });
      console.log(
        chalk.dim(`\n✓ ${totalFiles - filesWithDiff.length}/${totalFiles} files up to date`)
      );
    } else {
      spinner.succeed(
        chalk.green(`${componentName} is up to date! (${totalFiles}/${totalFiles} files)`)
      );
    }

    if (missingFiles.length > 0 || filesWithDiff.length > 0) {
      console.log(chalk.dim("\nTo update, run:"));
      console.log(chalk.cyan(`  npx @plexusui/cli add ${componentName}\n`));
    }
  } catch (error) {
    spinner.fail("Failed to check component");
    console.error(chalk.red("\n❌ Error:"));
    console.error(chalk.dim(error instanceof Error ? error.message : "Unknown error"));
  }
}
