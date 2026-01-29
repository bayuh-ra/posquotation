-- Add a column to store all editable Page 2 content as HTML
-- Run this in your Supabase SQL editor.

ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS page2_html text;

