import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Prevent Next.js build/prerender from crashing before env vars are configured.
// The app checks hasSupabaseConfig() before attempting database operations.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder-anon-key"
);

export function hasSupabaseConfig() {
  return Boolean(url && key && url.startsWith("https://"));
}
