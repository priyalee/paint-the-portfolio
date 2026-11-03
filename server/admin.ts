import { MARK_ID } from '../src/app/core/wall-limits';
import type { Env } from './env';
import { HttpError, json, readJson, safeEqual } from './http';
import { PostcardRow, image, toPublic } from './postcards';

const MAX_CONTENT_BYTES = 200_000;

/**
 * Owner-only routes, protected by the ADMIN_KEY secret
 * (sent as "Authorization: Bearer <key>").
 *
 * GET    /api/admin/check
 * GET    /api/admin/postcards?status=pending|approved|hidden
 * GET    /api/admin/postcards/:id/image
 * POST   /api/admin/postcards/:id   { status }
 * DELETE /api/admin/postcards/:id
 * DELETE /api/admin/mural/:id
 * DELETE /api/admin/splashes/:id
 * PUT    /api/admin/content          (the whole content.json object)
 */
export async function admin(req: Request, env: Env, rest: string[]): Promise<Response> {
  if (!env.ADMIN_KEY) throw new HttpError(503, 'Admin is not set up yet: add the ADMIN_KEY secret.');
  const given = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!given || !safeEqual(given, env.ADMIN_KEY)) throw new HttpError(401, 'Wrong admin key.');

  const [area, id, sub] = rest;
  const method = req.method;

  if (area === 'check' && method === 'GET') return json({ ok: true });

  if (area === 'postcards') {
    if (!id && method === 'GET') {
      const status = new URL(req.url).searchParams.get('status') ?? 'pending';
      if (!['pending', 'approved', 'hidden'].includes(status)) throw new HttpError(400, 'Unknown status.');
      const { results } = await env.DB.prepare(
        'SELECT id, message, sender, status, created_at FROM postcards WHERE status = ? ORDER BY created_at DESC LIMIT 100',
      )
        .bind(status)
        .all<PostcardRow>();
      return json(results.map((r) => ({ ...toPublic(r), imageUrl: `/api/admin/postcards/${r.id}/image` })));
    }
    if (id && !MARK_ID.test(id)) throw new HttpError(400, 'Invalid id.');
    if (id && sub === 'image' && method === 'GET') return image(env, id, true);
    if (id && !sub && method === 'POST') {
      const { status } = await readJson<{ status?: string }>(req);
      if (!status || !['pending', 'approved', 'hidden'].includes(status)) throw new HttpError(400, 'Unknown status.');
      await env.DB.prepare('UPDATE postcards SET status = ? WHERE id = ?').bind(status, id).run();
      return json({ ok: true });
    }
    if (id && !sub && method === 'DELETE') {
      await env.DB.prepare('DELETE FROM postcards WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }
  }

  if ((area === 'mural' || area === 'splashes') && id && method === 'DELETE') {
    if (!MARK_ID.test(id)) throw new HttpError(400, 'Invalid id.');
    const table = area === 'mural' ? 'mural_claims' : 'splashes';
    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    return json({ ok: true });
  }

  if (area === 'content' && method === 'PUT') {
    const content = await readJson(req, MAX_CONTENT_BYTES);
    if (typeof content['name'] !== 'string') throw new HttpError(400, 'That does not look like site content.');
    await env.DB.prepare(
      `INSERT INTO content (id, json, updated_at) VALUES (1, ?, ?)
       ON CONFLICT (id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
    )
      .bind(JSON.stringify(content), Date.now())
      .run();
    return json({ ok: true });
  }

  throw new HttpError(404, 'Not found.');
}
