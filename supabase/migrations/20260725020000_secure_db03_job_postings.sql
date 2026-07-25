-- 1. Drop permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can insert job postings" ON "public"."job_postings";

-- 2. Add audit and source tracking fields
ALTER TABLE "public"."job_postings" ADD COLUMN IF NOT EXISTS "inserted_by" UUID REFERENCES auth.users(id);
ALTER TABLE "public"."job_postings" ADD COLUMN IF NOT EXISTS "source_id" TEXT;

-- 3. Add deduplication unique constraint
ALTER TABLE "public"."job_postings" ADD CONSTRAINT "job_postings_source_source_id_key" UNIQUE ("source", "source_id");
