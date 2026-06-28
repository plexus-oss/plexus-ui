export type ComponentTier = "free" | "pro";

export interface ComponentConfig {
  name: string;
  version?: string;
  displayName?: string;
  type: string;
  description?: string;
  files: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  category?: string;
  tier?: ComponentTier;
  textures?: string[];
}

export interface Registry {
  [key: string]: ComponentConfig;
}
