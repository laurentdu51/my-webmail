import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface EmailAccount {
  id: string;
  user_id: string;
  name: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_secure: boolean;
  created_at: string;
  updated_at: string;
}
