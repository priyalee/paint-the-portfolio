import type { Env } from '../../server/env';
import { handle } from '../../server/router';

/** Cloudflare Pages Function: every /api/* request goes to the router in server/. */
export const onRequest: PagesFunction<Env> = (ctx) => handle(ctx.request, ctx.env, ctx);
