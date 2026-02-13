import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { SkillFile } from "../types.js";

export function getInstallDir(): string {
  return join(homedir(), ".agents", "skills");
}

export function installSkill(skillName: string, files: SkillFile[]): string {
  const installDir = getInstallDir();
  const skillDir = join(installDir, skillName);

  mkdirSync(skillDir, { recursive: true });

  for (const file of files) {
    const filePath = join(skillDir, file.path);
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, file.content, "utf-8");
  }

  return skillDir;
}

export function isSkillInstalled(skillName: string): boolean {
  const skillDir = join(getInstallDir(), skillName);
  return existsSync(join(skillDir, "SKILL.md"));
}
