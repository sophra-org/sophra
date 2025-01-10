-- Normalize paths and remove duplicates
DO $$ 
BEGIN
    -- Normalize paths in CodebaseFile
    UPDATE "CodebaseFile"
    SET path = REPLACE(path, E'\\', '/');

    -- Remove duplicates from CodebaseFile keeping the latest version
    DELETE FROM "CodebaseFile"
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY path ORDER BY "updatedAt" DESC) as rn
            FROM "CodebaseFile"
        ) t
        WHERE t.rn > 1
    );

    -- Normalize paths in CodebaseDirectory
    UPDATE "CodebaseDirectory"
    SET path = REPLACE(path, E'\\', '/');

    -- Remove duplicates from CodebaseDirectory keeping the latest version
    DELETE FROM "CodebaseDirectory"
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY path ORDER BY "updatedAt" DESC) as rn
            FROM "CodebaseDirectory"
        ) t
        WHERE t.rn > 1
    );
END $$;
