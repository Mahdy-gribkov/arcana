import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, renameSync, lstatSync, readlinkSync } from "node:fs";
import { join, dirname, resolve, sep } from "node:path";
import { homedir } from "node:os";
import type { SkillFile, SkillMeta } from "../types.js";
import { loadConfig } from "../utils/config.js";
import { atomicWriteSync } from "./atomic.js";

export function getInstallDir(): string {
  return loadConfig().installDir;
}

export function getSkillDir(name: string): string {
  return join(getInstallDir(), name);
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
          const stat = lstatSync(full);
          if (stat.isSymbolicLink()) continue;
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
      // Reject paths containing .. before resolving
      if (file.path.includes("..") || file.path.includes("~")) {
        throw new Error(`Path traversal blocked: ${file.path}`);
      }
      const filePath = resolve(tempDir, file.path);
      // Normalize to lowercase on Windows for case-insensitive comparison
      const normalizedFile = process.platform === "win32" ? filePath.toLowerCase() : filePath;
      const normalizedTemp = process.platform === "win32" ? (tempDir + sep).toLowerCase() : tempDir + sep;
      if (!normalizedFile.startsWith(normalizedTemp) && normalizedFile !== (process.platform === "win32" ? tempDir.toLowerCase() : tempDir)) {
        throw new Error(`Path traversal blocked: ${file.path}`);
      }
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(filePath, file.content, { encoding: "utf-8", mode: 0o644 });
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
  return existsSync(join(getSkillDir(skillName), "SKILL.md"));
}

const META_FILE = ".arcana-meta.json";

export function readSkillMeta(skillName: string): SkillMeta | null {
  const metaPath = join(getSkillDir(skillName), META_FILE);
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, "utf-8")) as SkillMeta;
  } catch {
    return null;
  }
}

export function writeSkillMeta(skillName: string, meta: SkillMeta): void {
  const skillDir = getSkillDir(skillName);
  mkdirSync(skillDir, { recursive: true });
  atomicWriteSync(join(skillDir, META_FILE), JSON.stringify(meta, null, 2) + "\n", 0o644);
}

export interface SymlinkInfo {
  name: string;
  fullPath: string;
  target: string;
  broken: boolean;
}

export function listSymlinks(): SymlinkInfo[] {
  const symlinkDir = join(homedir(), ".claude", "skills");
  if (!existsSync(symlinkDir)) return [];

  const results: SymlinkInfo[] = [];
  for (const entry of readdirSync(symlinkDir)) {
    const fullPath = join(symlinkDir, entry);
    try {
      const stat = lstatSync(fullPath);
      if (stat.isSymbolicLink()) {
        const target = readlinkSync(fullPath);
        results.push({ name: entry, fullPath, target, broken: !existsSync(target) });
      }
    } catch { /* skip unreadable */ }
  }
  return results;
}
