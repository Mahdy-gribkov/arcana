import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { ArcanaConfig, ProviderConfig } from "../types.js";
import { ui } from "./ui.js";
import { atomicWriteSync } from "./atomic.js";

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
    const loaded = JSON.parse(raw) as Partial<ArcanaConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...loaded,
      providers: loaded.providers ?? DEFAULT_CONFIG.providers,
    };
  } catch {
    console.error(ui.warn("  Warning: Config file is corrupted, using defaults"));
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: ArcanaConfig): void {
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  atomicWriteSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
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
