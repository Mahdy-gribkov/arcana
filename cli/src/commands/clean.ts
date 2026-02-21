import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { ui, banner } from "../utils/ui.js";
import { getDirSize, listSymlinks } from "../utils/fs.js";
import { clearHistory } from "../utils/history.js";

export async function cleanCommand(opts: { dryRun?: boolean; json?: boolean }): Promise<void> {
  if (!opts.json) banner();

  const dryRun = opts.dryRun ?? false;
  if (dryRun && !opts.json) console.log(ui.warn("  DRY RUN - no files will be deleted\n"));

  let totalReclaimed = 0;
  let actions = 0;
  const removedSymlinks: string[] = [];
  const removedProjects: { name: string; sizeMB: string; daysOld: number }[] = [];
  const removedCacheFiles: string[] = [];

  // 1. Clean broken symlinks
  const failedSymlinks: string[] = [];
  for (const link of listSymlinks().filter(s => s.broken)) {
    if (!dryRun) {
      try {
        rmSync(link.fullPath);
      } catch (err) {
        if (!opts.json) console.log(`  ${ui.warn("Could not remove symlink:")} ${link.name} ${ui.dim(`(${err instanceof Error ? err.message : "unknown error"})`)}`);
        failedSymlinks.push(link.name);
        continue;
      }
    }
    if (!opts.json) console.log(`  ${ui.dim("Remove broken symlink:")} ${link.name}`);
    removedSymlinks.push(link.name);
    actions++;
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
        if (!opts.json) console.log(`  ${ui.dim("Remove stale project data:")} ${entry} ${ui.dim(`(${mb} MB, ${Math.floor(daysOld)}d old)`)}`);
        removedProjects.push({ name: entry, sizeMB: mb, daysOld: Math.floor(daysOld) });
        actions++;
      }
    }
  }

  // 3. Clear action history
  if (!dryRun) clearHistory();
  if (!opts.json) console.log(`  ${ui.dim("Clear action history")}`);
  actions++;

  // 4. Clean disk cache
  const cacheDir = join(homedir(), ".arcana", "cache");
  if (existsSync(cacheDir)) {
    for (const file of readdirSync(cacheDir)) {
      if (!dryRun) {
        try {
          rmSync(join(cacheDir, file), { force: true });
        } catch { continue; }
      }
      if (!opts.json) console.log(`  ${ui.dim("Remove cached data:")} ${file}`);
      removedCacheFiles.push(file);
      actions++;
    }
  }

  if (opts.json) {
    const result: Record<string, unknown> = {
      dryRun,
      actions,
      reclaimedMB: Number((totalReclaimed / (1024 * 1024)).toFixed(1)),
      removedSymlinks,
      removedProjects,
      removedCacheFiles,
    };
    if (failedSymlinks.length > 0) result.failedSymlinks = failedSymlinks;
    console.log(JSON.stringify(result));
    return;
  }

  console.log();
  if (actions > 0) {
    const mb = (totalReclaimed / (1024 * 1024)).toFixed(1);
    const verb = dryRun ? "Would reclaim" : "Reclaimed";
    console.log(ui.success(`  ${actions} items cleaned. ${verb} ${mb} MB.`));
  } else {
    console.log(ui.dim("  Checked:"));
    console.log(ui.dim(`  - Broken symlinks in ~/.claude/skills/: ${removedSymlinks.length} found`));
    console.log(ui.dim(`  - Stale project data in ~/.claude/projects/: ${removedProjects.length} found`));
    console.log(ui.success("  Nothing to clean."));
  }
  console.log();
}
