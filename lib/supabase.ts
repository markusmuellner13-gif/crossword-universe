import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url === 'your_supabase_project_url') {
      throw new Error('Supabase env vars not configured');
    }
    _client = createClient(url, key);
  }
  return _client;
}

export async function getProgress(sessionId: string) {
  try {
    const { data, error } = await getClient()
      .from('user_progress')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function upsertProgress(sessionId: string, updates: {
  total_points?: number;
  level?: number;
  completed_puzzles?: string[];
  active_puzzle_id?: string | null;
  active_puzzle_state?: Record<string, string> | null;
}) {
  try {
    const { data, error } = await getClient()
      .from('user_progress')
      .upsert({ session_id: sessionId, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'session_id' })
      .select()
      .single();
    if (error) console.error('Supabase upsert error:', error);
    return data;
  } catch {
    return null;
  }
}
