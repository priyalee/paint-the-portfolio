/**
 * Line art used across the site. Every shape is a closed path so fills never
 * leak. `slot` is the palette pigment shown in Colour mode (null = paper,
 * 'line' = stroke-only decoration that can't be painted).
 */
export interface ArtShape {
  id: string;
  label: string;
  d: string;
  slot: number | null | 'line';
}

export interface Artwork {
  id: string;
  title: string;
  viewBox: string;
  shapes: ArtShape[];
}

function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
}

// ---------------------------------------------------------------- landscape

export const LANDSCAPE: Artwork = {
  id: 'hills',
  title: 'Rolling Hills',
  viewBox: '0 0 800 600',
  shapes: [
    { id: 'sky', label: 'Sky', d: 'M0 0H800V600H0Z', slot: 3 },
    { id: 'sun', label: 'Sun', d: circle(590, 170, 78), slot: 1 },
    { id: 'sun-core', label: 'Sun core', d: circle(590, 170, 40), slot: 0 },
    {
      id: 'cloud-1',
      label: 'Cloud',
      d: 'M110 200a38 38 0 0 1 52-46a52 52 0 0 1 96 6a34 34 0 0 1 12 66H122a32 32 0 0 1-12-26Z',
      slot: null,
    },
    {
      id: 'cloud-2',
      label: 'Small cloud',
      d: 'M400 110a26 26 0 0 1 38-30a36 36 0 0 1 66 6a24 24 0 0 1 6 44H410a22 22 0 0 1-10-20Z',
      slot: null,
    },
    {
      id: 'far-hill',
      label: 'Far hill',
      d: 'M0 360C120 290 240 300 360 340C480 380 600 290 800 320V600H0Z',
      slot: 4,
    },
    {
      id: 'mid-hill',
      label: 'Middle hill',
      d: 'M0 440C150 370 290 380 420 420C560 465 680 400 800 405V600H0Z',
      slot: 5,
    },
    { id: 'trunk-1', label: 'Tree trunk', d: 'M171 372h14v52h-14Z', slot: 0 },
    { id: 'crown-1', label: 'Round tree', d: circle(178, 340, 40), slot: 4 },
    { id: 'trunk-2', label: 'Pine trunk', d: 'M641 372h12v40h-12Z', slot: 0 },
    { id: 'crown-2', label: 'Pine tree', d: 'M647 286L694 378H600Z', slot: 2 },
    {
      id: 'front-hill',
      label: 'Front hill',
      d: 'M0 505C150 465 260 475 400 512C540 550 660 500 800 492V600H0Z',
      slot: 2,
    },
    {
      id: 'river',
      label: 'River',
      d: 'M372 600C392 566 334 548 356 520C372 500 418 492 408 470L428 468C446 498 404 514 398 530C386 556 462 572 452 600Z',
      slot: 3,
    },
    { id: 'bird-1', label: 'Bird', d: 'M300 130q15-16 30 0q15-16 30 0', slot: 'line' },
    { id: 'bird-2', label: 'Bird', d: 'M350 90q10-11 20 0q10-11 20 0', slot: 'line' },
  ],
};

// ---------------------------------------------------------------- portrait

