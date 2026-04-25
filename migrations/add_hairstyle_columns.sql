-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Adds hairstyle selection columns to support the WhatsApp style picker flow

ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_style text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS selected_style text;
