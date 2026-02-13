import { createInterface } from "node:readline/promises";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { stdin, stdout } from "node:process";
import { getSkillDir } from "../utils/fs.js";
import { atomicWriteSync } from "../utils/atomic.js";
import { ui, banner } from "../utils/ui.js";
import { NAME_REGEX } from "../utils/frontmatter.js";

function generateSkillMd(name: string, description: string): string {
  return `---
name: ${name}
description: ${description}
---

# ${name}

${description}

## Usage

Describe how to use this skill.

## Instructions

Add your skill instructions here.
`;
}

export async function createCommand(name: string): Promise<void> {
  banner();

  if (!NAME_REGEX.test(name)) {
    console.log(ui.error("  Invalid skill name."));
    console.log(ui.dim("  Use lowercase letters, numbers, and hyphens. Must start with a letter."));
    console.log(ui.dim("  Example: my-awesome-skill"));
    console.log();
    process.exit(1);
  }

  const skillDir = getSkillDir(name);
  if (existsSync(skillDir)) {
    console.log(ui.error(`  Skill "${name}" already exists at ${skillDir}`));
    console.log(ui.dim("  Use a different name or uninstall the existing skill first."));
    console.log();
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });

  let description: string;
  try {
    description = await rl.question(ui.dim("  Description (80-1024 chars): "));
  } finally {
    rl.close();
  }

  description = description.trim();
  if (!description) {
    console.log(ui.error("\n  Description is required."));
    console.log();
    process.exit(1);
  }

  if (description.length < 80) {
    console.log(ui.warn(`\n  Description is short (${description.length} chars). Recommend 80+ for discoverability.`));
  }

  if (description.length > 1024) {
    console.log(ui.warn(`\n  Description is long (${description.length} chars). Max 1024 for marketplace.`));
  }

  mkdirSync(skillDir, { recursive: true });
  atomicWriteSync(join(skillDir, "SKILL.md"), generateSkillMd(name, description));

  console.log();
  console.log(ui.success(`  Created skill: ${ui.bold(name)}`));
  console.log(ui.dim(`  Location: ${skillDir}`));
  console.log(ui.dim("  Edit SKILL.md to add your skill instructions."));
  console.log();
}