export const PORTRAIT: Artwork = {
  id: 'portrait',
  title: 'Portrait',
  viewBox: '0 0 400 440',
  shapes: [
    { id: 'backdrop', label: 'Backdrop circle', d: circle(200, 215, 180), slot: 3 },
    {
      id: 'torso',
      label: 'Hoodie',
      d: 'M56 440C64 352 124 316 200 316C276 316 336 352 344 440Z',
      slot: 4,
    },
    { id: 'pocket', label: 'Hoodie pocket', d: 'M146 440L158 398H242L254 440Z', slot: 4 },
    {
      id: 'hood',
      label: 'Hood',
      d: 'M138 326C140 300 166 288 200 288C234 288 260 300 262 326C246 346 154 346 138 326Z',
      slot: 4,
    },
    // Headphones resting around the neck: the band runs behind the neck.
    {
      id: 'band',
      label: 'Headphone band',
      d: 'M150 324C150 286 172 268 200 268C228 268 250 286 250 324H238C238 294 222 280 200 280C178 280 162 294 162 324Z',
      slot: 2,
    },
    { id: 'neck', label: 'Neck', d: 'M180 268h40v44q-20 14-40 0Z', slot: 5 },
    {
      id: 'cup-l',
      label: 'Left ear cup',
      d: 'M142 318a16 16 0 0 1 32 0v10a16 16 0 0 1-32 0Z',
      slot: 0,
    },
    {
      id: 'cup-r',
      label: 'Right ear cup',
      d: 'M226 318a16 16 0 0 1 32 0v10a16 16 0 0 1-32 0Z',
      slot: 0,
    },
    { id: 'string-l', label: 'Drawstring', d: 'M188 340v34', slot: 'line' },
    { id: 'string-r', label: 'Drawstring', d: 'M212 340v34', slot: 'line' },
    // Long, open hair falling over the shoulders.
    {
      id: 'lock-l',
      label: 'Hair (left)',
      d: 'M128 190C114 252 120 330 106 406C122 414 142 410 154 400C150 340 146 278 152 234Z',
      slot: 2,
    },
    {
      id: 'lock-r',
      label: 'Hair (right)',
      d: 'M272 190C286 252 280 330 294 406C278 414 258 410 246 400C250 340 254 278 248 234Z',
      slot: 2,
    },
    {
      id: 'head',
      label: 'Face',
      d: 'M200 124C246 124 272 160 272 204C272 252 240 284 200 284C160 284 128 252 128 204C128 160 154 124 200 124Z',
      slot: 5,
    },
    {
      id: 'hair',
      label: 'Hair (fringe)',
      d: 'M126 214C116 140 156 112 202 112C250 112 286 142 276 214C266 178 248 156 222 148C204 166 168 182 126 214Z',
      slot: 2,
    },
    { id: 'earring-l', label: 'Left earring', d: circle(134, 250, 9), slot: 1 },
    { id: 'earring-r', label: 'Right earring', d: circle(266, 250, 9), slot: 1 },
    { id: 'eye-l', label: 'Left eye', d: 'M164 212q11-9 22 0', slot: 'line' },
    { id: 'eye-r', label: 'Right eye', d: 'M214 212q11-9 22 0', slot: 'line' },
    { id: 'smile', label: 'Smile', d: 'M182 246q18 14 36 0', slot: 'line' },
    { id: 'pencil', label: 'Pencil', d: 'M298 126L338 86L354 102L314 142Z', slot: 1 },
    { id: 'pencil-tip', label: 'Pencil tip', d: 'M298 126L288 152L314 142Z', slot: null },
    {
      id: 'drop',
      label: 'Paint drop',
      d: 'M84 74c12 16 18 25 18 34a18 18 0 0 1-36 0c0-9 6-18 18-34Z',
      slot: 1,
    },
  ],
};

// ---------------------------------------------------------------- envelope

/**
 * A vintage airmail envelope (front): diagonal airmail stripes round the
 * edge (two alternating sets, so one click paints every other stripe), a
 * perforated stamp with a little landscape, a postmark with cancellation
 * waves, an "air mail" label with a plane, address lines and a wax seal.
 */
export const ENVELOPE: Artwork = envelope();

