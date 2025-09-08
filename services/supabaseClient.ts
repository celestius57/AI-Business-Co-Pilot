import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://laewiztnluzmnvpbmyck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZXdpenRubHV6bW52cGJteWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjgyODAsImV4cCI6MjA3Mjg0NDI4MH0.ZJ2wQ2bz6fJLCwqZ1T0Ha8Qln8B7XUDOePrjx3cRuoQ';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);