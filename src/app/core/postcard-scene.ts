import type { Box } from '@core/postcard-art';

/**
 * The postcard's own picture: a linocut-style landscape (sunrise over
 * snow-capped peaks, a lake with a sailboat, pines on the shore), drawn in
 * the card's ink on the card's paper only, so it stays monochrome and works
 * on light and dark cards alike. Used on the front whenever the page has no
 * painting of its own to put there (e.g. the Contact page).
 *
 * Drawn in a fixed 1488 × 766 design space, then scaled into the box.
 */
const DW = 1488;
const DH = 766;
const SHADOW = 10;
const HORIZON = 520;

type Pt = readonly [number, number];

export function drawScene(ctx: CanvasRenderingContext2D, box: Box, ink: string, paper: string): void {
  const b = { x: box.x, y: box.y, w: box.w - SHADOW, h: box.h - SHADOW };

  // Print shadow + paper, like the other artwork on the card.
  ctx.fillStyle = ink;
  ctx.fillRect(b.x + SHADOW, b.y + SHADOW, b.w, b.h);
  ctx.fillStyle = paper;
  ctx.fillRect(b.x, b.y, b.w, b.h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(b.x, b.y, b.w, b.h);
  ctx.clip();
  // Cover the box with the design space (crop the edges if the shape differs).
  const s = Math.max(b.w / DW, b.h / DH);
  ctx.translate(b.x + (b.w - DW * s) / 2, b.y + (b.h - DH * s) / 2);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const rand = seeded(20261116);
  const sun: Pt = [744, 372];

  sunRays(ctx, sun, ink);
  sunDisc(ctx, sun, 118, ink, paper);
  cloud(ctx, 250, 175, 1, ink, paper);
  cloud(ctx, 1235, 140, 0.8, ink, paper);
  birds(ctx, ink);

  // Far range: drawn lighter, with fine horizontal lines for distance.
  const far: Pt[] = [
    [0, 430], [150, 382], [260, 402], [380, 338], [470, 372], [590, 322], [690, 402], [744, 432],
    [800, 398], [905, 312], [1000, 362], [1140, 330], [1270, 382], [1400, 350], [1488, 392],
  ];
  range(ctx, far, ink, paper, 2.5);
  hatch(ctx, closed(far), ink, { gap: 8, angle: 0, width: 1.4 });

  // Near range: two big snow-capped peaks with the sun rising in the valley.
  const near: Pt[] = [
    [0, 470], [120, 402], [230, 330], [330, 250], [430, 198], [500, 250], [560, 300], [620, 362],
    [680, 422], [744, 458], [810, 416], [880, 360], [960, 290], [1030, 245], [1090, 222], [1160, 265],
    [1240, 320], [1330, 372], [1420, 420], [1488, 452],
  ];
  range(ctx, near, ink, paper, 3.5);
  // Shadowed faces (light comes from the left).
  hatch(ctx, [[430, 198], [500, 250], [560, 300], [620, 362], [680, 422], [744, 458], [744, HORIZON], [520, HORIZON], [470, 330]], ink, { gap: 9, angle: -45, width: 2 });
  hatch(ctx, [[1090, 222], [1160, 265], [1240, 320], [1330, 372], [1420, 420], [1488, 452], [1488, HORIZON], [1180, HORIZON], [1125, 370]], ink, { gap: 9, angle: -45, width: 2 });
  hatch(ctx, [[0, 470], [120, 402], [180, 368], [210, HORIZON], [0, HORIZON]], ink, { gap: 9, angle: -45, width: 2 });
  snowCap(ctx, [311, 265], [[330, 250], [430, 198], [500, 250]], [518, 265], ink, paper, rand);
  snowCap(ctx, [968, 285], [[1030, 245], [1090, 222], [1160, 265]], [1189, 285], ink, paper, rand);
  // Ridge lines dividing the lit and shaded faces.
  line(ctx, [[430, 198], [470, 330], [520, HORIZON]], ink, 2.5);
  line(ctx, [[1090, 222], [1125, 370], [1180, HORIZON]], ink, 2.5);

  lake(ctx, sun[0], ink, paper, rand);
  sailboat(ctx, 1040, 588, ink, paper);
  shore(ctx, ink, paper, rand);
  grain(ctx, ink, paper, rand);

  ctx.restore();
  frame(ctx, b, ink, paper);
}

/**
 * Old-print wear: tiny paper flecks where the ink didn't take, and a light
 * dusting of ink specks on the paper, like a hand-pulled linocut.
 */
function grain(ctx: CanvasRenderingContext2D, ink: string, paper: string, rand: () => number): void {
  ctx.save();
  ctx.fillStyle = paper;
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < 900; i++) {
    ctx.beginPath();
    ctx.arc(rand() * DW, rand() * DH, 0.6 + rand() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 260; i++) {
    ctx.beginPath();
    ctx.arc(rand() * DW, rand() * DH, 0.5 + rand() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A vintage frame: heavy outer rule, thin inner rule and a small diamond at each corner. */
function frame(ctx: CanvasRenderingContext2D, b: { x: number; y: number; w: number; h: number }, ink: string, paper: string): void {
  const inset = 14;
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(b.x + inset, b.y + inset, b.w - inset * 2, b.h - inset * 2);
  const corners: Pt[] = [
    [b.x + inset, b.y + inset],
    [b.x + b.w - inset, b.y + inset],
    [b.x + inset, b.y + b.h - inset],
    [b.x + b.w - inset, b.y + b.h - inset],
  ];
  for (const [x, y] of corners) {
    const d = 9;
    const diamond = poly([[x, y - d], [x + d, y], [x, y + d], [x - d, y]]);
    ctx.fillStyle = paper;
    ctx.fill(diamond);
    ctx.lineWidth = 2;
    ctx.stroke(diamond);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ----------------------------------------------------------- sky

function sunRays(ctx: CanvasRenderingContext2D, [cx, cy]: Pt, ink: string): void {
  ctx.save();
  ctx.strokeStyle = ink;
  for (let i = 0; i <= 40; i++) {
    const a = Math.PI + (i / 40) * Math.PI;
    const long = i % 2 === 0;
    ctx.lineWidth = long ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150);
    ctx.lineTo(cx + Math.cos(a) * (long ? 1100 : 520), cy + Math.sin(a) * (long ? 1100 : 520));
    ctx.stroke();
  }
  ctx.restore();
}

function sunDisc(ctx: CanvasRenderingContext2D, [cx, cy]: Pt, r: number, ink: string, paper: string): void {
  ctx.save();
  ctx.fillStyle = paper;
  ctx.strokeStyle = ink;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // Engraved bands across the lower half of the sun.
  ctx.beginPath();
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineWidth = 2;
  for (let y = cy + 12, i = 0; y < cy + r; y += 14, i++) {
    ctx.lineWidth = 1.5 + i * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - r, y);
    ctx.lineTo(cx + r, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** A puffy cloud: stroke every puff thickly, then fill them, leaving only the outer outline. */
function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, ink: string, paper: string): void {
  const puffs: [number, number, number][] = [
    [-110, 18, 34], [-62, -8, 48], [0, -24, 62], [64, -6, 46], [112, 16, 32],
  ];
  const path = new Path2D();
  for (const [dx, dy, r] of puffs) {
    path.moveTo(x + (dx + r) * k, y + dy * k);
    path.arc(x + dx * k, y + dy * k, r * k, 0, Math.PI * 2);
  }
  path.rect(x - 112 * k, y + 4 * k, 224 * k, 44 * k);
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 7;
  ctx.stroke(path);
  ctx.fillStyle = paper;
  ctx.fill(path);
  // Flat base line and a few contour strokes.
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 150 * k, y + 48 * k);
  ctx.lineTo(x + 150 * k, y + 48 * k);
  ctx.stroke();
  ctx.lineWidth = 2;
  for (const [dx, w] of [[-70, 70], [10, 90]] as const) {
    ctx.beginPath();
    ctx.moveTo(x + dx * k, y + 30 * k);
    ctx.lineTo(x + (dx + w) * k, y + 30 * k);
    ctx.stroke();
  }
  ctx.restore();
}

function birds(ctx: CanvasRenderingContext2D, ink: string): void {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  for (const [x, y, k] of [[470, 120, 1], [520, 92, 0.8], [548, 140, 0.65], [1010, 120, 0.7]] as const) {
    ctx.beginPath();
    ctx.moveTo(x - 22 * k, y);
    ctx.quadraticCurveTo(x - 10 * k, y - 14 * k, x, y);
    ctx.quadraticCurveTo(x + 10 * k, y - 14 * k, x + 22 * k, y);
    ctx.stroke();
  }
  ctx.restore();
}

// ----------------------------------------------------------- mountains

/** Closes a ridge line down to the horizon so it can be filled. */
function closed(ridge: Pt[]): Pt[] {
  return [...ridge, [DW, HORIZON], [0, HORIZON]];
}

function range(ctx: CanvasRenderingContext2D, ridge: Pt[], ink: string, paper: string, width: number): void {
  ctx.save();
  ctx.fillStyle = paper;
  ctx.fill(poly(closed(ridge)));
  ctx.strokeStyle = ink;
  ctx.lineWidth = width;
  ctx.stroke(poly(ridge, false));
  ctx.restore();
}

/** Snow above a jagged line between two points on a peak's slopes. */
function snowCap(
  ctx: CanvasRenderingContext2D,
  left: Pt,
  top: Pt[],
  right: Pt,
  ink: string,
  paper: string,
  rand: () => number,
): void {
  const edge: Pt[] = [];
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const x = left[0] + ((right[0] - left[0]) * i) / steps;
    const y = left[1] + ((right[1] - left[1]) * i) / steps + (i % 2 ? 26 : 4) + rand() * 8;
    edge.push([x, y]);
  }
  const cap = [left, ...top, right, ...[...edge].reverse()];
  ctx.save();
  ctx.fillStyle = paper;
  ctx.fill(poly(cap));
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.stroke(poly([left, ...edge, right], false));
  ctx.restore();
}

// ----------------------------------------------------------- water & shore

function lake(ctx: CanvasRenderingContext2D, sunX: number, ink: string, paper: string, rand: () => number): void {
  ctx.save();
  ctx.fillStyle = paper;
  ctx.fillRect(0, HORIZON, DW, DH - HORIZON);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  line(ctx, [[0, HORIZON], [DW, HORIZON]], ink, 3);

  // The sun's reflection: broken bars that narrow towards the viewer.
  for (let i = 0; i < 9; i++) {
    const y = HORIZON + 16 + i * 13;
    const half = 120 - i * 11;
    ctx.lineWidth = 3;
    const gap = 10 + rand() * 18;
    line(ctx, [[sunX - half, y], [sunX - gap, y]], ink, 3);
    line(ctx, [[sunX + gap * 0.6, y], [sunX + half * (0.7 + rand() * 0.3), y]], ink, 3);
  }

  // Ripples: short dashes, denser and longer nearer the shore.
  for (let i = 0; i < 70; i++) {
    const t = rand();
    const y = HORIZON + 14 + t * 150;
    const x = rand() * DW;
    if (Math.abs(x - sunX) < 150 && y < HORIZON + 130) continue;
    const len = 18 + t * 60;
    line(ctx, [[x, y], [x + len, y]], ink, 1.5 + t);
  }
  ctx.restore();
}

function sailboat(ctx: CanvasRenderingContext2D, x: number, y: number, ink: string, paper: string): void {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 2.5;
  // Hull
  ctx.fill(poly([[x - 62, y], [x + 66, y], [x + 46, y + 18], [x - 46, y + 18]]));
  // Mast
  line(ctx, [[x, y], [x, y - 128]], ink, 3);
  // Mainsail (hatched) and jib (plain)
  const main: Pt[] = [[x + 5, y - 122], [x + 5, y - 8], [x + 70, y - 8]];
  ctx.fillStyle = paper;
  ctx.fill(poly(main));
  hatch(ctx, main, ink, { gap: 7, angle: 0, width: 1.5 });
  ctx.stroke(poly(main));
  const jib: Pt[] = [[x - 5, y - 110], [x - 5, y - 8], [x - 52, y - 8]];
  ctx.fill(poly(jib));
  ctx.stroke(poly(jib));
  // Reflection
  for (let i = 0; i < 3; i++) line(ctx, [[x - 40 + i * 10, y + 28 + i * 10], [x + 40 - i * 10, y + 28 + i * 10]], ink, 2);
  ctx.restore();
}

/** Dark shore along the bottom with pines at both ends, and carved lines for texture. */
function shore(ctx: CanvasRenderingContext2D, ink: string, paper: string, rand: () => number): void {
  ctx.save();
  ctx.fillStyle = ink;
  const ground: Pt[] = [[0, 668]];
  for (let x = 0; x <= DW; x += 62) ground.push([x, 690 + Math.sin(x / 170) * 14 + rand() * 6 - (x < 420 || x > 1180 ? 22 : 0)]);
  ground.push([DW, DH], [0, DH]);
  ctx.fill(poly(ground));
  for (let i = 0; i < 26; i++) {
    const y = 716 + rand() * 44;
    const x = rand() * DW;
    line(ctx, [[x, y], [x + 30 + rand() * 70, y]], paper, 2);
  }

  const pines: [number, number][] = [
    [40, 250], [110, 300], [175, 220], [240, 175], [300, 130], [355, 96],
    [1180, 110], [1240, 160], [1300, 230], [1370, 290], [1440, 245],
  ];
  for (const [x, h] of pines) pine(ctx, x, 690, h, ink, rand);
  ctx.restore();
}

function pine(ctx: CanvasRenderingContext2D, x: number, base: number, h: number, ink: string, rand: () => number): void {
  const w = h * 0.34;
  const tiers = Math.max(4, Math.round(h / 34));
  const pts: Pt[] = [[x, base - h]];
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers;
    const y = base - h + t * (h * 0.86);
    const spread = w * t * (0.85 + rand() * 0.25);
    pts.push([x + spread, y], [x + spread * 0.55, y - 2]);
  }
  const left = pts.slice(1).map(([px, py]) => [2 * x - px, py] as Pt).reverse();
  ctx.fillStyle = ink;
  ctx.fill(poly([...pts, ...left]));
  ctx.fillRect(x - 4, base - h * 0.16, 8, h * 0.16 + 4);
}

// ----------------------------------------------------------- helpers

function poly(pts: readonly Pt[], close = true): Path2D {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  if (close) p.closePath();
  return p;
}

function line(ctx: CanvasRenderingContext2D, pts: readonly Pt[], ink: string, width: number): void {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = width;
  ctx.stroke(poly(pts, false));
  ctx.restore();
}

/** Parallel engraving lines clipped to a shape. */
function hatch(
  ctx: CanvasRenderingContext2D,
  shape: readonly Pt[],
  ink: string,
  o: { gap: number; angle: number; width: number },
): void {
  const xs = shape.map((p) => p[0]);
  const ys = shape.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const reach = Math.hypot(x1 - x0, y1 - y0) / 2 + o.gap;
  const a = (o.angle * Math.PI) / 180;
  const [dx, dy] = [Math.cos(a), Math.sin(a)];
  const [nx, ny] = [-dy, dx];
  ctx.save();
  ctx.clip(poly(shape));
  ctx.strokeStyle = ink;
  ctx.lineWidth = o.width;
  ctx.beginPath();
  for (let d = -reach; d <= reach; d += o.gap) {
    const [px, py] = [cx + nx * d, cy + ny * d];
    ctx.moveTo(px - dx * reach, py - dy * reach);
    ctx.lineTo(px + dx * reach, py + dy * reach);
  }
  ctx.stroke();
  ctx.restore();
}

/** Small seeded PRNG, so the scene is drawn the same way every time. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
