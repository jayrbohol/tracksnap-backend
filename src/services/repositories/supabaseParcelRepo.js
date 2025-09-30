import { createClient } from '@supabase/supabase-js';

let client;
function ensureClient() {
  if (client) return client;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase backend selected but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  }
  client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

export const supabaseParcelRepo = {
  async save(parcel) {
    const c = ensureClient();
    const { error } = await c.from('parcels').upsert(parcel, { onConflict: 'id' });
    if (error) throw error;
    return parcel;
  },
  async getById(id) {
    const c = ensureClient();
    const { data, error } = await c.from('parcels').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error; // 116 = not found
    return data || null;
  }
};
