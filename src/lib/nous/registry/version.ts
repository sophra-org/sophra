export enum VersionState {
  DRAFT = "draft",
  ACTIVE = "active",
  DEPRECATED = "deprecated",
  ARCHIVED = "archived",
}

export class Version {
  constructor(
    public major: number,
    public minor: number,
    public patch: number,
    public state: VersionState,
    public createdAt: Date,
    public updatedAt: Date,
    public description: string = ""
  ) {
    // Ensure version components are non-negative
    this.major = Math.max(0, major);
    this.minor = Math.max(0, minor);
    this.patch = Math.max(0, patch);
  }

  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  compareTo(other: Version): number {
    const thisVersion = [this.major, this.minor, this.patch];
    const otherVersion = [other.major, other.minor, other.patch];

    for (let i = 0; i < 3; i++) {
      if (thisVersion[i] !== otherVersion[i]) {
        return thisVersion[i] - otherVersion[i];
      }
    }
    return 0;
  }
}

export class VersionManager {
  private versions: Map<string, Map<string, Version>> = new Map();
  private activeVersions: Map<string, Set<string>> = new Map();

  createVersion(
    entryId: string,
    major = 0,
    minor = 1,
    patch = 0,
    description = ""
  ): Version {
    const version = new Version(
      major,
      minor,
      patch,
      VersionState.DRAFT,
      new Date(),
      new Date(),
      description
    );

    const versionStr = version.toString();

    if (!this.versions.has(entryId)) {
      this.versions.set(entryId, new Map());
      this.activeVersions.set(entryId, new Set());
    }

    const entryVersions = this.versions.get(entryId)!;
    if (entryVersions.has(versionStr)) {
      throw new Error(
        `Version ${versionStr} already exists for entry ${entryId}`
      );
    }

    entryVersions.set(versionStr, version);
    return version;
  }

  getVersion(entryId: string, versionStr: string): Version | undefined {
    return this.versions.get(entryId)?.get(versionStr);
  }

  getLatestVersion(entryId: string, includeDraft = false): Version | undefined {
    const entryVersions = this.versions.get(entryId);
    if (!entryVersions) return undefined;

    const versions = Array.from(entryVersions.values()).filter(
      (v) => includeDraft || v.state !== VersionState.DRAFT
    );

    return versions.reduce((latest, current) =>
      latest.compareTo(current) < 0 ? current : latest
    );
  }

  activateVersion(entryId: string, versionStr: string): boolean {
    const version = this.getVersion(entryId, versionStr);
    if (!version || version.state !== VersionState.DRAFT) return false;

    version.state = VersionState.ACTIVE;
    version.updatedAt = new Date();
    this.activeVersions.get(entryId)?.add(versionStr);
    return true;
  }

  deprecateVersion(entryId: string, versionStr: string): boolean {
    const version = this.getVersion(entryId, versionStr);
    if (!version || version.state !== VersionState.ACTIVE) return false;

    version.state = VersionState.DEPRECATED;
    version.updatedAt = new Date();
    this.activeVersions.get(entryId)?.delete(versionStr);
    return true;
  }

  archiveVersion(entryId: string, versionStr: string): boolean {
    const version = this.getVersion(entryId, versionStr);
    if (!version || version.state === VersionState.ARCHIVED) return false;

    version.state = VersionState.ARCHIVED;
    version.updatedAt = new Date();
    this.activeVersions.get(entryId)?.delete(versionStr);
    return true;
  }

  listVersions(entryId: string, state?: VersionState): Version[] {
    const entryVersions = this.versions.get(entryId);
    if (!entryVersions) return [];

    let versions = Array.from(entryVersions.values());
    if (state) {
      versions = versions.filter((v) => v.state === state);
    }

    return versions.sort((a, b) => a.compareTo(b));
  }

  getActiveVersions(entryId: string): Version[] {
    const activeVersionStrings = this.activeVersions.get(entryId);
    if (!activeVersionStrings) return [];

    return Array.from(activeVersionStrings)
      .map((v) => this.getVersion(entryId, v)!)
      .filter((v) => v !== undefined);
  }
}
