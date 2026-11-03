import { admin } from './admin';
import type { Env } from './env';
import { HttpError, fail, json } from './http';
import { postcards } from './postcards';
import { mural, splashes } from './walls';

interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}

/** Entry point for every /api/* request. */
export async function handle(req: Request, env: Env, ctx?: Ctx): Promise<Response> {
  const parts = new URL(req.url).pathname
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);
  const [area, ...rest] = parts;

  // Writes must come from the site itself (blocks other sites posting with a visitor's browser).
  if (req.method !== 'GET' && req.method !== 'HEAD' && !sameOrigin(req)) {
    return fail(403, 'Requests must come from the site.');
  }

  try {
    switch (area) {
      case 'health':
        return json({ ok: true });
      case 'content':
        return await content(req, env);
      case 'mural':
        return await mural(req, env, rest);
      case 'splashes':
        return await splashes(req, env, rest);
      case 'postcards':
        return await postcards(req, env, rest, ctx);
      case 'admin':
        return await admin(req, env, rest);
      default:
        return fail(404, 'Not found.');
    }
  } catch (err) {
    if (err instanceof HttpError) return fail(err.status, err.message);
    console.error(err);
    return fail(500, 'Something went wrong — please try again.');
  }
}

/** GET /api/content → the published content, or 404 when none was published yet. */
async function content(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'GET') throw new HttpError(405, 'Not allowed.');
  const row = await env.DB.prepare('SELECT json, updated_at FROM content WHERE id = 1').first<{
    json: string;
    updated_at: number;
  }>();
  if (!row) throw new HttpError(404, 'No published content yet.');
  return new Response(row.json, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=30',
      'last-modified': new Date(row.updated_at).toUTCString(),
    },
  });
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser clients (curl) and same-origin fetches without the header
  return origin === new URL(req.url).origin;
}
