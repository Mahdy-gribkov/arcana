import chalk from "chalk";
import ora, { type Ora } from "ora";

const AMBER = chalk.hex("#d4943a");

export const ui = {
  brand: (text: string) => AMBER.bold(text),
  success: (text: string) => chalk.green(text),
  error: (text: string) => chalk.red(text),
  warn: (text: string) => chalk.yellow(text),
  dim: (text: string) => chalk.dim(text),
  bold: (text: string) => chalk.bold(text),
  cyan: (text: string) => chalk.cyan(text),
};

export function banner(): void {
  console.log();
  console.log(ui.brand("  arcana") + ui.dim(" - universal agent skill manager"));
  console.log();
}

export function spinner(text: string): Ora {
  return ora({ text, color: "yellow" });
}

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, "");
}

function padWithAnsi(str: string, width: number): string {
  const visible = stripAnsi(str).length;
  const padding = Math.max(0, width - visible);
  return str + " ".repeat(padding);
}

export function table(rows: string[][]): void {
  if (rows.length === 0) return;

  const colWidths = rows[0].map((_, colIdx) =>
    Math.max(...rows.map((row) => stripAnsi(row[colIdx] ?? "").length))
  );

  for (const row of rows) {
    const line = row
      .map((cell, i) => padWithAnsi(cell, colWidths[i] + 2))
      .join("")
      .trimEnd();
    console.log("  " + line);
  }
}

export function errorAndExit(message: string, hint?: string): never {
  console.error();
  console.error(ui.error("  Error: ") + message);
  if (hint) {
    console.error(ui.dim("  Hint: ") + hint);
  }
  console.error();
  process.exit(1);
}
