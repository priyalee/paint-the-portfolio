/**
 * Procedural paint splats. The same seed always produces the same shape, so
 * only the seed and size are stored, not the geometry.
 *
 * Every splat picks one of a few styles from its seed, so a wall full of them
 * looks varied: a classic round splash, a stretched throw with a spray trail,
 * a speckled splatter, a drippy blob, or two blobs that landed together.
 * Every part is returned as its own path (centred on 0,0), so overlapping
 * parts never cut holes in each other.
 */
export type SplatStyle = 'classic' | 'thrown' | 'splatter' | 'drippy' | 'double';
const STYLES: SplatStyle[] = ['classic', 'thrown', 'splatter', 'drippy', 'double'];

type Rand = () => number;

export function splatPaths(seed: number, size: number): string[] {
  const rand = mulberry32(seed);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const style = STYLES[Math.floor(rand() * STYLES.length)];
  const tilt = between(0, Math.PI * 2);
  const lumpy = between(0.5, 1.6);
  const paths: string[] = [];

  switch (style) {
    case 'classic':
      paths.push(blob(rand, 0, 0, size * 0.86, 1, tilt, lumpy));
      streaks(paths, rand, size, Math.round(between(3, 6)), 0, Math.PI * 2);
      droplets(paths, rand, size, Math.round(between(5, 10)), 0, Math.PI * 2, 1.15, 2);
      drips(paths, rand, size, rand() < 0.35 ? 2 : 1, 0.6, 1.4);
      break;

    case 'thrown': {
      // Stretched along the throw, with streaks and spray flying ahead of it.
      const dir = tilt;
      paths.push(blob(rand, 0, 0, size * 0.72, between(1.3, 1.6), dir, lumpy, 0.3));
      streaks(paths, rand, size * 1.25, Math.round(between(2, 4)), dir, 0.9);
      droplets(paths, rand, size, Math.round(between(10, 18)), dir, 0.8, 1.3, 2.8);
      if (rand() < 0.5) drips(paths, rand, size * 0.8, 1, 0.5, 1);
      break;
    }

    case 'splatter':
      // A small core in a cloud of speckles.
      paths.push(blob(rand, 0, 0, size * 0.5, between(1, 1.3), tilt, lumpy * 1.3));
      droplets(paths, rand, size, Math.round(between(22, 34)), 0, Math.PI * 2, 0.6, 2.3, 0.6);
      streaks(paths, rand, size * 0.7, Math.round(between(1, 3)), 0, Math.PI * 2);
      break;

    case 'drippy':
      // Landed heavy: a wide blob with long runs down the wall.
      paths.push(blob(rand, 0, 0, size * 0.85, between(1.1, 1.4), between(-0.3, 0.3), lumpy));
      droplets(paths, rand, size, Math.round(between(3, 6)), 0, Math.PI * 2, 1.1, 1.7);
      drips(paths, rand, size, Math.round(between(3, 5)), 1.2, 2.6);
      break;

    case 'double': {
      // Two blobs that landed side by side, one bigger than the other.
      const gap = size * between(0.75, 1.05);
      const [ox, oy] = [Math.cos(tilt) * gap, Math.sin(tilt) * gap];
      paths.push(blob(rand, -ox * 0.4, -oy * 0.4, size * 0.72, 1.1, tilt, lumpy));
      paths.push(blob(rand, ox * 0.6, oy * 0.6, size * between(0.38, 0.5), 1, tilt, lumpy));
      streaks(paths, rand, size, Math.round(between(2, 4)), 0, Math.PI * 2);
      droplets(paths, rand, size, Math.round(between(6, 11)), 0, Math.PI * 2, 1.1, 2.1);
      if (rand() < 0.6) drips(paths, rand, size * 0.8, 1, 0.6, 1.3);
      break;
    }
  }
  return paths;
}

