-- Disable RLS for calls table to allow the CRM dashboard to read data
-- Use this if you want the dashboard to be accessible to anyone with the ANON_KEY
-- For a production environment, you should replace this with a proper policy for AUTHENTICATED users.

alter table calls disable row level security;

-- Alternatively, keep RLS enabled but add a public select policy
-- create policy "Allow public select on calls" on calls for select using (true);
