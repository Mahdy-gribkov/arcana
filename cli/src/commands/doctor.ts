import { existsSync, readdirSync, lstatSync, readlinkSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { ui, banner } from "../utils/ui.js";
import { getInstallDir, getDirSize } from "../utils/fs.js";
import type { DoctorCheck } from "../types.js";

function checkNodeVersion(): DoctorCheck {
  const major = parseInt(process.version.slice(1));
  if (major >= 18) {
    return { name: "Node.js", status: "pass", message: `${process.version}` };
  }
  return { name: "Node.js", status: "fail", message: `${process.version} (need 18+)`, fix: "Install Node.js 18 or later" };
}

function checkInstallDir(): DoctorCheck {
  const dir = getInstallDir();
  if (!existsSync(dir)) {
    return { name: "Skills directory", status: "warn", message: "~/.agents/skills/ not found", fix: "Run: arcana install --all" };
  }
  const skills = readdirSync(dir).filter(d => statSync(join(dir, d)).isDirectory());
  return { name: "Skills directory", status: "pass", message: `${skills.length} skills installed` };
}

function checkBrokenSymlinks(): DoctorCheck {
  const symlinkDir = join(homedir(), ".claude", "skills");
  if (!existsSync(symlinkDir)) {
    return { name: "Symlinks", status: "pass", message: "No symlink directory" };
  }

  let broken = 0;
  let total = 0;
  try {
    for (const entry of readdirSync(symlinkDir)) {
      const fullPath = join(symlinkDir, entry);
      try {
        const stat = lstatSync(fullPath);
        if (stat.isSymbolicLink()) {
          total++;
          const target = readlinkSync(fullPath);
          if (!existsSync(target)) broken++;
        }
      } catch { broken++; }
    }
  } catch { /* skip */ }

  if (broken > 0) {
    return { name: "Symlinks", status: "warn", message: `${broken}/${total} broken symlinks`, fix: "Run: arcana clean" };
  }
  return { name: "Symlinks", status: "pass", message: `${total} symlinks ok` };
}

function checkGitConfig(): DoctorCheck {
  try {
    const name = execSync("git config user.name", { encoding: "utf-8" }).trim();
    const email = execSync("git config user.email", { encoding: "utf-8" }).trim();
    if (!name || !email) {
      return { name: "Git config", status: "warn", message: "Missing user.name or user.email", fix: "git config --global user.name \"Your Name\"" };
    }
    return { name: "Git config", status: "pass", message: `${name} <${email}>` };
  } catch {
    return { name: "Git config", status: "warn", message: "Git not found", fix: "Install Git from https://git-scm.com" };
  }
}

function checkArcanaConfig(): DoctorCheck {
  const configPath = join(homedir(), ".arcana", "config.json");
  if (!existsSync(configPath)) {
    return { name: "Arcana config", status: "pass", message: "Using defaults" };
  }
  try {
    JSON.parse(readFileSync(configPath, "utf-8"));
    return { name: "Arcana config", status: "pass", message: "Valid config" };
  } catch {
    return { name: "Arcana config", status: "fail", message: "Invalid JSON", fix: "Run: arcana config reset" };
  }
}

function checkDiskUsage(): DoctorCheck {
  const projectsDir = join(homedir(), ".claude", "projects");
  if (!existsSync(projectsDir)) {
    return { name: "Disk usage", status: "pass", message: "No Claude project data" };
  }

  let totalSize = 0;
  let dirCount = 0;
  try {
    for (const entry of readdirSync(projectsDir)) {
      const full = join(projectsDir, entry);
      if (statSync(full).isDirectory()) {
        dirCount++;
        totalSize += getDirSize(full);
      }
    }
  } catch { /* skip */ }

  const mb = (totalSize / (1024 * 1024)).toFixed(1);
  if (totalSize > 500 * 1024 * 1024) {
    return { name: "Disk usage", status: "warn", message: `${mb} MB across ${dirCount} projects`, fix: "Run: arcana clean" };
  }
  return { name: "Disk usage", status: "pass", message: `${mb} MB across ${dirCount} projects` };
}

function checkSkillValidity(): DoctorCheck {
  const dir = getInstallDir();
  if (!existsSync(dir)) {
    return { name: "Skill health", status: "pass", message: "No skills to check" };
  }

  let total = 0;
  let invalid = 0;
  for (const entry of readdirSync(dir)) {
    const skillDir = join(dir, entry);
    if (!statSync(skillDir).isDirectory()) continue;
    total++;
    const skillMd = join(skillDir, "SKILL.md");
    if (!existsSync(skillMd)) { invalid++; continue; }
    try {
      const content = readFileSync(skillMd, "utf-8");
      if (!content.startsWith("---")) invalid++;
    } catch { invalid++; }
  }

  if (invalid > 0) {
    return { name: "Skill health", status: "warn", message: `${invalid}/${total} skills have issues`, fix: "Run: arcana validate --all --fix" };
  }
  return { name: "Skill health", status: "pass", message: `${total} skills valid` };
}

export async function doctorCommand(): Promise<void> {
  banner();
  console.log(ui.bold("  Environment Health Check\n"));

  const checks: DoctorCheck[] = [
    checkNodeVersion(),
    checkInstallDir(),
    checkBrokenSymlinks(),
    checkSkillValidity(),
    checkGitConfig(),
    checkArcanaConfig(),
    checkDiskUsage(),
  ];

  for (const check of checks) {
    const icon = check.status === "pass" ? ui.success("[OK]")
      : check.status === "warn" ? ui.warn("[!!]")
      : ui.error("[XX]");

    console.log(`  ${icon} ${ui.bold(check.name)}: ${check.message}`);
    if (check.fix) {
      console.log(ui.dim(`    Fix: ${check.fix}`));
    }
  }

  const fails = checks.filter(c => c.status === "fail").length;
  const warns = checks.filter(c => c.status === "warn").length;
  console.log();

  if (fails > 0) {
    console.log(ui.error(`  ${fails} issue${fails > 1 ? "s" : ""} found`));
  } else if (warns > 0) {
    console.log(ui.warn(`  ${warns} warning${warns > 1 ? "s" : ""}`));
  } else {
    console.log(ui.success("  All checks passed"));
  }
  console.log();
}
