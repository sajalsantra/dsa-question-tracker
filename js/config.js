/**
 * Supabase Client Configuration
 * 
 * Safe for public browser environment (only public anon key is exposed).
 * Replace placeholder values with your actual Supabase project credentials.
 * Or set window.SUPABASE_CONFIG = { url: "...", anonKey: "..." } in index.html.
 */

const DEFAULT_CONFIG = {
  // Public URL of your Supabase project (e.g. https://xyzcompany.supabase.co)
  url: "https://opsuzfwlgvrsvofolsxt.supabase.co",
  
  // Public Anon Key of your Supabase project (safe for frontend code)
  anonKey: "sb_publishable_OCQq0CCwcJj8eXLUs65row_v3b0htkA"
};

export function getSupabaseConfig() {
  if (typeof window !== "undefined" && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
    return window.SUPABASE_CONFIG;
  }
  return DEFAULT_CONFIG;
}
