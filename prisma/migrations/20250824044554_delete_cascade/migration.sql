-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entryId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Translation_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "TranslationEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Translation_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Translation" ("entryId", "id", "languageId", "text") SELECT "entryId", "id", "languageId", "text" FROM "Translation";
DROP TABLE "Translation";
ALTER TABLE "new_Translation" RENAME TO "Translation";
CREATE UNIQUE INDEX "Translation_entryId_languageId_key" ON "Translation"("entryId", "languageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
