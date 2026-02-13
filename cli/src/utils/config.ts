import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { ArcanaConfig, ProviderConfig } from "../types.js";

const CONFIG_PATH = join(homedir(), ".arcana", "config.json");

const DEFAULT_CONFIG: ArcanaConfig = {
  defaultProvider: "arcana",
  installDir: join(homedir(), ".agents", "skills"),
  providers: [
    {
      name: "arcana",
      type: "github",
      url: "mahdy-gribkov/arcana",
      enabled: true,
    },
  ],
};

export function loadConfig(): ArcanaConfig {
  if (!existsSync(CONFIG_PATH)) {
    return DEFAULT_CONFIG;
  }
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: ArcanaConfig): void {
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function addProvider(provider: ProviderConfig): void {
  const config = loadConfig();
  const existing = config.providers.findIndex((p) => p.name === provider.name);
  if (existing >= 0) {
    config.providers[existing] = provider;
  } else {
    config.providers.push(provider);
  }
  saveConfig(config);
}

export function removeProvider(name: string): boolean {
  const config = loadConfig();
  const idx = config.providers.findIndex((p) => p.name === name);
  if (idx < 0) return false;
  config.providers.splice(idx, 1);
  saveConfig(config);
  return true;
}
