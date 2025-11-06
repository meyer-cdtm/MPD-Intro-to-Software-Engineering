import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	// Persist sessions in localStorage for client-side Next.js
	autoRefreshToken: true,
	persistSession: true,
	detectSessionInUrl: true,
});


