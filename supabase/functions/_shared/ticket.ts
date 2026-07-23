/**
 * Signed run tickets (Epic 02, decision 3 / plan E8). start-run issues a
 * ticket carrying round ids + server-computed deadlines; submit-answer and
 * complete-run verify the HMAC so clients cannot alter rounds, deadlines,
 * or ownership. Truth data is NEVER placed in a ticket (tickets are only
 * signed, not encrypted — the client can read them).
 */
export interface RunTicket {
  v: 1;
  runId: string | null;
  userId: string | null;
  guestId: string | null;
  gameSlug: string;
  roundIds: string[];
  /** Per-round submission deadlines, epoch ms, server clock. */
  deadlines: number[];
  iat: number;
}

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
  const secret =
    Deno.env.get('TICKET_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret) throw new Error('No TICKET_SECRET or service role key available');
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signTicket(ticket: RunTicket): Promise<string> {
  const payload = b64url(encoder.encode(JSON.stringify(ticket)));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return `${payload}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyTicket(raw: string): Promise<RunTicket | null> {
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const parsed = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payload)),
    ) as RunTicket;
    if (parsed.v !== 1 || !Array.isArray(parsed.roundIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}
