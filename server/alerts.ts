import type { Env } from './env';
import { HttpError, json, safeEqual, sha256 } from './http';

/** How many waiting postcards the owner's bell previews. */
const PREVIEW = 5;

/**
 * The owner's read-only "alert key" for the postcard bell. It is derived
 * from ADMIN_KEY (and IP_SALT), so it never needs storing on the server, and
 * changing ADMIN_KEY switches off every device's bell at once. It can only
 * read the waiting count and short previews — never approve, delete or publish.
 */
export function alertKey(env: Env): Promise<string> {
  return sha256(`postcard-alerts:${env.IP_SALT ?? ''}:${env.ADMIN_KEY ?? ''}`);
}

/**
 * GET /api/alerts?since=<ms>  (Authorization: Bearer <alert key>)
 * → { waiting, fresh, newest, latest: [{ id, from, message, createdAt }] } for postcards
 *   still waiting for review. `fresh` counts the waiting ones sent after `since`
 *   (the newest one the owner has already clicked through to), `newest` is the
 *   send time of the most recent waiting postcard.
 */
export async function alerts(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'GET') throw new HttpError(405, 'Not allowed.');
  if (!env.ADMIN_KEY) throw new HttpError(503, 'Admin is not set up yet: add the ADMIN_KEY secret.');
  const given = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!given || !safeEqual(given, await alertKey(env))) {
    throw new HttpError(401, 'This device is no longer set up for postcard alerts.');
  }

  const since = Math.max(0, Number(new URL(req.url).searchParams.get('since')) || 0);
  const [count, recent] = await env.DB.batch([
    env.DB.prepare(
      "SELECT COUNT(*) AS n, SUM(created_at > ?) AS fresh, MAX(created_at) AS newest FROM postcards WHERE status = 'pending'",
    ).bind(since),
    env.DB.prepare(
      "SELECT id, sender, message, created_at FROM postcards WHERE status = 'pending' ORDER BY created_at DESC LIMIT ?",
    ).bind(PREVIEW),
  ]);
  const totals = count.results[0] as { n: number; fresh: number | null; newest: number | null } | undefined;
  const waiting = totals?.n ?? 0;
  const fresh = totals?.fresh ?? 0;
  const newest = totals?.newest ?? 0;
  const latest = (recent.results as { id: string; sender: string; message: string; created_at: number }[]).map((r) => ({
    id: r.id,
    from: r.sender,
    message: r.message,
    createdAt: r.created_at,
  }));
  return json({ waiting, fresh, newest, latest }, 200, { 'cache-control': 'private, no-store' });
}
