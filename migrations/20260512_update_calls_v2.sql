-- Update calls table for high-fidelity synchronization
alter table calls 
add column if not exists raw_data jsonb,
add column if not exists state_events jsonb default '[]'::jsonb,
add column if not exists transcript_object jsonb default '[]'::jsonb,
add column if not exists recording_duration integer,
add column if not exists booking_actions jsonb default '[]'::jsonb,
add column if not exists raw_transcript text;

-- Ensure realtime is enabled for all columns
comment on table calls is 'Stores detailed call data for Retell AI synchronization';
