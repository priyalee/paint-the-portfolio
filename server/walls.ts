import { MURAL } from '../src/app/shared/art/mural';
import {
  HEX_COLOR,
  MARK_ID,
  MAX_NAME,
  MAX_PLACE,
  SPLASH_SIZE,
  SPLASH_WALL,
} from '../src/app/core/wall-limits';
import type { Env } from './env';
import {
  HttpError,
  cleanText,
  json,
  randomToken,
  rateLimit,
  readJson,
  sha256,
  visitorHash,
} from './http';

const REGION_IDS = new Set(MURAL.shapes.map((s) => s.id));
/** Wall writes (new marks + edits) allowed per visitor per hour. */
const WRITES_PER_HOUR = 12;

interface Signature {
  color: string;
  name: string;
  place: string;
}

function readSignature(body: Record<string, unknown>): Signature {
  const color = typeof body['color'] === 'string' ? body['color'] : '';
  if (!HEX_COLOR.test(color)) throw new HttpError(400, 'That colour could not be used.');
  return {
    color: color.toLowerCase(),
    name: cleanText(body['name'], MAX_NAME) || 'Anonymous',
    place: cleanText(body['place'], MAX_PLACE),
  };
}

function readId(value: unknown): string {
  if (typeof value !== 'string' || !MARK_ID.test(value)) throw new HttpError(400, 'Missing or invalid id.');
  return value;
}

// ------------------------------------------------------------------ mural

export async function mural(req: Request, env: Env, rest: string[]): Promise<Response> {
  if (req.method === 'GET' && rest.length === 0) {
    const { results } = await env.DB.prepare(
      'SELECT id, region_id, color, name, place, created_at FROM mural_claims ORDER BY created_at',
    ).all<{ id: string; region_id: string; color: string; name: string; place: string; created_at: number }>();
    return json(
      results.map((r) => ({
        id: r.id,
        regionId: r.region_id,
        color: r.color,
        name: r.name,
        place: r.place,
        createdAt: r.created_at,
      })),
    );
  }

  if (req.method === 'POST' && rest.length === 0) {
    const body = await readJson(req);
    const id = readId(body['id']);
    const regionId = typeof body['regionId'] === 'string' ? body['regionId'] : '';
    if (!REGION_IDS.has(regionId)) throw new HttpError(400, 'That shape is not on the mural.');
    const sig = readSignature(body);
    const who = await visitorHash(req, env);
    await rateLimit(env, who, 'wall', WRITES_PER_HOUR, 3600_000);

    const token = randomToken();
    const createdAt = Date.now();
    const result = await env.DB.prepare(
      `INSERT INTO mural_claims (id, region_id, color, name, place, created_at, token_hash, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
    )
      .bind(id, regionId, sig.color, sig.name, sig.place, createdAt, await sha256(token), who)
      .run();
    if (!result.meta.changes) {
      throw new HttpError(409, 'Someone just painted that shape — pick another one.');
    }
    return json({ claim: { id, regionId, ...sig, createdAt }, editToken: token }, 201);
  }

  if (req.method === 'PATCH' && rest.length === 1) {
    const id = readId(rest[0]);
    const body = await readJson(req);
    const sig = readSignature(body);
    const token = typeof body['editToken'] === 'string' ? body['editToken'] : '';
    await rateLimit(env, await visitorHash(req, env), 'wall', WRITES_PER_HOUR, 3600_000);
    const result = await env.DB.prepare(
      'UPDATE mural_claims SET color = ?, name = ?, place = ? WHERE id = ? AND token_hash = ?',
    )
      .bind(sig.color, sig.name, sig.place, id, await sha256(token))
      .run();
    if (!result.meta.changes) throw new HttpError(403, 'Only the painter can change this shape.');
    return json({ ok: true });
  }

  throw new HttpError(405, 'Not allowed.');
}

// --------------------------------------------------------------- splashes

export async function splashes(req: Request, env: Env, rest: string[]): Promise<Response> {
  if (req.method === 'GET' && rest.length === 0) {
    const { results } = await env.DB.prepare(
      'SELECT id, x, y, seed, size, color, name, place, created_at FROM splashes ORDER BY created_at',
    ).all<{
      id: string;
      x: number;
      y: number;
      seed: number;
      size: number;
      color: string;
      name: string;
      place: string;
      created_at: number;
    }>();
    return json(results.map(({ created_at, ...s }) => ({ ...s, createdAt: created_at })));
  }

  if (req.method === 'POST' && rest.length === 0) {
    const body = await readJson(req);
    const id = readId(body['id']);
    const x = Number(body['x']);
    const y = Number(body['y']);
    const seed = Number(body['seed']);
    const size = Number(body['size']);
    if (
      !(x >= 0 && x <= SPLASH_WALL.width) ||
      !(y >= 0 && y <= SPLASH_WALL.height) ||
      !Number.isInteger(seed) ||
      !(size >= SPLASH_SIZE.min && size <= SPLASH_SIZE.max)
    ) {
      throw new HttpError(400, 'That splash missed the wall — try again.');
    }
    const sig = readSignature(body);
    const who = await visitorHash(req, env);
    await rateLimit(env, who, 'wall', WRITES_PER_HOUR, 3600_000);

    const token = randomToken();
    const createdAt = Date.now();
    const result = await env.DB.prepare(
      `INSERT INTO splashes (id, x, y, seed, size, color, name, place, created_at, token_hash, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
    )
      .bind(id, x, y, seed, size, sig.color, sig.name, sig.place, createdAt, await sha256(token), who)
      .run();
    if (!result.meta.changes) throw new HttpError(409, 'That splash is already on the wall.');
    return json({ splash: { id, x, y, seed, size, ...sig, createdAt }, editToken: token }, 201);
  }

  if (req.method === 'PATCH' && rest.length === 1) {
    const id = readId(rest[0]);
    const body = await readJson(req);
    const sig = readSignature(body);
    const token = typeof body['editToken'] === 'string' ? body['editToken'] : '';
    await rateLimit(env, await visitorHash(req, env), 'wall', WRITES_PER_HOUR, 3600_000);
    const result = await env.DB.prepare(
      'UPDATE splashes SET color = ?, name = ?, place = ? WHERE id = ? AND token_hash = ?',
    )
      .bind(sig.color, sig.name, sig.place, id, await sha256(token))
      .run();
    if (!result.meta.changes) throw new HttpError(403, 'Only the painter can change this splash.');
    return json({ ok: true });
  }

  throw new HttpError(405, 'Not allowed.');
}
