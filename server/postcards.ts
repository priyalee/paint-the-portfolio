import { MARK_ID, MAX_FROM, MAX_MESSAGE, MAX_MESSAGE_LINES } from '../src/app/core/wall-limits';
import type { Env } from './env';
import { HttpError, cleanMultiline, cleanText, json, rateLimit, readJson, visitorHash } from './http';

/**
 * Largest image accepted per side (the site sends ~100–300 KB JPEGs). Both
 * sides live in one database row, which D1 caps at 2 MB.
 */
const MAX_IMAGE_BYTES = 800_000;
const POSTCARDS_PER_HOUR = 3;
const RACK_SIZE = 24;
/**
 * Most postcards that can wait for review at once (about 1.6 MB each at most).
 * New ones are refused until the owner approves, hides or deletes some, so a
 * flood can't fill the database.
 */
export const MAX_PENDING = 200;

export interface PostcardRow {
  id: string;
  message: string;
  sender: string;
  status: string;
  created_at: number;
  /** 1 when the card has a written back side (cards sent before two-sided postcards don't). */
  has_back: number;
}

/** The columns every postcard listing selects. */
export const POSTCARD_COLUMNS = 'id, message, sender, status, created_at, back IS NOT NULL AS has_back';

export function toPublic(r: PostcardRow) {
  return {
    id: r.id,
    message: r.message,
    from: r.sender,
    status: r.status,
    createdAt: r.created_at,
    imageUrl: `/api/postcards/${r.id}/image`,
    backUrl: r.has_back ? `/api/postcards/${r.id}/back` : null,
  };
}

/**
 * GET  /api/postcards            → approved postcards (the public rack)
 * POST /api/postcards            → send a postcard to the owner (pending until approved)
 * GET  /api/postcards/:id/image  → the front (painting) of an approved postcard
 * GET  /api/postcards/:id/back   → its back (message side)
 */
export async function postcards(req: Request, env: Env, rest: string[], ctx?: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
  if (req.method === 'GET' && rest.length === 0) {
    const { results } = await env.DB.prepare(
      `SELECT ${POSTCARD_COLUMNS} FROM postcards
       WHERE status = 'approved' ORDER BY created_at DESC LIMIT ?`,
    )
      .bind(RACK_SIZE)
      .all<PostcardRow>();
    return json(results.map(toPublic), 200, { 'cache-control': 'public, max-age=60' });
  }

  if (req.method === 'GET' && rest.length === 2 && (rest[1] === 'image' || rest[1] === 'back')) {
    return image(env, rest[0], false, rest[1] === 'back');
  }

  if (req.method === 'POST' && rest.length === 0) {
    const body = await readJson(req, MAX_IMAGE_BYTES * 2 * 1.4 + 4_000);
    // Always the server's own id, so a reused one can't silently drop a card.
    const id = crypto.randomUUID();
    const front = decodeImage(body['image']);
    // Older copies of the site only send the front.
    const back = body['back'] === undefined ? null : decodeImage(body['back']);
    const message = cleanMultiline(body['message'], MAX_MESSAGE, MAX_MESSAGE_LINES);
    const sender = cleanText(body['from'], MAX_FROM) || 'a visitor';
    const who = await visitorHash(req, env);
    await rateLimit(env, who, 'postcard', POSTCARDS_PER_HOUR, 3600_000);

    // One statement: refused when the review queue is already full.
    const result = await env.DB.prepare(
      `INSERT INTO postcards (id, message, sender, image, image_type, back, back_type, status, created_at, ip_hash)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, 'pending', ?8, ?9
       WHERE (SELECT COUNT(*) FROM postcards WHERE status = 'pending') < ?10`,
    )
      .bind(id, message, sender, front.bytes, front.type, back?.bytes ?? null, back?.type ?? null, Date.now(), who, MAX_PENDING)
      .run();
    if (!result.meta.changes) {
      throw new HttpError(503, 'The postcard box is full right now — please try again in a day or two.');
    }

    const mail = notifyOwner(env, sender, message);
    if (ctx) ctx.waitUntil(mail);
    else await mail;
    return json({ ok: true, id }, 201);
  }

  throw new HttpError(405, 'Not allowed.');
}

/** Serves one side of a postcard. Pending/hidden ones only for the admin. */
export async function image(env: Env, id: string, admin: boolean, back = false): Promise<Response> {
  if (!MARK_ID.test(id)) throw new HttpError(404, 'Not found.');
  const cols = back ? 'back AS image, back_type AS image_type' : 'image, image_type';
  const row = await env.DB.prepare(`SELECT ${cols}, status FROM postcards WHERE id = ?`)
    .bind(id)
    .first<{ image: ArrayBuffer | number[] | null; image_type: string | null; status: string }>();
  if (!row?.image || !row.image_type || (!admin && row.status !== 'approved')) throw new HttpError(404, 'Not found.');
  const bytes = row.image instanceof ArrayBuffer ? row.image : new Uint8Array(row.image);
  return new Response(bytes, {
    headers: {
      'content-type': row.image_type,
      // Short cache, so a card the owner hides disappears for visitors within the hour.
      'cache-control': admin ? 'private, no-store' : 'public, max-age=3600',
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
