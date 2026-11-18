/**
 * Small line sketches drawn on top of each project's colour chip on the Work
 * page. They are decoration only: clicks pass through to the chip, so painting
 * fills the swatch around the sketch.
 *
 * Coordinates use the chip's 300 x 170 viewBox. The chip crops its edges on
 * narrow or very wide cards, so keep drawings inside x 60-240, y 18-152.
 */

export interface SketchLine {
  d: string;
  /** Stroke only (no paper fill). */
  line?: boolean;
}

export const PROJECT_SKETCHES = {
  canvas: 'Paintable page',
  store: 'Online store',
  voice: 'Voice app',
  chart: 'Dashboard or report',
  code: 'Laptop with code',
} as const;

export type ProjectSketch = keyof typeof PROJECT_SKETCHES;

/** Used when a project doesn't pick a sketch. */
export const DEFAULT_SKETCH: ProjectSketch = 'code';

export function isProjectSketch(v: unknown): v is ProjectSketch {
  return typeof v === 'string' && Object.hasOwn(PROJECT_SKETCHES, v);
}

function rr(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M${x + r} ${y}H${x + w - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h - r}` +
    `a${r} ${r} 0 0 1 ${-r} ${r}H${x + r}a${r} ${r} 0 0 1 ${-r} ${-r}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}Z`
  );
}

function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
}

/** A browser window: frame, title bar and three dots. */
function browser(x: number, y: number, w: number, h: number): SketchLine[] {
  return [
    { d: rr(x, y, w, h, 8) },
    { d: `M${x} ${y + 16}H${x + w}`, line: true },
    { d: circle(x + 10, y + 8, 2.5) },
    { d: circle(x + 19, y + 8, 2.5) },
    { d: circle(x + 28, y + 8, 2.5) },
  ];
}

export const SKETCH_ART: Record<ProjectSketch, SketchLine[]> = {
  // A browser window with a landscape, and a paintbrush leaning on it.
  canvas: [
    ...browser(66, 20, 150, 108),
    { d: circle(180, 60, 11) },
    { d: 'M66 110C90 90 112 96 134 106S180 94 216 102', line: true },
    { d: 'M66 122C96 108 128 116 154 120S196 114 216 118', line: true },
    { d: 'M86 68a9 9 0 0 1 14-7a12 12 0 0 1 22 3a7 7 0 0 1 0 13H90a7 7 0 0 1-4-9Z' },
    { d: 'M198 140L238 90L246 96L206 146Z' },
    { d: 'M192 133L200 123L214 134L206 144Z' },
    { d: 'M192 133C184 140 178 146 176 156C186 154 194 150 200 142Z' },
  ],
  // A shop page: banner, three product cards and a shopping bag.
  store: [
    ...browser(64, 20, 172, 116),
    { d: rr(74, 44, 152, 26, 4) },
    { d: 'M84 54H132M84 61H112', line: true },
    { d: rr(74, 78, 44, 50, 4) },
    { d: rr(128, 78, 44, 50, 4) },
    { d: rr(182, 78, 44, 50, 4) },
    { d: 'M80 114H104M80 120H96M134 114H158M134 120H150M188 114H212M188 120H204', line: true },
    { d: 'M190 114H234L230 150H194Z' },
    { d: 'M201 114V108a11 11 0 0 1 22 0V114', line: true },
  ],
  // A microphone with sound waves and a speech bubble.
  voice: [
    { d: rr(132, 36, 36, 62, 18) },
    { d: 'M120 78a30 30 0 0 0 60 0', line: true },
    { d: 'M150 108V128M134 130H166', line: true },
    { d: 'M104 54a40 40 0 0 0 0 48M90 44a56 56 0 0 0 0 68', line: true },
    { d: 'M196 54a40 40 0 0 1 0 48M210 44a56 56 0 0 1 0 68', line: true },
    {
      d: 'M184 22H232a8 8 0 0 1 8 8V48a8 8 0 0 1-8 8H206L196 66V56H184a8 8 0 0 1-8-8V30a8 8 0 0 1 8-8Z',
    },
    { d: circle(194, 39, 2.5) },
    { d: circle(208, 39, 2.5) },
    { d: circle(222, 39, 2.5) },
  ],
  // A report card with bars and a trend line.
  chart: [
    { d: rr(72, 24, 156, 120, 8) },
    { d: rr(90, 96, 20, 34, 2) },
    { d: rr(120, 76, 20, 54, 2) },
    { d: rr(150, 86, 20, 44, 2) },
    { d: rr(180, 56, 20, 74, 2) },
    { d: 'M84 132H216M88 44H136M88 52H118', line: true },
    { d: 'M94 82L130 62L160 72L196 40', line: true },
  ],
  // A laptop showing </>.
  code: [
    { d: rr(84, 28, 132, 88, 6) },
    { d: rr(94, 38, 112, 68, 3) },
    { d: 'M70 126L84 116H216L230 126V130a4 4 0 0 1-4 4H74a4 4 0 0 1-4-4Z' },
    { d: 'M128 60L116 72L128 84M172 60L184 72L172 84M156 56L144 88', line: true },
  ],
};
