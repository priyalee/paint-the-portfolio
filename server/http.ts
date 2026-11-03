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
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Salted hash of the visitor's IP: enough to rate-limit, without storing the address. */
export async function visitorHash(req: Request, env: Env): Promise<string> {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? 'local';
  return sha256(`${env.IP_SALT ?? 'ink-pigment'}:${ip}`);
}

/**
 * Allows at most `max` writes of one kind per visitor in `windowMs`.
 * Old log rows are pruned on the way.
 */
export async function rateLimit(
  env: Env,
  who: string,
  kind: string,
  max: number,
  windowMs: number,
): Promise<void> {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM write_log WHERE ip_hash = ? AND kind = ? AND at > ?')
    .bind(who, kind, now - windowMs)
    .first<{ n: number }>();
  if ((row?.n ?? 0) >= max) throw new HttpError(429, 'Lots of paint today! Please wait a little and try again.');
  await env.DB.batch([
    env.DB.prepare('INSERT INTO write_log (ip_hash, kind, at) VALUES (?, ?, ?)').bind(who, kind, now),
    env.DB.prepare('DELETE FROM write_log WHERE at < ?').bind(now - 2 * 24 * 3600_000),
  ]);
}

/** Constant-time string comparison (for the admin key). */
export function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
