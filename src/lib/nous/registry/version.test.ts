import { describe, it, expect, beforeEach } from 'vitest'
import { Version, VersionManager, VersionState } from './version'

describe('Version', () => {
  describe('toString', () => {
    it('should format version correctly', () => {
      const version = new Version(1, 2, 3, VersionState.DRAFT, new Date(), new Date())
      expect(version.toString()).toBe('1.2.3')
    })

    it('should handle negative version components', () => {
      const version = new Version(-1, 0, -3, VersionState.DRAFT, new Date(), new Date())
      expect(version.toString()).toBe('0.0.0')
    })
  })

  describe('compareTo', () => {
    it('should compare major versions', () => {
      const v1 = new Version(1, 0, 0, VersionState.DRAFT, new Date(), new Date())
      const v2 = new Version(2, 0, 0, VersionState.DRAFT, new Date(), new Date())
      expect(v1.compareTo(v2)).toBeLessThan(0)
      expect(v2.compareTo(v1)).toBeGreaterThan(0)
    })

    it('should compare minor versions', () => {
      const v1 = new Version(1, 1, 0, VersionState.DRAFT, new Date(), new Date())
      const v2 = new Version(1, 2, 0, VersionState.DRAFT, new Date(), new Date())
      expect(v1.compareTo(v2)).toBeLessThan(0)
    })

    it('should compare patch versions', () => {
      const v1 = new Version(1, 1, 1, VersionState.DRAFT, new Date(), new Date())
      const v2 = new Version(1, 1, 2, VersionState.DRAFT, new Date(), new Date())
      expect(v1.compareTo(v2)).toBeLessThan(0)
    })

    it('should consider equal versions', () => {
      const v1 = new Version(1, 1, 1, VersionState.DRAFT, new Date(), new Date())
      const v2 = new Version(1, 1, 1, VersionState.DRAFT, new Date(), new Date())
      expect(v1.compareTo(v2)).toBe(0)
    })
  })
})

describe('VersionManager', () => {
  let manager: VersionManager
  const entryId = 'test-entry'

  beforeEach(() => {
    manager = new VersionManager()
  })

  describe('version creation', () => {
    it('should create new version with defaults', () => {
      const version = manager.createVersion(entryId)
      expect(version.major).toBe(0)
      expect(version.minor).toBe(1)
      expect(version.patch).toBe(0)
      expect(version.state).toBe(VersionState.DRAFT)
    })

    it('should create version with specified values', () => {
      const version = manager.createVersion(entryId, 1, 2, 3, 'Test version')
      expect(version.major).toBe(1)
      expect(version.minor).toBe(2)
      expect(version.patch).toBe(3)
      expect(version.description).toBe('Test version')
    })

    it('should prevent duplicate versions', () => {
      manager.createVersion(entryId, 1, 0, 0)
      expect(() => manager.createVersion(entryId, 1, 0, 0)).toThrow(
        'Version 1.0.0 already exists for entry test-entry'
      )
    })
  })

  describe('version state transitions', () => {
    let version: Version

    beforeEach(() => {
      version = manager.createVersion(entryId, 1, 0, 0)
    })

    it('should validate state transitions', () => {
      // Draft -> Active
      expect(manager.activateVersion(entryId, version.toString())).toBe(true)
      expect(manager.getVersion(entryId, version.toString())?.state).toBe(VersionState.ACTIVE)

      // Active -> Deprecated
      expect(manager.deprecateVersion(entryId, version.toString())).toBe(true)
      expect(manager.getVersion(entryId, version.toString())?.state).toBe(VersionState.DEPRECATED)

      // Deprecated -> Archived
      expect(manager.archiveVersion(entryId, version.toString())).toBe(true)
      expect(manager.getVersion(entryId, version.toString())?.state).toBe(VersionState.ARCHIVED)
    })

    it('should prevent invalid state transitions', () => {
      // Draft -> Deprecated (invalid)
      expect(manager.deprecateVersion(entryId, version.toString())).toBe(false)
      expect(manager.getVersion(entryId, version.toString())?.state).toBe(VersionState.DRAFT)

      // Draft -> Archived (allowed as a special case)
      expect(manager.archiveVersion(entryId, version.toString())).toBe(true)
      expect(manager.getVersion(entryId, version.toString())?.state).toBe(VersionState.ARCHIVED)
    })

    it('should prevent transitions from terminal states', () => {
      manager.archiveVersion(entryId, version.toString())

      // Archived -> Active
      expect(manager.activateVersion(entryId, version.toString())).toBe(false)
      expect(manager.getVersion(entryId, version.toString())?.state).toBe(VersionState.ARCHIVED)

      // Archived -> Deprecated
      expect(manager.deprecateVersion(entryId, version.toString())).toBe(false)
      expect(manager.getVersion(entryId, version.toString())?.state).toBe(VersionState.ARCHIVED)
    })
  })

  describe('version retrieval', () => {
    it('should get version by string', () => {
      const created = manager.createVersion(entryId, 1, 0, 0)
      const retrieved = manager.getVersion(entryId, '1.0.0')
      expect(retrieved).toEqual(created)
    })

    it('should return undefined for non-existent version', () => {
      const version = manager.getVersion(entryId, '1.0.0')
      expect(version).toBeUndefined()
    })

    it('should get latest version excluding drafts', () => {
      manager.createVersion(entryId, 1, 0, 0)
      const v2 = manager.createVersion(entryId, 2, 0, 0)
      manager.activateVersion(entryId, v2.toString())
      manager.createVersion(entryId, 3, 0, 0) // Draft

      const latest = manager.getLatestVersion(entryId)
      expect(latest).toEqual(v2)
    })

    it('should get latest version including drafts', () => {
      manager.createVersion(entryId, 1, 0, 0)
      manager.createVersion(entryId, 2, 0, 0)
      const v3 = manager.createVersion(entryId, 3, 0, 0)

      const latest = manager.getLatestVersion(entryId, true)
      expect(latest).toEqual(v3)
    })
  })

  describe('version listing', () => {
    beforeEach(() => {
      manager.createVersion(entryId, 1, 0, 0)
      manager.createVersion(entryId, 2, 0, 0)
      manager.createVersion(entryId, 3, 0, 0)
    })

    it('should list all versions', () => {
      const versions = manager.listVersions(entryId)
      expect(versions).toHaveLength(3)
      expect(versions[0].toString()).toBe('1.0.0')
      expect(versions[1].toString()).toBe('2.0.0')
      expect(versions[2].toString()).toBe('3.0.0')
    })

    it('should list versions by state', () => {
      const v2 = manager.getVersion(entryId, '2.0.0')!
      manager.activateVersion(entryId, v2.toString())

      const activeVersions = manager.listVersions(entryId, VersionState.ACTIVE)
      expect(activeVersions).toHaveLength(1)
      expect(activeVersions[0]).toEqual(v2)
    })

    it('should return empty array for non-existent entry', () => {
      const versions = manager.listVersions('non-existent')
      expect(versions).toHaveLength(0)
    })
  })
}) 