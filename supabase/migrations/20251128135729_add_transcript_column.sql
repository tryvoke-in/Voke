-- Add transcript column to video_interview_sessions table
ALTER TABLE public.video_interview_sessions
ADD COLUMN IF NOT EXISTS transcript TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.video_interview_sessions.transcript IS 'Transcribed text from the video interview answer, generated using Groq Whisper API';
