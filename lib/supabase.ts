import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = 'https://gqipssfphzysaehwefga.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaXBzc2ZwaHp5c2FlaHdlZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzExMjUsImV4cCI6MjA3ODA0NzEyNX0.v41MB4Q2tzthg9u7VE4-E3z5tyG7YV8kySLBE9zS3Cg';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
