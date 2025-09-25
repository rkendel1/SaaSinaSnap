import { EmbedAsset, EmbedAssetConfig } from '@/features/creator/types/embed-assets';

export interface EmbedVersion {
  id: string;
  embed_id: string;
  version: string;
  config: EmbedAssetConfig;
  changelog?: string;
  created_by: string;
  created_at: string;
  is_current: boolean;
  parent_version?: string;
}

export interface VersionComparisonResult {
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'modified';
  }[];
  score: number; // 0-1 similarity score
}

export class EmbedVersioningService {
  private static versions: Map<string, EmbedVersion[]> = new Map();

  /**
   * Create a new version of an embed
   */
  static async createVersion(
    embedId: string,
    config: EmbedAssetConfig,
    options: {
      version?: string;
      changelog?: string;
      createdBy: string;
      makeCurrent?: boolean;
    }
  ): Promise<EmbedVersion> {
    const { version, changelog, createdBy, makeCurrent = true } = options;
    
    const existingVersions = this.versions.get(embedId) || [];
    const versionNumber = version || this.generateVersionNumber(existingVersions);
    
    // Create new version
    const newVersion: EmbedVersion = {
      id: `${embedId}-v${versionNumber}-${Date.now()}`,
      embed_id: embedId,
      version: versionNumber,
      config,
      changelog,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      is_current: makeCurrent,
      parent_version: existingVersions.find(v => v.is_current)?.id
    };

    // Update current version flags
    if (makeCurrent) {
      existingVersions.forEach(v => v.is_current = false);
    }

    // Add new version
    const updatedVersions = [...existingVersions, newVersion];
    this.versions.set(embedId, updatedVersions);

    return newVersion;
  }

  /**
   * Get all versions for an embed
   */
  static getVersions(embedId: string): EmbedVersion[] {
    return this.versions.get(embedId) || [];
  }

  /**
   * Get current version for an embed
   */
  static getCurrentVersion(embedId: string): EmbedVersion | null {
    const versions = this.versions.get(embedId) || [];
    return versions.find(v => v.is_current) || null;
  }

  /**
   * Get specific version by id
   */
  static getVersion(versionId: string): EmbedVersion | null {
    for (const versions of this.versions.values()) {
      const version = versions.find(v => v.id === versionId);
      if (version) return version;
    }
    return null;
  }

  /**
   * Set a specific version as current
   */
  static async setCurrentVersion(embedId: string, versionId: string): Promise<boolean> {
    const versions = this.versions.get(embedId);
    if (!versions) return false;

    const targetVersion = versions.find(v => v.id === versionId);
    if (!targetVersion) return false;

    // Update current flags
    versions.forEach(v => v.is_current = false);
    targetVersion.is_current = true;

    this.versions.set(embedId, versions);
    return true;
  }

  /**
   * Compare two versions
   */
  static compareVersions(version1: EmbedVersion, version2: EmbedVersion): VersionComparisonResult {
    const changes: VersionComparisonResult['changes'] = [];
    const config1 = version1.config;
    const config2 = version2.config;

    // Compare all config fields
    const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);
    
    allKeys.forEach(key => {
      const val1 = (config1 as any)[key];
      const val2 = (config2 as any)[key];

      if (val1 === undefined && val2 !== undefined) {
        changes.push({ field: key, oldValue: undefined, newValue: val2, type: 'added' });
      } else if (val1 !== undefined && val2 === undefined) {
        changes.push({ field: key, oldValue: val1, newValue: undefined, type: 'removed' });
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes.push({ field: key, oldValue: val1, newValue: val2, type: 'modified' });
      }
    });

    // Calculate similarity score
    const totalFields = allKeys.size;
    const unchangedFields = totalFields - changes.length;
    const score = totalFields > 0 ? unchangedFields / totalFields : 1;

    return { changes, score };
  }

  /**
   * Generate next version number
   */
  private static generateVersionNumber(existingVersions: EmbedVersion[]): string {
    if (existingVersions.length === 0) return '1.0.0';

    // Get latest version and increment
    const versions = existingVersions
      .map(v => v.version)
      .filter(v => /^\d+\.\d+\.\d+$/.test(v))
      .map(v => v.split('.').map(Number))
      .sort((a, b) => {
        for (let i = 0; i < 3; i++) {
          if (a[i] !== b[i]) return b[i] - a[i];
        }
        return 0;
      });

    if (versions.length === 0) return '1.0.0';

    const [major, minor, patch] = versions[0];
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Create a branch from a version
   */
  static async createBranch(
    versionId: string,
    branchName: string,
    options: {
      changelog?: string;
      createdBy: string;
    }
  ): Promise<EmbedVersion | null> {
    const sourceVersion = this.getVersion(versionId);
    if (!sourceVersion) return null;

    const branchVersion = `${sourceVersion.version}-${branchName}`;
    
    return this.createVersion(sourceVersion.embed_id, sourceVersion.config, {
      version: branchVersion,
      changelog: options.changelog || `Branched from version ${sourceVersion.version}`,
      createdBy: options.createdBy,
      makeCurrent: false
    });
  }

  /**
   * Get version history with diffs
   */
  static getVersionHistory(embedId: string): Array<EmbedVersion & { diff?: VersionComparisonResult }> {
    const versions = this.getVersions(embedId).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return versions.map((version, index) => {
      if (index < versions.length - 1) {
        const previousVersion = versions[index + 1];
        const diff = this.compareVersions(previousVersion, version);
        return { ...version, diff };
      }
      return version;
    });
  }

  /**
   * Rollback to a previous version
   */
  static async rollbackToVersion(embedId: string, versionId: string, createdBy: string): Promise<EmbedVersion | null> {
    const targetVersion = this.getVersion(versionId);
    if (!targetVersion) return null;

    // Create new version with rollback config
    return this.createVersion(embedId, targetVersion.config, {
      changelog: `Rolled back to version ${targetVersion.version}`,
      createdBy,
      makeCurrent: true
    });
  }

  /**
   * Archive old versions (keep only last N versions)
   */
  static archiveOldVersions(embedId: string, keepCount: number = 10): number {
    const versions = this.getVersions(embedId);
    if (versions.length <= keepCount) return 0;

    const sortedVersions = versions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const toKeep = sortedVersions.slice(0, keepCount);
    const archived = versions.length - toKeep.length;

    this.versions.set(embedId, toKeep);
    return archived;
  }
}