-- Expand allowed job sources in job_postings to support all free job APIs & scrapers
ALTER TABLE public.job_postings DROP CONSTRAINT IF EXISTS job_postings_source_check;

-- Ensure source column allows any text source (remoteok, jobicy, arbeitnow, remotive, hackernews, google_jobs, themuse, adzuna, etc.)
ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_source_check 
  CHECK (source IS NOT NULL AND length(source) > 0);

-- Ensure index exists on source and posted_date
CREATE INDEX IF NOT EXISTS idx_job_postings_source_date ON public.job_postings(source, posted_date DESC);
