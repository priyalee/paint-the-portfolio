import {
  Box,
  drawArtwork,
  drawPostmark,
  drawStamp,
  fitText,
  layout,
  wrapText,
} from '@core/postcard-art';
import { drawScene } from '@core/postcard-scene';
import { MAX_MESSAGE_LINES } from '@core/wall-limits';

/** Both sides of the card are drawn at this size (16:10, like the preview). */
export const CARD = { w: 1600, h: 1000 } as const;

/** The card's own colours: light or dark paper, independent of the page. */
export interface CardColours {
  paper: string;
  paper2: string;
  ink: string;
  muted: string;
}

export interface FrontOptions {
  /** 0–3 snapshots of what the visitor painted; with none, the card's own landscape is drawn. */
  images: CanvasImageSource[];
  /** "Priyalee Dahiya's portfolio" */
  title: string;
  /** The public address, or null (never printed on localhost). */
  site: string | null;
}

export interface BackOptions {
  message: string;
  from: string;
  stamp: string;
  /** Big lettering on the stamp: initials, or two short lines. */
  stampLabel: string[];
  /** The address block: name, then up to two more lines. */
  to: string[];
  date: Date;
}

const { w: W, h: H } = CARD;
const HAND = '"Caveat", cursive';
const SERIF = '"Fraunces", serif';
const SANS = '"DM Sans", sans-serif';

/** Ruled writing lines on the back, shared by the message and the address. */
const RULE_TOP = 300;
const RULE_GAP = 92;
const RULES = MAX_MESSAGE_LINES + 1; // message lines + the signature line
const ruleY = (i: number) => RULE_TOP + i * RULE_GAP;
/** The dashed line between the message (left) and the address (right). */
const DIVIDER = 920;

/** The picture side: the visitor's painting (or the card's landscape) with a "Greetings from" banner. */
export function drawFront(ctx: CanvasRenderingContext2D, c: CardColours, o: FrontOptions): void {
  sheet(ctx, c);

  const art: Box = { x: 64, y: 64, w: W - 128, h: H - 64 - 170 };
  if (o.images.length) {
    layout(o.images.length, art).forEach((box, i) => drawArtwork(ctx, o.images[i], box, c.ink));
  } else {
    drawScene(ctx, art, c.ink, c.paper);
  }

  label(ctx, 'GREETINGS FROM', 64, H - 126, c.muted, 4);
  ctx.fillStyle = c.ink;
  const titleWidth = W - 128 - (o.site ? 440 : 0);
  fitText(ctx, o.title, 64, H - 62, titleWidth, 64, '600', SERIF);

  if (o.site) {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = c.muted;
    ctx.letterSpacing = '2px';
    fitText(ctx, o.site.toUpperCase(), W - 64, H - 70, 400, 22, '700', SANS);
    ctx.restore();
  }
}

/** The written side: message on the left, stamp and address on the right. */
export function drawBack(ctx: CanvasRenderingContext2D, c: CardColours, o: BackOptions): void {
  sheet(ctx, c);

  // "POST CARD" across the top, like a real one.
  ctx.save();
  ctx.fillStyle = c.ink;
  ctx.textAlign = 'center';
  ctx.font = `600 40px ${SERIF}`;
  ctx.letterSpacing = '12px';
  ctx.fillText('POST CARD', DIVIDER - 40, 130);
  ctx.restore();

  // Divider
  ctx.save();
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(DIVIDER, 190);
  ctx.lineTo(DIVIDER, H - 90);
  ctx.stroke();
  ctx.restore();

  // ---- Left: the message on ruled lines, signed on the last one.
  const left = { x: 72, w: DIVIDER - 48 - 72 };
  rules(ctx, left.x, left.w, 0, RULES - 1, c.muted);
  ctx.fillStyle = c.ink;
  const body = wrapText(ctx, o.message, left.w - 8, MAX_MESSAGE_LINES, 66, '500', HAND);
  body.lines.forEach((line, i) => ctx.fillText(line, left.x + 4, ruleY(i) - 16));

  ctx.save();
  ctx.textAlign = 'right';
  fitText(ctx, `— ${o.from}`, left.x + left.w, ruleY(RULES - 1) - 16, left.w * 0.7, 56, '600', HAND);
  ctx.restore();

  // ---- Right: stamp, postmark and the address.
  const right = { x: DIVIDER + 48, w: W - 72 - (DIVIDER + 48) };
  const stamp: Box = { x: W - 72 - 160, y: 72, w: 160, h: 186 };
  drawStamp(ctx, stamp, o.stamp, c.ink, c.paper, o.stampLabel);
  drawPostmark(ctx, stamp.x - 80, stamp.y + 110, o.date, c.ink);

  const first = RULES - 4; // the address uses the bottom four rules
  label(ctx, 'TO', right.x, ruleY(first) - 64, c.muted, 4);
  rules(ctx, right.x, right.w, first, RULES - 1, c.muted);
  ctx.fillStyle = c.ink;
  o.to.slice(0, 3).forEach((line, i) => {
    if (!line) return;
    const size = i === 0 ? 60 : 46;
    fitText(ctx, line, right.x + 4, ruleY(first + i) - 16, right.w - 8, size, i === 0 ? '600' : '500', HAND);
  });
}

/** Both sides one above the other, for a single download. */
export function stackSides(front: HTMLCanvasElement, back: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(front, 0, 0);
  ctx.drawImage(back, 0, H);
  return canvas;
}

// ----------------------------------------------------------- helpers

/** Paper and the inset ink border every side has. */
function sheet(ctx: CanvasRenderingContext2D, c: CardColours): void {
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, W - 48, H - 48);
}

function rules(ctx: CanvasRenderingContext2D, x: number, w: number, from: number, to: number, colour: string): void {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  for (let i = from; i <= to; i++) {
    ctx.beginPath();
    ctx.moveTo(x, ruleY(i));
    ctx.lineTo(x + w, ruleY(i));
    ctx.stroke();
  }
  ctx.restore();
}

/** Small spaced-out capitals, used for "GREETINGS FROM" and "TO". */
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, spacing: number): void {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.font = `700 22px ${SANS}`;
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(text, x, y);
  ctx.restore();
}
