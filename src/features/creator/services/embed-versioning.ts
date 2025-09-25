import { EmbedAssetConfig } from '@/features/creator/types/embed-assets';

export interface EmbedVersion {
  id: string;
  version: string;
  config: EmbedAssetConfig;
  changelog?: string;
  created_by: string;
  created_at: string;
}

export interface AssetMetadata {
  versions: EmbedVersion[];
  current_version_id: string;
}

export class EmbedVersioningService {
  static createInitialVersion(config: EmbedAssetConfig, createdBy: string): EmbedVersion {
    const now = new Date().toISOString();
    return {
      id: `v_${now.replace(/[-:.]/g, '')}`,
      version: '1.0.0',
      config,
      changelog: 'Initial version',
      created_by: createdBy,
      created_at: now,
    };
  }

  static createVersion(
    newConfig: EmbedAssetConfig,
    currentMetadata: AssetMetadata,
    createdBy: string,
    changelog?: string
  ): { newVersion: EmbedVersion; newMetadata: AssetMetadata } {
    const now = new Date().toISOString();
    const currentVersion = currentMetadata.versions.find(v => v.id === currentMetadata.current_version_id);
    const newVersionNumber = this.incrementVersionNumber(currentVersion?.version || '1.0.0');

    const newVersion: EmbedVersion = {
      id: `v_${now.replace(/[-:.]/g, '')}`,
      version: newVersionNumber,
      config: newConfig,
      changelog: changelog || 'Updated embed configuration',
      created_by: createdBy,
      created_at: now,
    };

    const newMetadata: AssetMetadata = {
      versions: [...currentMetadata.versions, newVersion],
      current_version_id: newVersion.id,
    };

    return { newVersion, newMetadata };
  }

  private static incrementVersionNumber(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }
}