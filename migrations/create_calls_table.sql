-- Create calls table for CRM tracking
create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  customer_id integer references customers(id),
  retell_call_id text unique,
  status text,
  transcript text,
  recording_url text,
  summary text,
  duration integer,
  sentiment text,
  call_type text default 'outbound',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable realtime for the calls table
alter publication supabase_realtime add table calls;
