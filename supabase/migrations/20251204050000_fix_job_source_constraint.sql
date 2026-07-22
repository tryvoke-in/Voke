-- Add 'themuse' to the allowed source values
ALTER TABLE job_postings DROP CONSTRAINT IF EXISTS job_postings_source_check;
ALTER TABLE job_postings ADD CONSTRAINT job_postings_source_check 
  CHECK (source IN ('ai-generated', 'indeed', 'linkedin', 'manual', 'themuse', 'adzuna'));
