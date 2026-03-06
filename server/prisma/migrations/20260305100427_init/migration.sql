-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasets" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "rows" INTEGER NOT NULL,
    "cols" INTEGER NOT NULL,
    "headers" TEXT NOT NULL,
    "dtypes" TEXT NOT NULL,
    "sampleRows" TEXT,
    "nullCounts" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eda_results" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overviewRows" INTEGER,
    "overviewCols" INTEGER,
    "overviewMemoryKB" DOUBLE PRECISION,
    "overviewNullPct" DOUBLE PRECISION,
    "duplicateRows" INTEGER,
    "numericCount" INTEGER,
    "categoricalCount" INTEGER,
    "datetimeCount" INTEGER,
    "numericCols" TEXT,
    "categoricalCols" TEXT,
    "statistics" TEXT,
    "topCorrelations" TEXT,
    "missingValues" TEXT,
    "distributions" TEXT,
    "categoricalFrequency" TEXT,
    "correlationMatrix" TEXT,
    "datasetId" TEXT NOT NULL,

    CONSTRAINT "eda_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_stories" (
    "id" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'EXECUTIVE',
    "depth" TEXT NOT NULL DEFAULT 'Standard',
    "content" TEXT NOT NULL,
    "sections" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datasetId" TEXT NOT NULL,

    CONSTRAINT "data_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "datasetId" TEXT NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatSessionId" TEXT NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL DEFAULT 'EDA_SUMMARY',
    "filename" TEXT NOT NULL,
    "qualityScore" INTEGER,
    "riskCount" INTEGER,
    "findingCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datasetId" TEXT NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "datasets_sessionId_key" ON "datasets"("sessionId");

-- CreateIndex
CREATE INDEX "datasets_sessionId_idx" ON "datasets"("sessionId");

-- CreateIndex
CREATE INDEX "datasets_userId_idx" ON "datasets"("userId");

-- CreateIndex
CREATE INDEX "datasets_createdAt_idx" ON "datasets"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "eda_results_datasetId_key" ON "eda_results"("datasetId");

-- CreateIndex
CREATE INDEX "data_stories_datasetId_idx" ON "data_stories"("datasetId");

-- CreateIndex
CREATE INDEX "data_stories_createdAt_idx" ON "data_stories"("createdAt");

-- CreateIndex
CREATE INDEX "chat_sessions_datasetId_idx" ON "chat_sessions"("datasetId");

-- CreateIndex
CREATE INDEX "chat_sessions_createdAt_idx" ON "chat_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_chatSessionId_idx" ON "chat_messages"("chatSessionId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "reports_datasetId_idx" ON "reports"("datasetId");

-- CreateIndex
CREATE INDEX "reports_createdAt_idx" ON "reports"("createdAt");

-- AddForeignKey
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eda_results" ADD CONSTRAINT "eda_results_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_stories" ADD CONSTRAINT "data_stories_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
