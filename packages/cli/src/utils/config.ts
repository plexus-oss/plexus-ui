import fs from "fs-extra";
import * as path from "path";

export interface PlexusConfig {
  $schema?: string;
  tsx: boolean;
  aliases: {
    components: string;
    utils: string;
    plexusui: string;
  };
  resolvedPaths: {
    components: string;
    plexusui: string;
  };
}

/**
 * Load plexusui.config.json from the current working directory
 */
export async function loadConfig(): Promise<PlexusConfig | null> {
  const cwd = process.cwd();
  const configPath = path.join(cwd, "plexusui.config.json");

  if (await fs.pathExists(configPath)) {
    try {
      return await fs.readJson(configPath);
    } catch {
      return null;
    }
  }

  return null;
}
