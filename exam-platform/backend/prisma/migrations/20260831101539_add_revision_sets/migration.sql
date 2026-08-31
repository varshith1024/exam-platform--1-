-- CreateTable
CREATE TABLE "RevisionSet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "RevisionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisionSetId" TEXT NOT NULL,

    CONSTRAINT "RevisionFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RevisionSet" ADD CONSTRAINT "RevisionSet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionFile" ADD CONSTRAINT "RevisionFile_revisionSetId_fkey" FOREIGN KEY ("revisionSetId") REFERENCES "RevisionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
