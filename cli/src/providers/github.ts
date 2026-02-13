import https from "node:https";
import { Provider } from "./base.js";
import type { SkillInfo, SkillFile, MarketplaceData } from "../types.js";

const VALID_SLUG = /^[a-zA-Z0-9_.-]+$/;
const MAX_REDIRECTS = 5;

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
    this.branch = opts?.branch ?? "master";
    this.name = opts?.name ?? `${owner}/${repo}`;
    this.displayName = opts?.displayName ?? `${owner}/${repo}`;
  }

  private httpGet(url: string, redirectCount = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      if (redirectCount >= MAX_REDIRECTS) {
        reject(new Error(`Too many redirects (${MAX_REDIRECTS}) for ${url}`));
        return;
      }

      const req = https.get(
        url,
        { headers: { "User-Agent": "arcana-cli", Accept: "application/json" } },
        (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            const location = res.headers.location;
            if (location) {
              this.httpGet(location, redirectCount + 1).then(resolve, reject);
              return;
            }
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }
          let data = "";
          res.on("data", (chunk: Buffer) => (data += chunk.toString()));
          res.on("end", () => resolve(data));
        }
      );
      req.on("error", reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error(`Timeout fetching ${url}`));
      });
    });
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
    const raw = await this.httpGet(url);
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
    const raw = await this.httpGet(treeUrl);
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
      const contentUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${file.path}`;
      const content = await this.httpGet(contentUrl);
      const relativePath = file.path.slice(prefix.length);
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
