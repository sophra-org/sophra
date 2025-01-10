-- CreateTable
CREATE TABLE "CodebaseFile" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isBinary" BOOLEAN NOT NULL DEFAULT false,
    "hash" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "versionId" TEXT NOT NULL,
    "directoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodebaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodebaseDirectory" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodebaseDirectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodebaseVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "CodebaseVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodebaseFile_path_key" ON "CodebaseFile"("path");

-- CreateIndex
CREATE INDEX "CodebaseFile_path_idx" ON "CodebaseFile"("path");

-- CreateIndex
CREATE INDEX "CodebaseFile_hash_idx" ON "CodebaseFile"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "CodebaseDirectory_path_key" ON "CodebaseDirectory"("path");

-- CreateIndex
CREATE INDEX "CodebaseDirectory_path_idx" ON "CodebaseDirectory"("path");

-- CreateIndex
CREATE INDEX "CodebaseVersion_version_idx" ON "CodebaseVersion"("version");

-- AddForeignKey
ALTER TABLE "CodebaseFile" ADD CONSTRAINT "CodebaseFile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "CodebaseVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodebaseFile" ADD CONSTRAINT "CodebaseFile_directoryId_fkey" FOREIGN KEY ("directoryId") REFERENCES "CodebaseDirectory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodebaseDirectory" ADD CONSTRAINT "CodebaseDirectory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CodebaseDirectory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Function to normalize paths
CREATE OR REPLACE FUNCTION normalize_path() RETURNS trigger AS $$
BEGIN
    NEW.path = REPLACE(NEW.path, E'\\', '/');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to ensure paths are always normalized
CREATE TRIGGER normalize_file_path
    BEFORE INSERT OR UPDATE ON "CodebaseFile"
    FOR EACH ROW
    EXECUTE FUNCTION normalize_path();

CREATE TRIGGER normalize_directory_path
    BEFORE INSERT OR UPDATE ON "CodebaseDirectory"
    FOR EACH ROW
    EXECUTE FUNCTION normalize_path();
