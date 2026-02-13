export interface SkillInfo {
  name: string;
  description: string;
  version: string;
  source: string;
  repo?: string;
  category?: string;
}

export interface SkillFile {
  path: string;
  content: string;
}

export interface MarketplaceData {
  name: string;
  owner?: { name: string; github: string };
  metadata?: { description: string; version: string };
  plugins: MarketplacePlugin[];
}

export interface MarketplacePlugin {
  name: string;
  source: string;
  description: string;
  version: string;
}

export interface ProviderConfig {
  name: string;
  type: string;
  url: string;
  enabled: boolean;
}

export interface ArcanaConfig {
  defaultProvider: string;
  installDir: string;
  providers: ProviderConfig[];
}
