import { Provider } from "./providers/base.js";
import { ArcanaProvider } from "./providers/arcana.js";
import { GitHubProvider, validateSlug } from "./providers/github.js";
import { loadConfig } from "./utils/config.js";
import { errorAndExit } from "./utils/ui.js";

const providerCache = new Map<string, Provider>();

export function clearProviderCache(): void {
  providerCache.clear();
}

function createProvider(name: string, type: string, url: string): Provider {
  if (providerCache.has(name)) return providerCache.get(name)!;

  let provider: Provider;

  if (name === "arcana") {
    provider = new ArcanaProvider();
  } else if (type === "github") {
    const parts = url.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      errorAndExit(`Invalid GitHub provider URL: ${url}`, "Use format: owner/repo");
    }
    try {
      validateSlug(parts[0], "owner");
      validateSlug(parts[1], "repo");
    } catch (err) {
      errorAndExit(err instanceof Error ? err.message : String(err));
    }
    provider = new GitHubProvider(parts[0], parts[1], { name, displayName: name });
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
      const parts = providerName.split("/");
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        errorAndExit(`Invalid provider: "${providerName}"`, "Use format: owner/repo");
      }
      return new GitHubProvider(parts[0], parts[1], {
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
