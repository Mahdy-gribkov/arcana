import path from "node:path";
import { Provider } from "./base.js";
import type { SkillInfo, SkillFile, MarketplaceData } from "../types.js";
import { httpGet } from "../utils/http.js";

const VALID_SLUG = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;

interface GitHubTreeItem {
  path: string;
  type: string;
  url: string;
}

export function validateSlug(value: string, label: string): void {
  if (!VALID_SLUG.test(value)) {
    throw new Error(`Invalid ${label}: "${value}". Only letters, numbers, hyphens, dots, underscores allowed.`);
  }
}

export class GitHubProvider extends Provider {
  readonly name: string;
  readonly displayName: string;
  private owner: string;
  private repo: string;
  private branch: string;
  private cache: SkillInfo[] | null = null;

  constructor(
    owner: string,
    repo: string,
    opts?: { name?: string; displayName?: string; branch?: string }
  ) {
    super();
    validateSlug(owner, "owner");
    validateSlug(repo, "repo");
    this.owner = owner;
    this.repo = repo;
    this.branch = opts?.branch ?? "main";
    this.name = opts?.name ?? `${owner}/${repo}`;
    this.displayName = opts?.displayName ?? `${owner}/${repo}`;
  }

  private parseJSON<T>(raw: string, context: string): T {
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(`Failed to parse response from ${context}. The server may be down or returned invalid data.`);
    }
  }

  async list(): Promise<SkillInfo[]> {
    if (this.cache) return this.cache;

    const url = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/.claude-plugin/marketplace.json`;
    const { body: raw } = await httpGet(url);
    const data = this.parseJSON<MarketplaceData>(raw, `${this.name}/marketplace.json`);

    if (!data.plugins || !Array.isArray(data.plugins)) {
      throw new Error(`Invalid marketplace.json in ${this.name}: missing plugins array`);
    }

    this.cache = data.plugins.map((p) => ({
      name: p.name,
      description: p.description,
      version: p.version,
      source: this.name,
      repo: `https://github.com/${this.owner}/${this.repo}`,
    }));

    return this.cache;
  }

  async fetch(skillName: string): Promise<SkillFile[]> {
    validateSlug(skillName, "skill name");

    const treeUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${this.branch}?recursive=1`;
    const { body: raw } = await httpGet(treeUrl);
    const tree = this.parseJSON<{ tree: GitHubTreeItem[] }>(raw, `${this.name}/tree`);

    const prefix = `skills/${skillName}/`;
    const files = tree.tree.filter(
      (item) => item.path.startsWith(prefix) && item.type === "blob"
    );

    if (files.length === 0) {
      throw new Error(`Skill "${skillName}" not found in ${this.name}`);
    }

    const results: SkillFile[] = [];
    for (const file of files) {
      const relativePath = file.path.slice(prefix.length);
      if (relativePath.includes("..") || path.isAbsolute(relativePath)) {
        continue;
      }
      const contentUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${file.path}`;
      const { body: content } = await httpGet(contentUrl);
      results.push({ path: relativePath, content });
    }

    return results;
  }

  async search(query: string): Promise<SkillInfo[]> {
    const all = await this.list();
    const q = query.toLowerCase();
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }
}
