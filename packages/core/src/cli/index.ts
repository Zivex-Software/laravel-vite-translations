#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./init.js";
import { codemodCommand } from "./codemod.js";
import { doctorCommand } from "./doctor.js";

const program = new Command();

program
  .name("laravel-vite-translations")
  .description("CLI tools for laravel-vite-translations")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize laravel-vite-translations in your project")
  .option("-l, --locale <locale>", "Default locale", "en")
  .option("-f, --framework <framework>", "Frontend framework (react|vue|svelte)")
  .option("--lang-path <path>", "Path to lang directory")
  .option("--no-codemod", "Skip running codemod after init")
  .action(initCommand);

program
  .command("codemod")
  .description("Convert __() and trans() calls to t()")
  .option("-d, --dir <directory>", "Directory to scan", "resources/js")
  .option("--dry-run", "Show changes without writing files")
  .action(codemodCommand);

program
  .command("doctor")
  .description("Diagnose translation issues")
  .option("-d, --dir <directory>", "Source directory to scan", "resources/js")
  .option("--lang-path <path>", "Path to lang directory")
  .option("--json", "Output as JSON")
  .action(doctorCommand);

program.parse();
