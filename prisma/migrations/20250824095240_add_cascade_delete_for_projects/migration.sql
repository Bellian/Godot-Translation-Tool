-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectLanguage" (
    "projectId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,

    PRIMARY KEY ("projectId", "languageId"),
    CONSTRAINT "ProjectLanguage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProjectLanguage" ("languageId", "projectId") SELECT "languageId", "projectId" FROM "ProjectLanguage";
DROP TABLE "ProjectLanguage";
ALTER TABLE "new_ProjectLanguage" RENAME TO "ProjectLanguage";
CREATE TABLE "new_TranslationEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "comment" TEXT,
    "copied" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TranslationEntry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TranslationGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TranslationEntry" ("comment", "copied", "groupId", "id", "key") SELECT "comment", "copied", "groupId", "id", "key" FROM "TranslationEntry";
DROP TABLE "TranslationEntry";
ALTER TABLE "new_TranslationEntry" RENAME TO "TranslationEntry";
CREATE UNIQUE INDEX "TranslationEntry_groupId_key_key" ON "TranslationEntry"("groupId", "key");
CREATE TABLE "new_TranslationGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "TranslationGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TranslationGroup" ("description", "id", "name", "projectId") SELECT "description", "id", "name", "projectId" FROM "TranslationGroup";
DROP TABLE "TranslationGroup";
ALTER TABLE "new_TranslationGroup" RENAME TO "TranslationGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
