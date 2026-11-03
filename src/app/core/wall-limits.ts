/**
 * Limits shared by the site and the server (server/), so both sides validate
 * the same way. Plain constants only — no Angular imports — because the
 * server bundles this file too.
 */
export const MAX_NAME = 24;
export const MAX_PLACE = 32;
export const MAX_MESSAGE = 80;
export const MAX_FROM = 24;

/** Size of the splash wall in SVG units. Splashes store positions in these units. */
export const SPLASH_WALL = { width: 1000, height: 560 } as const;
export const SPLASH_SIZE = { min: 42, max: 74 } as const;

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;
/** Ids are made in the browser (crypto.randomUUID) so the visitor can remember them. */
export const MARK_ID = /^[A-Za-z0-9-]{8,64}$/;
