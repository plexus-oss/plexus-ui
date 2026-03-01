#!/usr/bin/env node

import { Command } from "commander";
import { add } from "./commands/add.js";
import { diff } from "./commands/diff.js";
import { init } from "./commands/init.js";
import { list } from "./commands/list.js";

const program = new Command();

program
  .name("plexusui")
  .description("Add Plexus UI aerospace components to your project")
  .version("0.0.11");

program
  .command("init")
  .description("Initialize your project for Plexus UI components")
  .action(init);

program
  .command("add")
  .description("Add components to your project")
  .argument("[components...]", "components to add")
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
