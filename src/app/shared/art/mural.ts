import { ArtShape, Artwork } from './art';

/**
 * The community mural: a city at dusk drawn as closed line-art regions.
 * Generated from a fixed seed, so every visitor sees the exact same drawing
 * and region ids stay stable (claims are stored by region id).
 */
export const MURAL: Artwork = buildCity();

function buildCity(): Artwork {
  const W = 1200;
  const GROUND = 456;
  let seed = 42;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const between = (a: number, b: number) => Math.round(a + rand() * (b - a));
  const shapes: ArtShape[] = [];

  // --- sky in three wavy bands
  shapes.push(
    { id: 'sky-1', label: 'Upper sky', slot: 2, d: `M0 0H${W}V96C1000 128 820 72 600 104S200 84 0 120Z` },
    {
      id: 'sky-2',
      label: 'Middle sky',
      slot: 5,
      d: `M0 120C200 84 400 136 600 104S1000 128 ${W} 96V196C1000 228 800 172 600 204S200 184 0 220Z`,
    },
    {
      id: 'sky-3',
      label: 'Lower sky',
      slot: 1,
      d: `M0 220C200 184 400 236 600 204S1000 228 ${W} 196V${GROUND}H0Z`,
    },
  );

  // --- sun with a ring
  shapes.push(
    { id: 'sun-ring', label: 'Sun halo', slot: 1, d: circle(980, 150, 74) },
    { id: 'sun', label: 'Sun', slot: 0, d: circle(980, 150, 46) },
  );

  // --- clouds
  [
    [90, 80, 1],
    [430, 50, 0.8],
    [700, 130, 0.9],
  ].forEach(([x, y, s], i) =>
    shapes.push({ id: `cloud-${i + 1}`, label: `Cloud ${i + 1}`, slot: null, d: cloud(x, y, s) }),
  );

  // --- distant hills
  shapes.push(
    {
      id: 'hill-back',
      label: 'Far hills',
      slot: 4,
      d: `M0 300C160 240 300 260 440 290S760 230 900 270S1120 250 ${W} 280V${GROUND}H0Z`,
    },
  );

  // --- buildings with windows, doors and some pointed roofs
  let x = 16;
  let b = 0;
  while (x < W - 70) {
    const w = between(70, 116);
    if (x + w > W - 16) break;
    const h = between(130, 290);
    const top = GROUND - h;
    b++;
    const name = `Building ${b}`;
    shapes.push({
      id: `b${b}`,
      label: `${name} wall`,
      slot: (b * 2) % 6,
      d: `M${x} ${top}H${x + w}V${GROUND}H${x}Z`,
    });
    if (rand() > 0.55) {
      shapes.push({
        id: `b${b}-roof`,
        label: `${name} roof`,
        slot: (b + 3) % 6,
        d: `M${x - 4} ${top}L${x + w / 2} ${top - between(28, 50)}L${x + w + 4} ${top}Z`,
      });
    }
    // window grid
    const cols = Math.max(1, Math.floor((w - 16) / 30));
    const rows = Math.max(1, Math.floor((h - 70) / 40));
    const gx = (w - cols * 30 + 10) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = x + gx + c * 30;
        const wy = top + 18 + r * 40;
        shapes.push({
          id: `b${b}-w${r}-${c}`,
          label: `${name}, window ${r * cols + c + 1}`,
          slot: rand() > 0.5 ? 1 : null,
          d: `M${wx} ${wy}h20v24h-20Z`,
        });
      }
    }
    // door
    const dx = x + w / 2 - 11;
    shapes.push({
      id: `b${b}-door`,
      label: `${name} door`,
      slot: 0,
      d: `M${dx} ${GROUND}V${GROUND - 34}a11 11 0 0 1 22 0V${GROUND}Z`,
    });
    x += w + between(6, 18);
  }

  // --- street + kerb
  shapes.push(
    { id: 'kerb', label: 'Pavement', slot: null, d: `M0 ${GROUND}H${W}V${GROUND + 16}H0Z` },
    { id: 'street', label: 'Street', slot: 2, d: `M0 ${GROUND + 16}H${W}V520H0Z` },
  );
  for (let i = 0; i < 8; i++) {
    const sx = 40 + i * 150;
    shapes.push({
      id: `stripe-${i}`,
      label: `Road marking ${i + 1}`,
      slot: null,
      d: `M${sx} 490h70v8h-70Z`,
    });
  }

  return { id: 'mural', title: 'City at Dusk', viewBox: `0 0 ${W} 520`, shapes };
}

function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
}

function cloud(x: number, y: number, s: number): string {
  const k = (n: number) => +(n * s).toFixed(1);
  return `M${x} ${y + k(40)}a${k(30)} ${k(30)} 0 0 1 ${k(40)}-${k(34)}a${k(42)} ${k(42)} 0 0 1 ${k(78)} ${k(4)}a${k(28)} ${k(28)} 0 0 1 ${k(12)} ${k(54)}H${x + k(10)}a${k(24)} ${k(24)} 0 0 1 -${k(10)}-${k(24)}Z`;
}
