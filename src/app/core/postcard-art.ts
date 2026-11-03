import { luminance } from '@core/paint-state';
import { sizeOf } from '@core/snapshot';
import { splatPaths } from '@shared/art/splat';

/** Canvas drawing helpers for the postcard (kept apart from the service logic). */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SHADOW = 10;

/** One big panel, two stacked, or one big + two side by side underneath. */
export function layout(count: number, a: Box): Box[] {
  const gap = 28;
  if (count <= 1) return [a];
  if (count === 2) {
    const h = (a.h - gap) / 2;
    return [
      { ...a, h },
      { ...a, y: a.y + h + gap, h },
    ];
  }
  const big = a.h * 0.6;
  const w = (a.w - gap) / 2;
  const h = a.h - big - gap;
  return [
    { ...a, h: big },
    { x: a.x, y: a.y + big + gap, w, h },
    { x: a.x + w + gap, y: a.y + big + gap, w, h },
  ];
}

/**
 * Draws a painting like a print pinned to the card: scaled to fit the box,
 * centred, with an ink border and the site's offset shadow. No empty mat
 * around it, so the picture always fills as much of the box as it can.
 */
export function drawArtwork(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  box: Box,
  ink: string,
): void {
  const { w, h } = sizeOf(img);
  const scale = Math.min((box.w - SHADOW) / w, (box.h - SHADOW) / h);
  const dw = w * scale;
  const dh = h * scale;
  const x = box.x + (box.w - SHADOW - dw) / 2;
  const y = box.y + (box.h - SHADOW - dh) / 2;
  ctx.fillStyle = ink;
  ctx.fillRect(x + SHADOW, y + SHADOW, dw, dh);
  ctx.drawImage(img, x, y, dw, dh);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, dw, dh);
}

/**
 * Used when the current page has nothing to capture: a burst of paint
 * splats in the visitor's palette, so the card is never blank.
 */
export function drawFallbackArt(
  ctx: CanvasRenderingContext2D,
  box: Box,
  colours: string[],
  ink: string,
  paper: string,
): void {
  const b = { x: box.x, y: box.y, w: box.w - SHADOW, h: box.h - SHADOW };
  ctx.fillStyle = ink;
  ctx.fillRect(b.x + SHADOW, b.y + SHADOW, b.w, b.h);
  ctx.fillStyle = paper;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(b.x, b.y, b.w, b.h);
  ctx.clip();
  const spots = [
    [0.2, 0.3, 96],
    [0.42, 0.58, 120],
    [0.7, 0.26, 90],
    [0.76, 0.7, 118],
    [0.18, 0.78, 76],
    [0.5, 0.12, 56],
    [0.9, 0.48, 60],
  ];
  const seed = Math.floor(Math.random() * 1e6);
  spots.forEach(([fx, fy, size], i) => {
    ctx.save();
    ctx.translate(b.x + b.w * fx, b.y + b.h * fy);
    ctx.fillStyle = colours[i % colours.length];
    for (const d of splatPaths(seed + i * 7919, size)) ctx.fill(new Path2D(d));
    ctx.restore();
  });
  ctx.restore();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
}

/**
 * A postage stamp in the visitor's active colour, with perforated edges.
 * The lettering picks black or white for contrast against the colour.
 */
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  box: Box,
  color: string,
  ink: string,
  paper: string,
): void {
  const { x, y, w, h } = box;
  const r = 7;
  const step = 20;
  ctx.save();
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  // Perforations: bite paper-coloured half circles out of every edge.
  ctx.fillStyle = paper;
  const bite = (cx: number, cy: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  for (let px = x + step / 2; px < x + w; px += step) {
    bite(px, y);
    bite(px, y + h);
  }
  for (let py = y + step / 2; py < y + h; py += step) {
    bite(x, py);
    bite(x + w, py);
  }
  // Inner frame + lettering
  const text = luminance(color) > 0.4 ? '#161513' : '#FFFFFF';
  ctx.strokeStyle = text;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 16, y + 16, w - 32, h - 32);
  ctx.globalAlpha = 1;
  ctx.fillStyle = text;
  ctx.textAlign = 'center';
  ctx.font = '600 30px "Fraunces", serif';
  ctx.fillText('Ink &', x + w / 2, y + h / 2 - 4);
  ctx.fillText('Pigment', x + w / 2, y + h / 2 + 30);
  ctx.font = '700 14px "DM Sans", sans-serif';
  ctx.fillText('HAND PAINTED', x + w / 2, y + h - 30);
  ctx.restore();
}

/** A round post-office cancellation mark with the date, plus wavy lines. */
export function drawPostmark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  date: Date,
  ink: string,
): void {
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
  const year = String(date.getFullYear());
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = '700 26px "DM Sans", sans-serif';
  ctx.fillText(day, cx, cy + 2);
  ctx.font = '600 18px "DM Sans", sans-serif';
  ctx.fillText(year, cx, cy + 28);
  ctx.font = '700 12px "DM Sans", sans-serif';
  ctx.fillText('POSTED', cx, cy - 26);
  // Cancellation waves to the left, so the stamp's lettering stays readable.
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    for (let t = 0; t <= 96; t += 4) {
      const px = cx - 72 - 96 + t;
      const py = cy + i * 18 + Math.sin(t / 12) * 5;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Word-wraps `text` into at most `maxLines` lines no wider than `maxWidth`,
 * shrinking the font (down to 70% of `size`) before trimming with an ellipsis.
 * Leaves ctx.font set to the size it settled on.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  size: number,
  weight: string,
  family: string,
): { lines: string[]; size: number } {
  let px = size;
  let lines: string[] = [];
  for (; px >= size * 0.7; px -= 2) {
    ctx.font = `${weight} ${px}px ${family}`;
    lines = breakLines(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { lines, size: px };
  }
  px += 2;
  ctx.font = `${weight} ${px}px ${family}`;
  lines = breakLines(ctx, text, maxWidth).slice(0, maxLines);
  let last = lines[maxLines - 1];
  while (ctx.measureText(last + '…').width > maxWidth && last.length > 1) last = last.slice(0, -1);
  lines[maxLines - 1] = last.trimEnd() + '…';
  return { lines, size: px };
}

function breakLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (let word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    // A single word wider than the line gets split by characters.
    while (ctx.measureText(word).width > maxWidth && word.length > 1) {
      let cut = word.length - 1;
      while (cut > 1 && ctx.measureText(word.slice(0, cut)).width > maxWidth) cut--;
      lines.push(word.slice(0, cut));
      word = word.slice(cut);
    }
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Writes one line of text, shrinking it (down to 60% of `size`) so it fits
 * `maxWidth`, then trimming with an ellipsis if it still doesn't.
 */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  weight: string,
  family: string,
): void {
  let px = size;
  const font = () => `${weight} ${px}px ${family}`;
  ctx.font = font();
  while (ctx.measureText(text).width > maxWidth && px > size * 0.6) {
    px -= 2;
    ctx.font = font();
  }
  let out = text;
  while (ctx.measureText(out).width > maxWidth && out.length > 1) out = out.slice(0, -2) + '…';
  ctx.fillText(out, x, y);
}
