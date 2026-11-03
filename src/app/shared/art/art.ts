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
      label: 'Sweater',
      d: 'M64 440C74 344 136 306 200 306C264 306 326 344 336 440Z',
      slot: 0,
    },
    { id: 'collar', label: 'Collar', d: 'M168 309L200 356L232 309Z', slot: null },
    { id: 'neck', label: 'Neck', d: 'M178 262h44v46q-22 14-44 0Z', slot: 5 },
    { id: 'head', label: 'Face', d: circle(200, 200, 78), slot: 5 },
    {
      id: 'hair',
      label: 'Hair',
      d: 'M120 206C112 132 158 104 202 104C254 104 290 138 282 206C266 168 238 148 202 148C170 148 140 166 120 206Z',
      slot: 2,
    },
    { id: 'lens-l', label: 'Left lens', d: circle(170, 206, 20), slot: null },
    { id: 'lens-r', label: 'Right lens', d: circle(230, 206, 20), slot: null },
    { id: 'bridge', label: 'Glasses bridge', d: 'M190 204q10-6 20 0', slot: 'line' },
    { id: 'smile', label: 'Smile', d: 'M182 246q18 14 36 0', slot: 'line' },
    { id: 'pencil', label: 'Pencil', d: 'M298 126L338 86L354 102L314 142Z', slot: 1 },
    { id: 'pencil-tip', label: 'Pencil tip', d: 'M298 126L288 152L314 142Z', slot: null },
    { id: 'drop', label: 'Paint drop', d: 'M84 74c12 16 18 25 18 34a18 18 0 0 1-36 0c0-9 6-18 18-34Z', slot: 1 },
  ],
};

// ---------------------------------------------------------------- envelope

export const ENVELOPE: Artwork = {
  id: 'envelope',
  title: 'Envelope',
  viewBox: '0 0 320 230',
  shapes: [
    { id: 'letter', label: 'Letter', d: 'M52 12h216v130h-216Z', slot: null },
    {
      id: 'heart',
      label: 'Heart',
      d: 'M160 84C136 66 134 40 160 50C186 40 184 66 160 84Z',
      slot: 0,
    },
    { id: 'body', label: 'Envelope back', d: 'M20 60h280v160h-280Z', slot: 2 },
    { id: 'flap-l', label: 'Left flap', d: 'M20 60L150 150L20 220Z', slot: 3 },
    { id: 'flap-r', label: 'Right flap', d: 'M300 60L170 150L300 220Z', slot: 3 },
    { id: 'pocket', label: 'Front pocket', d: 'M20 220L160 128L300 220Z', slot: 4 },
  ],
};

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
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
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
