#!/usr/bin/env node

import { createCli } from "./cli.js";

const cli = createCli();

process.on("SIGINT", () => {
  console.log();
  process.exit(130);
});

cli.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
