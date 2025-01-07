import { RegistryEntry } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

// Create an interface that extends the Prisma-generated type
interface RegistryEntryWithMetadata<T = JsonValue> extends Omit<RegistryEntry, 'metadata'> {
  metadata: T;
}

export class RegistryStore {
  private entries: Map<string, RegistryEntryWithMetadata>;
  private versionMap: Map<string, string[]>; // name -> [id1, id2, ...]
  private tagMap: Map<string, Set<string>>; // tag -> Set<id>

  constructor() {
    this.entries = new Map();
    this.versionMap = new Map();
    this.tagMap = new Map();
  }

  register(entry: RegistryEntryWithMetadata): void {
    if (this.entries.has(entry.id)) {
      throw new Error(`Entry with id ${entry.id} already exists`);
    }

    // Check version conflicts first
    const versions = this.versionMap.get(entry.name) || [];
    const existingVersion = versions.find(id => {
      const existing = this.entries.get(id);
      return existing?.version === entry.version;
    });
    if (existingVersion) {
      throw new Error(`Entry with version ${entry.version} already exists for ${entry.name}`);
    }
    // Validate dependencies
    const dependencies = (entry as any).dependencies;
    if (dependencies) {
      // First check if all dependencies exist
      for (const depId of dependencies) {
        if (!this.entries.has(depId)) {
          throw new Error(`Dependency ${depId} not found`);
        }
      }
      // Then check for circular dependencies
      this.checkCircularDependencies(entry.id, dependencies, new Set([entry.id]));
    }

    // Ensure entry has required fields
    const registryEntry = {
      ...entry,
      createdAt: entry.createdAt || new Date(),
      updatedAt: entry.updatedAt || new Date(),
      tags: entry.tags || [],
      dependencies: (entry as any).dependencies || [],
    };
    
    this.entries.set(entry.id, registryEntry);

    // Track versions
    versions.push(entry.id);
    this.versionMap.set(entry.name, versions);

    // Track tags
    registryEntry.tags.forEach((tag: string) => {
      const taggedIds = this.tagMap.get(tag) || new Set();
      taggedIds.add(entry.id);
      this.tagMap.set(tag, taggedIds);
    });
  }

  private checkCircularDependencies(
    currentId: string,
    dependencies: string[],
    visited: Set<string>
  ): void {
    for (const depId of dependencies) {
      if (visited.has(depId)) {
        throw new Error('Circular dependency detected');
      }

      visited.add(depId);
      const entry = this.entries.get(depId);
      const dependencies = (entry as any).dependencies;
      if (dependencies && dependencies.length > 0) {
        this.checkCircularDependencies(depId, dependencies, visited);
      }
    }
  }

  update<T>(id: string, updates: Partial<RegistryEntryWithMetadata<T>>): RegistryEntryWithMetadata<T> | undefined {
    const existing = this.entries.get(id);
    if (!existing) {
      return undefined;
    }
    // Validate dependencies if they're being updated
    if ((updates as any).dependencies) {
      // First check if all dependencies exist
      for (const depId of (updates as any).dependencies) {
        if (!this.entries.has(depId)) {
          throw new Error(`Dependency ${depId} not found`);
        }
      }
      // Then check for circular dependencies
      this.checkCircularDependencies(id, (updates as any).dependencies, new Set([id]));
    }

    // Remove old tag mappings
    existing.tags?.forEach((tag: string) => {
      const taggedIds = this.tagMap.get(tag);
      if (taggedIds) {
        taggedIds.delete(id);
        if (taggedIds.size === 0) {
          this.tagMap.delete(tag);
        }
      }
    });

    // Create new updated entry
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      // Preserve these fields from existing entry if not in updates
      tags: updates.tags ?? existing.tags,
      dependencies: (updates as any).dependencies ?? (existing as any).dependencies,
      version: updates.version ?? existing.version,
      name: updates.name ?? existing.name,
      metadata: updates.metadata ?? existing.metadata,
    } as RegistryEntryWithMetadata<T>;

    this.entries.set(id, updated as RegistryEntryWithMetadata<JsonValue>);

    // Update tag mappings
    updated.tags.forEach((tag: string) => {
      const taggedIds = this.tagMap.get(tag) || new Set();
      taggedIds.add(id);
      this.tagMap.set(tag, taggedIds);
    });

    return updated;
  }

  get<T>(id: string): RegistryEntryWithMetadata<T> | undefined {
    const entry = this.entries.get(id);
    return entry ? entry as RegistryEntryWithMetadata<T> : undefined;
  }

  getLatestVersion<T>(name: string): RegistryEntryWithMetadata<T> | undefined {
    const versions = this.versionMap.get(name);
    if (!versions || versions.length === 0) {
      return undefined;
    }
    
    // Sort versions by creation date and get the latest
    const sortedVersions = [...versions].sort((a, b) => {
      const entryA = this.entries.get(a);
      const entryB = this.entries.get(b);
      return (entryB?.createdAt?.getTime() || 0) - (entryA?.createdAt?.getTime() || 0);
    });
    
    return this.get<T>(sortedVersions[0]);
  }

  getByTag<T>(tag: string): RegistryEntryWithMetadata<T>[] {
    const taggedIds = this.tagMap.get(tag);
    if (!taggedIds) {
      return [];
    }
    return Array.from(taggedIds)
      .map(id => this.entries.get(id))
      .filter((entry): entry is RegistryEntryWithMetadata<JsonValue> => entry !== undefined) as RegistryEntryWithMetadata<T>[];
  }

  listEntries<T>(): RegistryEntryWithMetadata<T>[] {
    return Array.from(this.entries.values()) as RegistryEntryWithMetadata<T>[];
  }

  delete(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }

    // Remove from entries
    this.entries.delete(id);

    // Remove from version tracking
    const versions = this.versionMap.get(entry.name);
    if (versions) {
      const index = versions.indexOf(id);
      if (index !== -1) {
        versions.splice(index, 1);
      }
      if (versions.length === 0) {
        this.versionMap.delete(entry.name);
      }
    }

    // Remove from tag tracking
    entry.tags?.forEach((tag: string) => {
      const taggedIds = this.tagMap.get(tag);
      if (taggedIds) {
        taggedIds.delete(id);
        if (taggedIds.size === 0) {
          this.tagMap.delete(tag);
        }
      }
    });

    return true;
  }

  clear(): void {
    this.entries.clear();
    this.versionMap.clear();
    this.tagMap.clear();
  }
}

