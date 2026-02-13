import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { ui, banner, table } from "../utils/ui.js";

interface SessionInfo {
  project: string;
  file: string;
  sizeBytes: number;
  lines: number;
  modified: Date;
}

function discoverSessions(): SessionInfo[] {
  const projectsDir = join(homedir(), ".claude", "projects");
  if (!existsSync(projectsDir)) return [];

  const sessions: SessionInfo[] = [];

  for (const project of readdirSync(projectsDir)) {
    const projDir = join(projectsDir, project);
    if (!statSync(projDir).isDirectory()) continue;

    for (const file of readdirSync(projDir)) {
      if (!file.endsWith(".jsonl")) continue;
      const fullPath = join(projDir, file);
      const stat = statSync(fullPath);

      // Count lines without loading entire file into memory
      let lines = 0;
      try {
        const buf = readFileSync(fullPath);
        let lineCount = 0;
        for (let i = 0; i < buf.length; i++) {
          if (buf[i] === 10) lineCount++;
        }
        lines = lineCount;
      } catch {
        continue;
      }

      sessions.push({
        project,
        file,
        sizeBytes: stat.size,
        lines,
        modified: stat.mtime,
      });
    }
  }

  return sessions;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export async function statsCommand(opts: { json?: boolean }): Promise<void> {
  if (!opts.json) banner();

  const sessions = discoverSessions();

  if (sessions.length === 0) {
    console.log(ui.dim("  No session data found in ~/.claude/projects/"));
    console.log();
    return;
  }

  const totalSize = sessions.reduce((sum, s) => sum + s.sizeBytes, 0);
  const totalLines = sessions.reduce((sum, s) => sum + s.lines, 0);
  const avgLines = Math.round(totalLines / sessions.length);
  // Rough token estimate: ~15 chars per token in JSONL (includes JSON overhead)
  const estimatedTokens = Math.round(totalSize / 15);

  // Find unique projects
  const projects = new Set(sessions.map((s) => s.project));

  // Find most recent and oldest sessions
  const sorted = [...sessions].sort(
    (a, b) => b.modified.getTime() - a.modified.getTime(),
  );
  const newest = sorted[0]!;
  const oldest = sorted[sorted.length - 1]!;

  // Sessions per project (top 5)
  const projectCounts = new Map<string, number>();
  for (const s of sessions) {
    projectCounts.set(s.project, (projectCounts.get(s.project) ?? 0) + 1);
  }
  const topProjects = [...projectCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (opts.json) {
    const data = {
      totalSessions: sessions.length,
      totalProjects: projects.size,
      totalSizeBytes: totalSize,
      estimatedTokens,
      avgLinesPerSession: avgLines,
      topProjects: topProjects.map(([name, count]) => ({
        name,
        sessions: count,
      })),
    };
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log(ui.bold("  Session Analytics\n"));

  const rows: string[][] = [
    [ui.dim("Sessions"), String(sessions.length)],
    [ui.dim("Projects"), String(projects.size)],
    [ui.dim("Total data"), formatBytes(totalSize)],
    [ui.dim("Est. tokens"), `~${(estimatedTokens / 1_000_000).toFixed(1)}M (rough)`],
    [ui.dim("Avg lines/session"), String(avgLines)],
    [ui.dim("Newest session"), newest.modified.toLocaleDateString()],
    [ui.dim("Oldest session"), oldest.modified.toLocaleDateString()],
  ];
  table(rows);

  if (topProjects.length > 0) {
    console.log();
    console.log(ui.bold("  Most Active Projects\n"));
    const projRows = topProjects.map(([name, count]) => [
      ui.dim(name.length > 40 ? name.slice(0, 37) + "..." : name),
      `${count} sessions`,
    ]);
    table(projRows);
  }

  console.log();
}
