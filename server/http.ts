import type { Env } from './env';

/** An error with an HTTP status and a message that is safe to show visitors. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function fail(status: number, message: string): Response {
  return json({ error: message }, status);
}

/** Parses a JSON body, refusing anything bigger than `maxBytes`. */
export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 16_000): Promise<T> {
  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > maxBytes) throw new HttpError(413, 'That is too big to send.');
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, 'That is too big to send.');
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object') throw new Error('not an object');
    return value as T;
  } catch {
    throw new HttpError(400, 'Could not read that request.');
  }
}

/** Trims, strips control characters and collapses whitespace, then caps the length. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    // Control characters, zero-width and direction-changing marks (incl. the
    // isolates U+2066-2069, word joiners U+2060-2064 and the BOM U+FEFF).
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Like cleanText, but keeps line breaks: at most `maxLines` lines, spaces
 * tidied inside each line, and no empty lines at the start or end.
 */
export function cleanMultiline(value: unknown, max: number, maxLines: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => cleanText(line, max))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .split('\n')
    .slice(0, maxLines)
    .join('\n')
    .slice(0, max)
    .trim();
}

export async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Salted hash of the visitor's network: enough to rate-limit, without storing the address.
 * IPv6 visitors are grouped by their /64 prefix, because one home or phone can
 * switch between many addresses inside it.
 */
export async function visitorHash(req: Request, env: Env): Promise<string> {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? 'local';
  return sha256(`${env.IP_SALT ?? 'ink-pigment'}:${networkOf(ip.split(',')[0].trim())}`);
}

/** The IPv4 address as is, or the first four groups (the /64 prefix) of an IPv6 address. */
export function networkOf(ip: string): string {
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right] : left;
  return groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':') + '::/64';
}

/**
 * Allows at most `max` writes of one kind per visitor in `windowMs`.
 * The check and the log entry are one SQL statement, so requests sent at the
 * same moment can't all slip past the count.
 */
export async function rateLimit(
  env: Env,
  who: string,
  kind: string,
  max: number,
  windowMs: number,
  message = 'Lots of paint today! Please wait a little and try again.',
): Promise<void> {
  if (!(await tryRecord(env, who, kind, max, windowMs))) throw new HttpError(429, message);
}

/** Logs one event of `kind` unless the visitor already has `max` in the window; false when refused. Prunes old rows. */
export async function tryRecord(env: Env, who: string, kind: string, max: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const [insert] = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO write_log (ip_hash, kind, at)
       SELECT ?1, ?2, ?3
       WHERE (SELECT COUNT(*) FROM write_log WHERE ip_hash = ?1 AND kind = ?2 AND at > ?4) < ?5`,
    ).bind(who, kind, now, now - windowMs, max),
    env.DB.prepare('DELETE FROM write_log WHERE at < ?').bind(now - 2 * 24 * 3600_000),
  ]);
  return !!insert.meta.changes;
}

/** How many events of `kind` the visitor has in the window (without logging one). */
export async function recentCount(env: Env, who: string, kind: string, windowMs: number): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM write_log WHERE ip_hash = ? AND kind = ? AND at > ?')
    .bind(who, kind, Date.now() - windowMs)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/** Constant-time string comparison (for the admin key). */
export function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
