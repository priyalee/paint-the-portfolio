import { Injectable, inject, signal } from '@angular/core';
import { PaintState, reducedMotion } from '@core/paint-state';

export interface Piece {
  dx: number;
  dy: number;
  rot: number;
  size: number;
  color: string;
  shape: 'drop' | 'dot' | 'strip';
  delay: number;
}

export interface Burst {
  id: number;
  x: number;
  y: number;
  pieces: Piece[];
}

export interface Toast {
  id: number;
  title: string;
  detail: string;
  grand: boolean;
}

export interface CelebrationRequest {
  title: string;
  detail: string;
  /** Burst origin; falls back to the viewport centre. */
  el?: Element | null;
  /** "Whole site painted" — bigger popup, bursts everywhere. */
  grand?: boolean;
}

let uid = 0;

/** Paint-splatter bursts + "painted!" popup when a block of the site is fully coloured. */
@Injectable({ providedIn: 'root' })
export class Celebration {
  private readonly paint = inject(PaintState);
  readonly bursts = signal<Burst[]>([]);
  readonly toast = signal<Toast | null>(null);

  private pending: CelebrationRequest[] = [];
  private toastTimer?: ReturnType<typeof setTimeout>;

  celebrate(req: CelebrationRequest): void {
    this.pending.push(req);
    // Several blocks can complete in the same tick (e.g. the last block + the
    // whole site): collect them and show one popup.
    if (this.pending.length === 1) queueMicrotask(() => this.flush());
  }

  dismiss(): void {
    clearTimeout(this.toastTimer);
    this.toast.set(null);
  }

  private flush(): void {
    const items = this.pending;
    this.pending = [];
    const grand = items.find((i) => i.grand);
    const shown = grand ?? items[items.length - 1];
    if (!shown) return;

    if (!reducedMotion()) {
      if (grand) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        [
          [0.5, 0.45],
          [0.2, 0.3],
          [0.8, 0.3],
          [0.25, 0.7],
          [0.75, 0.7],
        ].forEach(([fx, fy], i) => setTimeout(() => this.burst(w * fx, h * fy, 34), i * 220));
      } else {
        for (const item of items) {
          const { x, y } = originOf(item.el);
          this.burst(x, y, 26);
        }
      }
    }

    clearTimeout(this.toastTimer);
    this.toast.set({ id: ++uid, title: shown.title, detail: shown.detail, grand: !!grand });
    this.toastTimer = setTimeout(() => this.toast.set(null), grand ? 9000 : 5500);
  }

  private burst(x: number, y: number, count: number): void {
    const colors = this.paint.palette().colors.map((c) => c.hex);
    const shapes: Piece['shape'][] = ['drop', 'dot', 'drop', 'strip'];
    const pieces: Piece[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 170;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 40,
        rot: (Math.random() - 0.5) * 720,
        size: 10 + Math.random() * 14,
        color: colors[i % colors.length],
        shape: shapes[i % shapes.length],
        delay: Math.random() * 120,
      };
    });
    const burst: Burst = { id: ++uid, x, y, pieces };
    this.bursts.update((b) => [...b, burst]);
    setTimeout(() => this.bursts.update((b) => b.filter((x) => x.id !== burst.id)), 1600);
  }
}

function originOf(el?: Element | null): { x: number; y: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (el) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x > 0 && x < w && y > 0 && y < h) return { x, y };
  }
  return { x: w / 2, y: h / 2 };
}
