import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

/** Service-role client: bypasses RLS. Server-side only (PRD 8.4). */
export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Resolve the authed user id from the Authorization header, if any. */
export async function resolveUserId(
  req: Request,
  admin: SupabaseClient,
): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/** Guest identity header (client-generated UUID; identifies, not authenticates). */
export function resolveGuestId(req: Request): string | null {
  const id = req.headers.get('x-guest-id');
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}
