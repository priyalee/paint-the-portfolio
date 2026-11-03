import { MARK_ID, MAX_FROM, MAX_MESSAGE } from '../src/app/core/wall-limits';
import type { Env } from './env';
import { HttpError, cleanText, json, rateLimit, readJson, visitorHash } from './http';

/** Largest postcard image accepted (the site sends ~150–400 KB JPEGs). */
const MAX_IMAGE_BYTES = 1_200_000;
const POSTCARDS_PER_HOUR = 3;
const RACK_SIZE = 24;

export interface PostcardRow {
  id: string;
  message: string;
  sender: string;
  status: string;
  created_at: number;
}

export function toPublic(r: PostcardRow) {
  return {
    id: r.id,
    message: r.message,
    from: r.sender,
    status: r.status,
    createdAt: r.created_at,
    imageUrl: `/api/postcards/${r.id}/image`,
  };
}

/**
 * GET  /api/postcards            → approved postcards (the public rack)
 * POST /api/postcards            → send a postcard to the owner (pending until approved)
 * GET  /api/postcards/:id/image  → the image of an approved postcard
 */
export async function postcards(req: Request, env: Env, rest: string[], ctx?: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
  if (req.method === 'GET' && rest.length === 0) {
    const { results } = await env.DB.prepare(
      `SELECT id, message, sender, status, created_at FROM postcards
       WHERE status = 'approved' ORDER BY created_at DESC LIMIT ?`,
    )
      .bind(RACK_SIZE)
      .all<PostcardRow>();
    return json(results.map(toPublic), 200, { 'cache-control': 'public, max-age=60' });
  }

  if (req.method === 'GET' && rest.length === 2 && rest[1] === 'image') {
    return image(env, rest[0], false);
  }

  if (req.method === 'POST' && rest.length === 0) {
    const body = await readJson(req, MAX_IMAGE_BYTES * 1.4 + 4_000);
    const id = typeof body['id'] === 'string' && MARK_ID.test(body['id']) ? body['id'] : crypto.randomUUID();
    const { bytes, type } = decodeImage(body['image']);
    const message = cleanText(body['message'], MAX_MESSAGE);
    const sender = cleanText(body['from'], MAX_FROM) || 'a visitor';
    const who = await visitorHash(req, env);
    await rateLimit(env, who, 'postcard', POSTCARDS_PER_HOUR, 3600_000);

    await env.DB.prepare(
      `INSERT INTO postcards (id, message, sender, image, image_type, status, created_at, ip_hash)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?) ON CONFLICT DO NOTHING`,
    )
      .bind(id, message, sender, bytes, type, Date.now(), who)
      .run();

    const mail = notifyOwner(env, sender, message);
    if (ctx) ctx.waitUntil(mail);
    else await mail;
    return json({ ok: true, id }, 201);
  }

  throw new HttpError(405, 'Not allowed.');
}

/** Serves a postcard image. Pending/hidden ones only for the admin. */
export async function image(env: Env, id: string, admin: boolean): Promise<Response> {
  if (!MARK_ID.test(id)) throw new HttpError(404, 'Not found.');
  const row = await env.DB.prepare('SELECT image, image_type, status FROM postcards WHERE id = ?')
    .bind(id)
    .first<{ image: ArrayBuffer | number[]; image_type: string; status: string }>();
  if (!row || (!admin && row.status !== 'approved')) throw new HttpError(404, 'Not found.');
  const bytes = row.image instanceof ArrayBuffer ? row.image : new Uint8Array(row.image);
  return new Response(bytes, {
    headers: {
      'content-type': row.image_type,
      'cache-control': admin ? 'private, no-store' : 'public, max-age=86400',
      'x-content-type-options': 'nosniff',
    },
  });
}

/** Accepts a data: URL of a JPEG, PNG or WebP image and checks its real format. */
function decodeImage(value: unknown): { bytes: Uint8Array; type: string } {
  const match = typeof value === 'string' ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value) : null;
  if (!match) throw new HttpError(400, 'The postcard picture is missing.');
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  } catch {
    throw new HttpError(400, 'The postcard picture could not be read.');
  }
  if (bytes.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'That postcard is too big to send.');
  const type = sniff(bytes);
  if (!type || type !== match[1]) throw new HttpError(400, 'The postcard picture could not be read.');
  return { bytes, type };
}

function sniff(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) {
    return 'image/webp';
  }
  return null;
}

/** Optional email so the owner hears about new postcards (needs RESEND_API_KEY + NOTIFY_EMAIL). */
async function notifyOwner(env: Env, sender: string, message: string): Promise<void> {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: 'Portfolio postcards <onboarding@resend.dev>',
        to: [env.NOTIFY_EMAIL],
        subject: `New postcard from ${sender}`,
        text: `${sender} sent you a postcard:\n\n"${message || 'Wish you were here!'}"\n\nApprove or hide it at /admin.`,
      }),
    });
  } catch {
    /* email is best-effort; the postcard is already saved */
  }
}
