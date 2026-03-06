-- CreateTable
CREATE TABLE "ServerSettings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ServerSettings_pkey" PRIMARY KEY ("key")
);

-- Seed default settings
INSERT INTO "ServerSettings" ("key", "value") VALUES ('registrationEnabled', 'true');
