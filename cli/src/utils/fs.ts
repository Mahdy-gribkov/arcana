import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { SkillFile, SkillMeta } from "../types.js";

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

const META_FILE = ".arcana-meta.json";

export function readSkillMeta(skillName: string): SkillMeta | null {
  const metaPath = join(getInstallDir(), skillName, META_FILE);
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, "utf-8")) as SkillMeta;
  } catch {
    return null;
  }
}

export function writeSkillMeta(skillName: string, meta: SkillMeta): void {
  const skillDir = join(getInstallDir(), skillName);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, META_FILE), JSON.stringify(meta, null, 2) + "\n", "utf-8");
}
