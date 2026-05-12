-- Add voice detection columns to calls table
alter table calls 
add column if not exists voice_profile text,
add column if not exists confidence_score numeric;

-- Optional: Add voice profile to customers for long-term memory
alter table customers 
add column if not exists voice_profile text;

comment on column calls.voice_profile is 'Detected voice gender: masculine, feminine, neutral, or unclear';
comment on column calls.confidence_score is 'AI confidence in the voice profile detection (0-1)';
