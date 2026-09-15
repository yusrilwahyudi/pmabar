import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let clientInstance: ReturnType<typeof createClient> | null = null;
let isConfigured = false;

const isValidHttpUrl = (stringUrl: string) => {
  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

if (
  rawUrl &&
  rawKey &&
  rawUrl !== 'https://your-project-id.supabase.co' &&
  isValidHttpUrl(rawUrl)
) {
  try {
    clientInstance = createClient(rawUrl, rawKey);
    isConfigured = true;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    clientInstance = null;
    isConfigured = false;
  }
}

export const isSupabaseConfigured = isConfigured;
export const supabase = clientInstance;