function envelope(): Artwork {
  const [x0, y0, x1, y1] = [10, 20, 350, 232];
  const band = 14;
  return {
    id: 'envelope',
    title: 'Airmail envelope',
    viewBox: '0 0 360 250',
    shapes: [
      {
        id: 'body',
        label: 'Envelope',
        d: rect(x0 + band, y0 + band, x1 - band, y1 - band),
        slot: null,
      },
      ...airmailStripes(x0, y0, x1, y1, band),
      { id: 'edge', label: 'Edge', d: rect(x0, y0, x1, y1), slot: 'line' },
      {
        id: 'edge-in',
        label: 'Inner edge',
        d: rect(x0 + band, y0 + band, x1 - band, y1 - band),
        slot: 'line',
      },

      // Air mail label: a plane and two lines of "lettering".
      {
        id: 'label',
        label: 'Air mail label',
        d: 'M40 48h86a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4h-86a4 4 0 0 1-4-4v-20a4 4 0 0 1 4-4Z',
        slot: 4,
      },
      {
        id: 'plane',
        label: 'Plane',
        d: 'M44 60.5H57L51 52H55L64 60.5H69Q72 62 69 63.5H64L55 72H51L57 63.5H44L42 67H40L41.5 62L40 57H42Z',
        slot: 5,
      },
      { id: 'label-text', label: 'Lettering', d: 'M78 57H120M78 66H112', slot: 'line' },

      // Stamp: perforated edge, framed picture of a sun over hills.
      { id: 'stamp', label: 'Stamp', d: perforated(266, 44, 58, 70, 3), slot: 2 },
      { id: 'stamp-picture', label: 'Stamp picture', d: rect(273, 51, 317, 107), slot: null },
      { id: 'stamp-sun', label: 'Stamp sun', d: circle(306, 63, 6), slot: 0 },
      {
        id: 'stamp-hills',
        label: 'Stamp mountains',
        d: 'M273 107V97L285 74L293 87L300 79L317 100V107Z',
        slot: 3,
      },

      // Postmark and wavy cancellation lines (decoration only).
      {
        id: 'postmark',
        label: 'Postmark',
        d: `${circle(252, 104, 22)}${circle(252, 104, 16)}`,
        slot: 'line',
      },
      {
        id: 'cancel',
        label: 'Cancellation',
        d: 'M164 94q8 -6 16 0t16 0t16 0M164 104q8 -6 16 0t16 0t16 0M164 114q8 -6 16 0t16 0t16 0',
        slot: 'line',
      },

      // Address lines.
      { id: 'address', label: 'Address', d: 'M150 152H318M150 174H318M150 196H286', slot: 'line' },

      // Wax seal with a heart.
      { id: 'seal', label: 'Wax seal', d: scalloped(76, 178, 28, 16), slot: 0 },
      { id: 'seal-ring', label: 'Seal rim', d: circle(76, 178, 20), slot: 'line' },
      {
        id: 'heart',
        label: 'Heart',
        d: 'M76 190C63 181 61 166 76 171C91 166 89 181 76 190Z',
        slot: 1,
      },
    ],
  };
}

function rect(xa: number, ya: number, xb: number, yb: number): string {
  return `M${xa} ${ya}H${xb}V${yb}H${xa}Z`;
}

/**
 * The airmail border as two shapes: every other diagonal stripe in one,
 * the rest in the other. Each stripe is a slab of the border band cut at 45°.
 */
function airmailStripes(x0: number, y0: number, x1: number, y1: number, band: number): ArtShape[] {
  type P = [number, number];
  const parts: [number, number, number, number][] = [
    [x0, y0, x1, y0 + band],
    [x0, y1 - band, x1, y1],
    [x0, y0 + band, x0 + band, y1 - band],
    [x1 - band, y0 + band, x1, y1 - band],
  ];
  const half = 24;
  const sets = ['', ''];
  const clip = (poly: P[], keep: (p: P) => number): P[] => {
    const out: P[] = [];
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length];
      const [fa, fb] = [keep(a), keep(b)];
      if (fa >= 0) out.push(a);
      if (fa >= 0 !== fb >= 0) {
        const t = fa / (fa - fb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    });
    return out;
  };
  for (let k = Math.floor((x0 + y0) / half); k * half < x1 + y1; k++) {
    const [lo, hi] = [k * half, (k + 1) * half];
    for (const [ax, ay, bx, by] of parts) {
      let poly: P[] = [
        [ax, ay],
        [bx, ay],
        [bx, by],
        [ax, by],
      ];
      poly = clip(poly, ([x, y]) => x + y - lo);
      poly = clip(poly, ([x, y]) => hi - (x + y));
      if (poly.length < 3) continue;
      const area =
        Math.abs(
          poly.reduce((sum, [x, y], i) => {
            const [nx, ny] = poly[(i + 1) % poly.length];
            return sum + x * ny - nx * y;
          }, 0),
        ) / 2;
      if (area < 1) continue;
      sets[((k % 2) + 2) % 2] +=
        `M${poly.map(([x, y]) => `${+x.toFixed(2)} ${+y.toFixed(2)}`).join('L')}Z`;
    }
  }
  return [
    { id: 'stripes-a', label: 'Airmail stripes', d: sets[0], slot: 0 },
    { id: 'stripes-b', label: 'Airmail stripes (in between)', d: sets[1], slot: 5 },
  ];
}

