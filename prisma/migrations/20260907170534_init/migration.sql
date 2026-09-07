-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CO_OWNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GearItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'Good',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "storageLocation" TEXT NOT NULL DEFAULT 'Studio Locker',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GearCheckoutLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gearId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkoutDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturn" DATETIME NOT NULL,
    "actualReturn" DATETIME,
    "checkoutNotes" TEXT,
    "returnNotes" TEXT,
    CONSTRAINT "GearCheckoutLog_gearId_fkey" FOREIGN KEY ("gearId") REFERENCES "GearItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GearCheckoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "fileHash" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "width" INTEGER,
    "height" INTEGER,
    "cameraModel" TEXT,
    "lensModel" TEXT,
    "focalLength" TEXT,
    "aperture" TEXT,
    "shutterSpeed" TEXT,
    "iso" INTEGER,
    "capturedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ArtistProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PUBLIC_PORTFOLIO',
    "isUnlisted" BOOLEAN NOT NULL DEFAULT false,
    "pinHash" TEXT,
    "allowDownload" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AlbumItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "albumId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AlbumItem_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlbumItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainSource" TEXT NOT NULL DEFAULT 'PHOTOGRAPHY',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SystemModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "BrandSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteTitle" TEXT NOT NULL DEFAULT 'Graywood',
    "primaryColor" TEXT NOT NULL DEFAULT '#18181b',
    "accentColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "backgroundColor" TEXT NOT NULL DEFAULT '#09090b'
);

-- CreateTable
CREATE TABLE "GameServer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "queryPort" INTEGER NOT NULL,
    "gameType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "_ArtistProfileToMediaAsset" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArtistProfileToMediaAsset_A_fkey" FOREIGN KEY ("A") REFERENCES "ArtistProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArtistProfileToMediaAsset_B_fkey" FOREIGN KEY ("B") REFERENCES "MediaAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GearItem_serialNumber_key" ON "GearItem"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_filePath_key" ON "MediaAsset"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfile_slug_key" ON "ArtistProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Album_slug_key" ON "Album"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumItem_albumId_assetId_key" ON "AlbumItem"("albumId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistProfileToMediaAsset_AB_unique" ON "_ArtistProfileToMediaAsset"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistProfileToMediaAsset_B_index" ON "_ArtistProfileToMediaAsset"("B");
