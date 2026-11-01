-- Medical certificate: when it was handed in, its expiry day, and which reminders were already sent
-- (reset whenever a new certificate is recorded).

ALTER TABLE "User" ADD COLUMN "medicalCertificateSubmittedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "medicalCertificateExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "medicalCertificateLiteNoticeAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "medicalCertificateStrongNoticeAt" DATETIME;
