import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
