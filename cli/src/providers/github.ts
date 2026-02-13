import https from "node:https";
import { Provider } from "./base.js";
import type { SkillInfo, SkillFile, MarketplaceData } from "../types.js";

interface GitHubTreeItem {
  path: string;
  type: string;
  url: string;
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
    this.owner = owner;
    this.repo = repo;
    this.branch = opts?.branch ?? "master";
    this.name = opts?.name ?? `${owner}/${repo}`;
    this.displayName = opts?.displayName ?? `${owner}/${repo}`;
  }

  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        { headers: { "User-Agent": "arcana-cli", Accept: "application/json" } },
        (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            const location = res.headers.location;
            if (location) {
              this.httpGet(location).then(resolve, reject);
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

  async list(): Promise<SkillInfo[]> {
    if (this.cache) return this.cache;

    const url = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/.claude-plugin/marketplace.json`;
    const raw = await this.httpGet(url);
    const data: MarketplaceData = JSON.parse(raw);

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
    const treeUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${this.branch}?recursive=1`;
    const raw = await this.httpGet(treeUrl);
    const tree = JSON.parse(raw);

    const prefix = `skills/${skillName}/`;
    const files: GitHubTreeItem[] = tree.tree.filter(
      (item: GitHubTreeItem) =>
        item.path.startsWith(prefix) && item.type === "blob"
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