/**
 * A rounded, lumpy blob. Two slow waves around the edge make it bulge
 * unevenly; `stretch` > 1 elongates it along `angle`, and `taper` makes it
 * a teardrop (fat at the front, thin at the back).
 */
function blob(
  rand: Rand,
  cx: number,
  cy: number,
  r: number,
  stretch: number,
  angle: number,
  lumpy: number,
  taper = 0,
): string {
  const count = 28;
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const [ca, sa] = [Math.cos(angle), Math.sin(angle)];
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const wobble = lumpy * (0.1 * Math.sin(t * 3 + p1) + 0.06 * Math.sin(t * 5 + p2));
    const rr = r * (1 + wobble + (rand() - 0.5) * 0.08) * (1 + taper * Math.cos(t));
    const x = Math.cos(t) * rr * stretch;
    const y = Math.sin(t) * rr;
    points.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
  }
  return smoothLoop(points);
}

/** Thin tapered runs of paint flung out within a cone, each ending in a bead. */
function streaks(
  paths: string[],
  rand: Rand,
  size: number,
  count: number,
  dir: number,
  spread: number,
): void {
  for (let i = 0; i < count; i++) {
    const angle =
      spread >= Math.PI * 2
        ? (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.8
        : dir + (rand() - 0.5) * spread;
    const start = size * 0.6;
    const end = size * (1.1 + rand() * 0.6);
    const half = size * (0.05 + rand() * 0.06);
    const [cx, cy] = [Math.cos(angle), Math.sin(angle)];
    const [nx, ny] = [-cy, cx];
    const mid = (start + end) * 0.5;
    paths.push(
      `M${f(cx * start + nx * half)} ${f(cy * start + ny * half)}` +
        `Q${f(cx * mid + nx * half * 0.35)} ${f(cy * mid + ny * half * 0.35)} ${f(cx * end)} ${f(cy * end)}` +
        `Q${f(cx * mid - nx * half * 0.35)} ${f(cy * mid - ny * half * 0.35)} ${f(cx * start - nx * half)} ${f(cy * start - ny * half)}Z`,
    );
    paths.push(circle(cx * (end + size * 0.05), cy * (end + size * 0.05), half * 0.9));
  }
}

/** Droplets within a cone, the smallest ones furthest away. */
function droplets(
  paths: string[],
  rand: Rand,
  size: number,
  count: number,
  dir: number,
  spread: number,
  near: number,
  far: number,
  scale = 1,
): void {
  for (let i = 0; i < count; i++) {
    const angle = spread >= Math.PI * 2 ? rand() * Math.PI * 2 : dir + (rand() - 0.5) * spread;
    const t = rand();
    const dist = size * (near + t * (far - near));
    const r = size * scale * (0.13 - t * 0.09) * (0.6 + rand() * 0.8);
    paths.push(circle(Math.cos(angle) * dist, Math.sin(angle) * dist, Math.max(r, 0.6)));
  }
}

/** Paint running straight down from the lower half of the blob. */
function drips(
  paths: string[],
  rand: Rand,
  size: number,
  count: number,
  min: number,
  max: number,
): void {
  for (let i = 0; i < count; i++) {
    const x = size * (count === 1 ? rand() - 0.5 : -0.55 + (1.1 * (i + rand() * 0.6)) / count);
    const w = size * (0.09 + rand() * 0.09);
    const top = size * 0.35;
    const bottom = top + size * (min + rand() * (max - min));
    const h = w / 2;
    paths.push(
      `M${f(x - h)} ${f(top)}V${f(bottom)}A${f(h)} ${f(h)} 0 0 0 ${f(x + h)} ${f(bottom)}V${f(top)}Z`,
    );
    paths.push(circle(x, bottom, w * 0.75));
  }
}

/** A closed Catmull-Rom curve through `pts`, written as cubic Béziers. */
function smoothLoop(pts: [number, number][]): string {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

function circle(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;
}

const f = (n: number) => n.toFixed(1);

/** Small fast seeded PRNG (returns 0 ≤ n < 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
