#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { add } from "./commands/add.js";
import { diff } from "./commands/diff.js";
import { init } from "./commands/init.js";
import { list } from "./commands/list.js";

// Read version from package.json so it can never drift from the published version
const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../package.json"), "utf-8")
);

const program = new Command();

program
  .name("plexus-ui")
  .description("Add Plexus UI aerospace components to your project")
  .version(pkg.version);

program
  .command("init")
  .description("Initialize your project for Plexus UI components")
  .action(init);

program
  .command("add")
  .description("Add components to your project")
  .argument("[components...]", "components to add")
  .option("--overwrite", "overwrite existing files without prompting")
  .action(add);

program
  .command("list")
  .description("List all available components")
  .option("-c, --category <category>", "filter by category (3d, charts, orbital, primitives)")
  .action((options) => {
    list(options);
  });

program
  .command("diff")
  .description("Check if a component has updates")
  .argument("<component>", "component name to check")
  .action(diff);

program.parse();
