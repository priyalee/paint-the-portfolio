import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Celebration } from '@core/celebration';
import { PaintState } from '@core/paint-state';
import { THEMES } from '@core/palettes';
import { Postcard } from '@core/postcard';
import { loadImage, svgToImage } from '@core/snapshot';
import { ArtShape, Artwork } from '@shared/art/art';

/** One brush dab: a cluster of jittered circles, normalised to stage width. */
interface Stamp {
  blobs: [x: number, y: number, r: number][];
}

const BRUSH = 0.13; // radius as a fraction of stage width (bigger = chunkier brush)
const DONE_AT = 0.9; // share of the sketch brushed in that counts as "painted"

/**
 * Black-and-white line art with a hidden colour layer. Moving the cursor
 * (or dragging a finger) brushes colour in. Reports coverage and celebrates
 * when the sketch is fully painted.
 */
@Component({
  selector: 'app-brush-reveal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brush-reveal.html',
  styleUrl: './brush-reveal.scss',
})
export class BrushReveal {
  readonly art = input.required<Artwork>();

  private readonly state = inject(PaintState);
  private readonly celebration = inject(Celebration);

  /** Has the visitor brushed at all? */
  readonly touched = signal(false);
  /** 0-1 share of the sketch brushed into colour. */
  readonly coverage = signal(0);

  private readonly stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly mono = viewChild.required<ElementRef<SVGSVGElement>>('mono');

  private ctx: CanvasRenderingContext2D | null = null;
  private colorImg: HTMLImageElement | null = null;
  private stamps: Stamp[] = [];
  private last: { x: number; y: number } | null = null;
  private down = false;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private coverageTimer?: ReturnType<typeof setTimeout>;
  private celebrated = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Rebuild the hidden colour layer whenever art / palette / theme / mode changes.
    effect(() => {
      const art = this.art();
      const hexes = this.state.palette().colors.map((c) => c.hex);
      const theme = THEMES[this.state.theme()];
      this.state.mode();
      untracked(() => void this.buildColorLayer(art, hexes, theme));
    });

    afterNextRender(() => {
      this.ctx = this.canvas().nativeElement.getContext('2d');
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(this.stage().nativeElement);
      destroyRef.onDestroy(() => ro.disconnect());
      this.resize();
    });

    destroyRef.onDestroy(
      inject(Postcard).register({ id: 'hero', order: 0, snapshot: () => this.snapshot() }),
    );
  }

  /** Clears every brush stroke. */
  wash(): void {
    this.stamps = [];
    this.touched.set(false);
    this.coverage.set(0);
    this.celebrated = false;
    this.redraw();
  }

  // ------------------------------------------------------------ pointer

  protected onPointerDown(e: PointerEvent): void {
    this.down = true;
    this.last = null;
    this.brushTo(e);
  }

  protected onPointerMove(e: PointerEvent): void {
    if (e.pointerType === 'mouse' || this.down) this.brushTo(e);
  }

  protected onPointerUp(): void {
    this.down = false;
    this.last = null;
  }

  private brushTo(e: PointerEvent): void {
    if (!this.width) return;
    const rect = this.canvas().nativeElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.width;
    const y = (e.clientY - rect.top) / this.width; // normalised to width on purpose
    const from = this.last ?? { x, y };
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (BRUSH * 0.45)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const stamp = makeStamp(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
      this.stamps.push(stamp);
      this.drawStamp(stamp);
    }
    this.last = { x, y };
    if (!this.touched()) this.touched.set(true);
    clearTimeout(this.coverageTimer);
    this.coverageTimer = setTimeout(() => this.measureCoverage(), 250);
  }

  // ------------------------------------------------------------ drawing

  private resize(): void {
    const rect = this.stage().nativeElement.getBoundingClientRect();
    const canvas = this.canvas().nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    canvas.width = Math.round(rect.width * this.dpr);
    canvas.height = Math.round(rect.height * this.dpr);
    this.redraw();
  }

  private async buildColorLayer(
    art: Artwork,
    hexes: string[],
    theme: { paper: string; ink: string },
  ): Promise<void> {
    const [w, h] = art.viewBox.split(' ').slice(2).map(Number);
    const fillOf = (s: ArtShape) =>
      s.slot === 'line' ? 'none' : s.slot === null ? theme.paper : hexes[s.slot];
    const body = art.shapes
      .map(
        (s) =>
          `<path d="${s.d}" fill="${fillOf(s)}" stroke="${theme.ink}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`,
      )
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}">${body}</svg>`;
    try {
      this.colorImg = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      this.redraw();
    } catch {
      this.colorImg = null;
    }
  }

  private redraw(): void {
    const ctx = this.ctx;
    if (!ctx || !this.width) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (!this.colorImg) return;
    if (this.state.mode() === 'color') {
      ctx.drawImage(this.colorImg, 0, 0, this.width, this.height);
      return;
    }
    for (const s of this.stamps) this.drawStamp(s);
  }

  private drawStamp(stamp: Stamp): void {
    const ctx = this.ctx;
    if (!ctx || !this.colorImg || this.state.mode() === 'color') return;
    const w = this.width;
    ctx.save();
    ctx.beginPath();
    for (const [x, y, r] of stamp.blobs) {
      ctx.moveTo(x * w + r * w, y * w);
      ctx.arc(x * w, y * w, r * w, 0, Math.PI * 2);
    }
    ctx.clip();
    ctx.drawImage(this.colorImg, 0, 0, this.width, this.height);
    ctx.restore();
  }

  /** Samples the reveal canvas at low resolution to see how much is painted. */
  private measureCoverage(): void {
    if (this.state.mode() === 'color') return;
    const w = 48;
    const h = 36;
    const probe = document.createElement('canvas');
    probe.width = w;
    probe.height = h;
    const ctx = probe.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(this.canvas().nativeElement, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let filled = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) filled++;
    const ratio = filled / (w * h);
    this.coverage.set(ratio);
    if (ratio >= DONE_AT && !this.celebrated) {
      this.celebrated = true;
      this.celebration.celebrate({
        title: `${this.art().title} — painted!`,
        detail: 'You brushed the whole sketch into colour.',
        el: this.stage().nativeElement,
      });
    }
  }

  private async snapshot(): Promise<HTMLCanvasElement> {
    const out = document.createElement('canvas');
    const base = await svgToImage(this.mono().nativeElement, 2);
    out.width = base.naturalWidth;
    out.height = base.naturalHeight;
    const ctx = out.getContext('2d')!;
    ctx.drawImage(base, 0, 0);
    ctx.drawImage(this.canvas().nativeElement, 0, 0, out.width, out.height);
    return out;
  }
}

function makeStamp(x: number, y: number): Stamp {
  const blobs: Stamp['blobs'] = [[x, y, BRUSH * (0.8 + Math.random() * 0.3)]];
  for (let i = 0; i < 3; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = BRUSH * (0.4 + Math.random() * 0.5);
    blobs.push([x + Math.cos(a) * d, y + Math.sin(a) * d, BRUSH * (0.3 + Math.random() * 0.35)]);
  }
  return { blobs };
}
