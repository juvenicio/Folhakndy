import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kdlpzqpxbbijmgrzqzfq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkbHB6cXB4YmJpam1ncnpxemZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTc3MzYsImV4cCI6MjA3NTA5MzczNn0.wkjOdec2AwszA8mqXXy9p2WpTMkpWab5dJTHedCB-c8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);