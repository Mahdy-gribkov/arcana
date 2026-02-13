import { Provider } from "./providers/base.js";
import { ArcanaProvider } from "./providers/arcana.js";
import { GitHubProvider } from "./providers/github.js";
import { loadConfig } from "./utils/config.js";
import { errorAndExit } from "./utils/ui.js";

const providerCache = new Map<string, Provider>();

function createProvider(name: string, type: string, url: string): Provider {
  if (providerCache.has(name)) return providerCache.get(name)!;

  let provider: Provider;

  if (name === "arcana") {
    provider = new ArcanaProvider();
  } else if (type === "github") {
    const [owner, repo] = url.split("/");
    if (!owner || !repo) {
      errorAndExit(`Invalid GitHub provider URL: ${url}`, "Use format: owner/repo");
    }
    provider = new GitHubProvider(owner, repo, { name, displayName: name });
  } else {
    errorAndExit(`Unknown provider type: ${type}`, "Supported types: github");
  }

  providerCache.set(name, provider);
  return provider;
}

export function getProvider(name?: string): Provider {
  const config = loadConfig();
  const providerName = name ?? config.defaultProvider;
  const providerConfig = config.providers.find((p) => p.name === providerName);

  if (!providerConfig) {
    // If it looks like owner/repo, treat as ad-hoc GitHub provider
    if (providerName.includes("/")) {
      const [owner, repo] = providerName.split("/");
      return new GitHubProvider(owner, repo, {
        name: providerName,
        displayName: providerName,
      });
    }
    errorAndExit(
      `Provider "${providerName}" not found`,
      "Run: arcana providers"
    );
  }

  return createProvider(
    providerConfig.name,
    providerConfig.type,
    providerConfig.url
  );
}

export function getProviders(name?: string): Provider[] {
  if (name) return [getProvider(name)];

  const config = loadConfig();
  return config.providers
    .filter((p) => p.enabled)
    .map((p) => createProvider(p.name, p.type, p.url));
}
