/**
 * Optional Supabase global leaderboard.
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON in .env.local to enable.
 *
 * Required table (run in Supabase SQL editor):
 *   create table leaderboard (
 *     id uuid primary key default gen_random_uuid(),
 *     name text not null,
 *     score bigint not null,
 *     date text not null,
 *     created_at timestamptz default now()
 *   );
 *   alter table leaderboard enable row level security;
 *   create policy "allow_read"  on leaderboard for select using (true);
 *   create policy "allow_write" on leaderboard for insert with check (true);
 */

import { SUPABASE_URL, SUPABASE_ANON } from '../config.js';

const isConfigured = SUPABASE_URL && SUPABASE_ANON;

async function supabaseReq(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'apikey': SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json().catch(() => null);
}

export const SupabaseLeaderboard = {
  async submit(name, score) {
    if (!isConfigured) return false;
    try {
      await supabaseReq('leaderboard', {
        method: 'POST',
        body: JSON.stringify({ name: name.substring(0, 12), score, date: new Date().toLocaleDateString() }),
      });
      return true;
    } catch (e) {
      console.warn('Supabase submit failed:', e.message);
      return false;
    }
  },

  async fetchTop(limit = 10) {
    if (!isConfigured) return null;
    try {
      const data = await supabaseReq(
        `leaderboard?select=name,score,date&order=score.desc&limit=${limit}`,
        { headers: { Prefer: 'return=representation' } }
      );
      return Array.isArray(data) ? data : null;
    } catch (e) {
      console.warn('Supabase fetch failed:', e.message);
      return null;
    }
  },

  isConfigured() { return isConfigured; },
};

export default SupabaseLeaderboard;
