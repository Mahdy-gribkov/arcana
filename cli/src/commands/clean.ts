import { existsSync, readdirSync, lstatSync, readlinkSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { ui, banner } from "../utils/ui.js";
import { getDirSize } from "../utils/fs.js";

export async function cleanCommand(opts: { dryRun?: boolean }): Promise<void> {
  banner();

  const dryRun = opts.dryRun ?? false;
  if (dryRun) console.log(ui.warn("  DRY RUN - no files will be deleted\n"));

  let totalReclaimed = 0;
  let actions = 0;

  // 1. Clean broken symlinks
  const symlinkDir = join(homedir(), ".claude", "skills");
  if (existsSync(symlinkDir)) {
    for (const entry of readdirSync(symlinkDir)) {
      const fullPath = join(symlinkDir, entry);
      try {
        const stat = lstatSync(fullPath);
        if (stat.isSymbolicLink()) {
          const target = readlinkSync(fullPath);
          if (!existsSync(target)) {
            if (!dryRun) rmSync(fullPath);
            console.log(`  ${ui.dim("Remove broken symlink:")} ${entry}`);
            actions++;
          }
        }
      } catch { /* skip */ }
    }
  }

  // 2. Clean orphaned Claude project dirs
  const projectsDir = join(homedir(), ".claude", "projects");
  if (existsSync(projectsDir)) {
    for (const entry of readdirSync(projectsDir)) {
      const projDir = join(projectsDir, entry);
      if (!statSync(projDir).isDirectory()) continue;

      // Skip memory/ and other special dirs
      if (entry === "memory" || entry.startsWith(".")) continue;

      // Check for session data staleness (no files modified in 90+ days)
      let newest = 0;
      try {
        for (const file of readdirSync(projDir)) {
          const stat = statSync(join(projDir, file));
          if (stat.mtimeMs > newest) newest = stat.mtimeMs;
        }
      } catch { continue; }

      const daysOld = (Date.now() - newest) / (1000 * 60 * 60 * 24);
      if (daysOld > 90) {
        const size = getDirSize(projDir);
        totalReclaimed += size;
        const mb = (size / (1024 * 1024)).toFixed(1);
        if (!dryRun) rmSync(projDir, { recursive: true, force: true });
        console.log(`  ${ui.dim("Remove stale project data:")} ${entry} ${ui.dim(`(${mb} MB, ${Math.floor(daysOld)}d old)`)}`);
        actions++;
      }
    }
  }

  console.log();
  if (actions > 0) {
    const mb = (totalReclaimed / (1024 * 1024)).toFixed(1);
    const verb = dryRun ? "Would reclaim" : "Reclaimed";
    console.log(ui.success(`  ${actions} items cleaned. ${verb} ${mb} MB.`));
  } else {
    console.log(ui.success("  Nothing to clean. Environment is tidy."));
  }
  console.log();
}
