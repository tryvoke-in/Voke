-- Drop the existing check constraint
alter table peer_interview_sessions 
drop constraint if exists peer_interview_sessions_status_check;

-- Add the new check constraint including 'pending'
alter table peer_interview_sessions 
add constraint peer_interview_sessions_status_check 
check (status in ('scheduled', 'completed', 'cancelled', 'pending'));
