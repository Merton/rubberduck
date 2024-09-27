#!/usr/bin/env node

import { program } from "commander";
import { run } from "./index";

program
  .version("1.0.0")
  .description("AI Coding assistant")
  .action(async () => {
    await run();
  });

program.parse(process.argv);
