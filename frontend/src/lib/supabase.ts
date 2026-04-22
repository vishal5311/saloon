import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njeaekidfetlwcvxqlmm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZWFla2lkZmV0bHdjdnhxbG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDI5NjcsImV4cCI6MjA5MjQxODk2N30.OqVp7MZYM2BMUpIz1ucuwrXBqsu70BL_nZRtQIGJuu8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
