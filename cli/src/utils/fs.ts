import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { SkillFile, SkillMeta } from "../types.js";
import { loadConfig } from "../utils/config.js";
import { atomicWriteSync } from "./atomic.js";

export function getInstallDir(): string {
  return loadConfig().installDir;
}

export function getDirSize(dir: string): number {
  let size = 0;
  const queue = [dir];
  while (queue.length > 0) {
    const current = queue.pop()!;
    try {
      for (const entry of readdirSync(current)) {
        const full = join(current, entry);
        try {
          const stat = statSync(full);
          if (stat.isDirectory()) queue.push(full);
          else size += stat.size;
        } catch { /* skip unreadable entries */ }
      }
    } catch { /* skip unreadable dirs */ }
  }
  return size;
}

export function installSkill(skillName: string, files: SkillFile[]): string {
  const installDir = getInstallDir();
  const skillDir = join(installDir, skillName);
  const tempDir = skillDir + ".installing";

  // Crash recovery: remove leftover temp dir from a previous failed install
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }

  mkdirSync(tempDir, { recursive: true });

  try {
    for (const file of files) {
      const filePath = join(tempDir, file.path);
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(filePath, file.content, "utf-8");
    }

    // Remove old skill dir if it exists, then atomically rename temp to final
    if (existsSync(skillDir)) {
      rmSync(skillDir, { recursive: true, force: true });
    }
    renameSync(tempDir, skillDir);
  } catch (err) {
    // Clean up temp dir on failure
    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* best-effort */ }
    throw err;
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
  atomicWriteSync(join(skillDir, META_FILE), JSON.stringify(meta, null, 2) + "\n");
}
