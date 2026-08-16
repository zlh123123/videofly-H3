ALTER TYPE "CreditTransType" ADD VALUE IF NOT EXISTS 'REDEEM_CODE';

CREATE TABLE IF NOT EXISTS "redeem_codes" (
  "id" serial PRIMARY KEY NOT NULL,
  "code_hash" text NOT NULL UNIQUE,
  "face_value" integer NOT NULL,
  "batch_id" text NOT NULL,
  "status" text DEFAULT 'AVAILABLE' NOT NULL,
  "redeemed_by" text,
  "redeemed_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "redeem_codes_status_idx" ON "redeem_codes" ("status");
CREATE INDEX IF NOT EXISTS "redeem_codes_batch_id_idx" ON "redeem_codes" ("batch_id");
