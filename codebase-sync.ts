import { PrismaClient } from '@prisma/codebase-sync-client';
import { createHash } from 'crypto';
import * as chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

// Helper function to normalize paths to forward slashes
function normalizePath(pathStr: string): string {
  return pathStr.split(path.sep).join('/');
}


const prisma = new PrismaClient();

interface FileInfo {
  path: string;
  content: string;
  hash: string;
  size: number;
  lastModified: Date;
  isBinary: boolean;
}

// Common binary file extensions
const BINARY_EXTENSIONS = new Set([
  '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.7z',
  '.exe', '.dll', '.so', '.dylib',
  '.ttf', '.woff', '.woff2', '.eot',
  '.mp3', '.mp4', '.wav', '.avi',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
]);

function isBinaryPath(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

async function readFileContent(filePath: string): Promise<{ content: string; isBinary: boolean }> {
  const isBinary = isBinaryPath(filePath);

  if (isBinary) {
    const buffer = await fs.readFile(filePath);
    return {
      content: buffer.toString('base64'),
      isBinary: true
    };
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { content, isBinary: false };
  } catch (error) {
    // If UTF-8 reading fails, treat as binary
    const buffer = await fs.readFile(filePath);
    return {
      content: buffer.toString('base64'),
      isBinary: true
    };
  }
}

export class CodebaseSync {
  private watcher?: chokidar.FSWatcher;
  private rootDir: string;
  private isWatching: boolean = false;
  private excludePatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/coverage/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
  ];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  private async getFileInfo(filePath: string): Promise<FileInfo> {
    const { content, isBinary } = await readFileContent(filePath);
    const stats = await fs.stat(filePath);
    const hash = createHash('sha256').update(content).digest('hex');
    const relativePath = normalizePath(path.relative(this.rootDir, filePath));

    return {
      path: relativePath,
      content,
      hash,
      size: stats.size,
      lastModified: stats.mtime,
      isBinary
    };
  }

  private async createOrUpdateDirectory(dirPath: string): Promise<string> {
    const relativePath = normalizePath(path.relative(this.rootDir, dirPath));
    const parentPath = normalizePath(path.dirname(relativePath));

    let parentId: string | null = null;
    if (parentPath !== '.') {
      const parent = await prisma.codebaseDirectory.findUnique({
        where: { path: parentPath },
      });
      if (parent) {
        parentId = parent.id;
      }
    }

    const dir = await prisma.codebaseDirectory.upsert({
      where: { path: relativePath },
      create: {
        path: relativePath,
        parentId,
      },
      update: {
        parentId,
      },
    });

    return dir.id;
  }

  private async syncFile(
    fileInfo: FileInfo,
    versionId: string,
    directoryId?: string
  ): Promise<void> {
    await prisma.codebaseFile.upsert({
      where: { path: fileInfo.path },
      create: {
        path: fileInfo.path,
        content: fileInfo.content,
        hash: fileInfo.hash,
        size: fileInfo.size,
        lastModified: fileInfo.lastModified,
        isBinary: fileInfo.isBinary,
        versionId,
        directoryId,
      },
      update: {
        content: fileInfo.content,
        hash: fileInfo.hash,
        size: fileInfo.size,
        lastModified: fileInfo.lastModified,
        isBinary: fileInfo.isBinary,
        versionId,
        directoryId,
      },
    });
  }

  async syncAll(description?: string): Promise<void> {
    console.log('Starting full codebase sync...');

    const version = await prisma.codebaseVersion.create({
      data: {
        description,
      },
    });

    const files = await glob('**/*', {
      cwd: this.rootDir,
      ignore: this.excludePatterns,
      nodir: true,
      follow: false,
      absolute: true,
    });

    let syncedCount = 0;
    const totalFiles = files.length;

    for (const file of files) {
      const fullPath = normalizePath(file);
      const dirPath = normalizePath(path.dirname(fullPath));

      try {
        const directoryId = await this.createOrUpdateDirectory(dirPath);
        const fileInfo = await this.getFileInfo(fullPath);
        await this.syncFile(fileInfo, version.id, directoryId);
        syncedCount++;

        // Log progress every 50 files
        if (syncedCount % 50 === 0) {
          console.log(`Progress: ${syncedCount}/${totalFiles} files synced`);
        }
      } catch (error) {
        console.error(`Error syncing file ${file}:`, error);
      }
    }

    console.log(`Codebase sync completed. Total files synced: ${syncedCount}`);
  }

  async startWatching(): Promise<void> {
    if (this.isWatching) return;

    console.log('Starting codebase watch...');

    this.watcher = chokidar.watch('**/*', {
      cwd: this.rootDir,
      ignored: this.excludePatterns,
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', async (filePath: string) => {
        const version = await prisma.codebaseVersion.create({
          data: { description: `File added: ${filePath}` },
        });

        const fullPath = normalizePath(path.join(this.rootDir, filePath));
        const dirPath = normalizePath(path.dirname(fullPath));
        const directoryId = await this.createOrUpdateDirectory(dirPath);
        const fileInfo = await this.getFileInfo(fullPath);
        await this.syncFile(fileInfo, version.id, directoryId);
        console.log(`Synced new file: ${filePath}`);
      })
      .on('change', async (filePath: string) => {
        const version = await prisma.codebaseVersion.create({
          data: { description: `File changed: ${filePath}` },
        });

        const fullPath = normalizePath(path.join(this.rootDir, filePath));
        const dirPath = normalizePath(path.dirname(fullPath));
        const directoryId = await this.createOrUpdateDirectory(dirPath);
        const fileInfo = await this.getFileInfo(fullPath);
        await this.syncFile(fileInfo, version.id, directoryId);
        console.log(`Synced changed file: ${filePath}`);
      })
      .on('unlink', async (filePath: string) => {
        await prisma.codebaseFile.delete({
          where: { path: filePath },
        });
        console.log(`Removed deleted file: ${filePath}`);
      });

    this.isWatching = true;
  }

  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.isWatching = false;
      console.log('Stopped watching codebase');
    }
  }
}

// Export a singleton instance
export const codebaseSync = new CodebaseSync();

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    try {
      switch (command) {
        case 'sync':
          await codebaseSync.syncAll(args[1]);
          process.exit(0);
          break;
        case 'watch':
          await codebaseSync.startWatching();
          // Keep alive until Ctrl+C
          process.on('SIGINT', async () => {
            console.log('Stopping watch mode...');
            await codebaseSync.stopWatching();
            process.exit(0);
          });
          break;
        default:
          console.log('Usage: ts-node codebase-sync.ts [sync|watch] [description]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}
