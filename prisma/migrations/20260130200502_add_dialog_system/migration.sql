-- CreateTable
CREATE TABLE "Dialog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startSection" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dialog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DialogSection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dialogId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DialogSection_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "Dialog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DialogLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sectionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "speaker" TEXT,
    "textKey" TEXT,
    "background" TEXT,
    "eventName" TEXT,
    "eventValue" TEXT,
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DialogLine_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "DialogSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DialogSection_dialogId_sectionId_key" ON "DialogSection"("dialogId", "sectionId");
