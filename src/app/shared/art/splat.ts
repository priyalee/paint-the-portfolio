/**
 * Procedural paint splats. The same seed always produces the same shape, so
 * only the seed and size are stored, not the geometry.
 *
 * A splat is a lumpy blob with a few long tendrils, loose droplets around it
 * and one or two drips running down the wall. Every part is returned as its
 * own path (centred on 0,0), so overlapping parts never cut holes in each other.
 */
export function splatPaths(seed: number, size: number): string[] {
  const rand = mulberry32(seed);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const paths: string[] = [];

  // Blob: points around a circle, a few pushed far out as tendrils.
  const count = Math.round(between(16, 24));
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + between(-0.12, 0.12);
    const spike = rand() < 0.22;
    const r = size * (spike ? between(1.25, 1.75) : between(0.72, 1.02));
    points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  paths.push(smoothLoop(points));

  // Droplets flung outwards.
  const drops = Math.round(between(4, 9));
  for (let i = 0; i < drops; i++) {
    const angle = between(0, Math.PI * 2);
    const dist = size * between(1.3, 2.2);
    paths.push(circle(Math.cos(angle) * dist, Math.sin(angle) * dist, size * between(0.05, 0.15)));
  }

  // Drips: paint running down from the lower half of the blob.
  const drips = rand() < 0.35 ? 2 : 1;
  for (let i = 0; i < drips; i++) {
    const x = size * between(-0.5, 0.5);
    const w = size * between(0.1, 0.18);
    const top = size * 0.4;
    const bottom = top + size * between(0.6, 1.5);
    const h = w / 2;
    paths.push(
      `M${f(x - h)} ${f(top)}V${f(bottom)}A${f(h)} ${f(h)} 0 0 0 ${f(x + h)} ${f(bottom)}V${f(top)}Z`,
    );
    paths.push(circle(x, bottom, w * 0.75));
  }
  return paths;
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