/** A stamp outline with round perforation bites along every edge. */
function perforated(x: number, y: number, w: number, h: number, r: number): string {
  const n = (len: number) => Math.max(2, Math.round(len / (r * 3.2)));
  const edge = (fx: number, fy: number, dx: number, dy: number, len: number) => {
    const count = n(len);
    const step = len / count;
    let d = '';
    for (let i = 0; i < count; i++) {
      const mid = (i + 0.5) * step;
      const [ax, ay] = [fx + dx * (mid - r), fy + dy * (mid - r)];
      const [bx, by] = [fx + dx * (mid + r), fy + dy * (mid + r)];
      d += `L${+ax.toFixed(2)} ${+ay.toFixed(2)}A${r} ${r} 0 0 0 ${+bx.toFixed(2)} ${+by.toFixed(2)}`;
    }
    return d + `L${+(fx + dx * len).toFixed(2)} ${+(fy + dy * len).toFixed(2)}`;
  };
  return (
    `M${x} ${y}` +
    edge(x, y, 1, 0, w) +
    edge(x + w, y, 0, 1, h) +
    edge(x + w, y + h, -1, 0, w) +
    edge(x, y + h, 0, -1, h) +
    'Z'
  );
}

/** A wax-seal blob: a circle with soft scalloped bumps. */
function scalloped(cx: number, cy: number, r: number, bumps: number): string {
  const pts: string[] = [];
  const steps = bumps * 6;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = r + 2.4 * Math.cos(a * bumps);
    pts.push(`${+(cx + Math.cos(a) * rr).toFixed(2)} ${+(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

// ------------------------------------------------------------ studio pages

function mandala(): Artwork {
  const c = 300;
  const rings = [0, 46, 96, 146, 196, 246, 288];
  const sectors = [1, 8, 12, 16, 24, 32];
  const shapes: ArtShape[] = [];
  const pt = (r: number, a: number) =>
    `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;

  sectors.forEach((n, ring) => {
    const r0 = rings[ring];
    const r1 = rings[ring + 1];
    if (n === 1) {
      shapes.push({ id: `r0`, label: 'Centre', d: circle(c, c, r1), slot: 1 });
      return;
    }
    const offset = ring % 2 ? Math.PI / n : 0;
    for (let k = 0; k < n; k++) {
      const a0 = offset + (k / n) * Math.PI * 2;
      const a1 = offset + ((k + 1) / n) * Math.PI * 2;
      const d = `M${pt(r1, a0)}A${r1} ${r1} 0 0 1 ${pt(r1, a1)}L${pt(r0, a1)}A${r0} ${r0} 0 0 0 ${pt(r0, a0)}Z`;
      shapes.push({
        id: `r${ring}-${k}`,
        label: `Ring ${ring} petal ${k + 1}`,
        d,
        slot: (ring + (k % 2) * 3) % 6,
      });
    }
  });
  return { id: 'mandala', title: 'Mandala', viewBox: '0 0 600 600', shapes };
}

function mosaic(): Artwork {
  const cols = 8;
  const rows = 6;
  const s = 75;
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const shapes: ArtShape[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const x0 = x * s;
      const y0 = y * s;
      const x1 = x0 + s;
      const y1 = y0 + s;
      const tris =
        rand() > 0.5
          ? [`M${x0} ${y0}L${x1} ${y0}L${x0} ${y1}Z`, `M${x1} ${y0}L${x1} ${y1}L${x0} ${y1}Z`]
          : [`M${x0} ${y0}L${x1} ${y0}L${x1} ${y1}Z`, `M${x0} ${y0}L${x1} ${y1}L${x0} ${y1}Z`];
      tris.forEach((d, t) =>
        shapes.push({
          id: `t${x}-${y}-${t}`,
          label: `Tile ${y + 1}·${x + 1}`,
          d,
          slot: (x + y * 2 + t * 3) % 6,
        }),
      );
    }
  }
  return { id: 'mosaic', title: 'Triangle Mosaic', viewBox: '0 0 600 450', shapes };
}

export const STUDIO_ART: Artwork[] = [mandala(), mosaic(), LANDSCAPE];
