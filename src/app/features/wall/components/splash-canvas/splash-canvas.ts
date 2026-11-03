import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SPLASH_WALL, Splash } from '@core/splash-store';
import { splatPaths } from '@shared/art/splat';
import { clampTip } from '../mural-canvas/mural-canvas';

/** A splash that has been thrown but not signed yet. */
export interface PendingSplash {
  x: number;
  y: number;
  seed: number;
  size: number;
}

interface Tip {
  x: number;
  y: number;
  title: string;
  detail: string;
}

let uid = 0;

/**
 * A brick wall visitors throw paint at. Signed splashes show their painter on
 * hover; clicking an open spot throws a new (pending) splash there.
 */
@Component({
  selector: 'app-splash-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame" (pointerleave)="onLeave($event)">
      <svg
        #svg
        [attr.viewBox]="viewBox"
        [class.locked]="locked()"
        role="img"
        [attr.aria-label]="'Splash wall with ' + splashes().length + ' splashes'"
        (click)="onWall($event)"
        (pointermove)="onMove($event)"
        (pointerdown)="onMove($event)"
      >
        <defs>
          <pattern [attr.id]="brickId" width="120" height="60" patternUnits="userSpaceOnUse">
            <path class="mortar" d="M0 1H120M0 30H120M1 0V30M61 0V30M31 30V60M91 30V60" />
          </pattern>
        </defs>
        <rect class="paper" [attr.width]="wall.width" [attr.height]="wall.height" />
        <rect [attr.width]="wall.width" [attr.height]="wall.height" [attr.fill]="'url(#' + brickId + ')'" />

        @for (s of shapes(); track s.id) {
          <g [attr.transform]="'translate(' + s.x + ' ' + s.y + ')'" [attr.data-sid]="s.id">
            <g class="ink" [style.fill]="s.color">
              @for (d of s.paths; track $index) {
                <path [attr.d]="d" />
              }
            </g>
          </g>
        }

        @if (pendingShape(); as p) {
          <g [attr.transform]="'translate(' + p.x + ' ' + p.y + ')'">
            <g class="ink pending" [style.fill]="pendingColor()">
              @for (d of p.paths; track $index) {
                <path [attr.d]="d" />
              }
            </g>
          </g>
        }
      </svg>

      @if (tip(); as t) {
        <div class="tip" [style.left.px]="t.x" [style.top.px]="t.y" aria-hidden="true">
          <strong>{{ t.title }}</strong>
          <span>{{ t.detail }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .frame {
      position: relative;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      border: 2px solid var(--ink);
      border-radius: 8px;
      cursor: crosshair;
      touch-action: manipulation;
    }
    svg.locked {
      cursor: default;
    }
    .paper {
      fill: var(--paper);
    }
    .mortar {
      fill: none;
      stroke: var(--line);
      stroke-width: 2;
    }
    .ink {
      stroke: none;
      transform-box: fill-box;
      transform-origin: center;
      animation: splat 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both;
    }
    .pending {
      opacity: 0.85;
    }
    @keyframes splat {
      from {
        transform: scale(0.1);
        opacity: 0;
      }
      60% {
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .ink {
        animation: none;
      }
    }
    .tip {
      position: absolute;
      z-index: 2;
      display: grid;
      gap: 2px;
      padding: 8px 12px;
      transform: translate(-50%, calc(-100% - 14px));
      background: var(--ink);
      color: var(--paper);
      border-radius: 10px;
      font-size: 0.82rem;
      white-space: nowrap;
      pointer-events: none;
    }
    .tip span {
      opacity: 0.8;
    }
  `,
})
export class SplashCanvas {
  readonly splashes = input.required<Splash[]>();
  readonly pending = input<PendingSplash | null>(null);
  readonly pendingColor = input('var(--p0)');
  /** The visitor already signed a splash — no more throwing. */
  readonly locked = input(false);

  /** A point on the wall (in wall units) where the visitor threw paint. */
  readonly drop = output<{ x: number; y: number }>();

  protected readonly wall = SPLASH_WALL;
  protected readonly viewBox = `0 0 ${SPLASH_WALL.width} ${SPLASH_WALL.height}`;
  protected readonly brickId = `bricks-${++uid}`;
  protected readonly tip = signal<Tip | null>(null);
  private tipTimer?: ReturnType<typeof setTimeout>;

  protected readonly shapes = computed(() =>
    this.splashes().map((s) => ({ ...s, paths: splatPaths(s.seed, s.size) })),
  );
  protected readonly pendingShape = computed(() => {
    const p = this.pending();
    return p ? { ...p, paths: splatPaths(p.seed, p.size) } : null;
  });
  private readonly byId = computed(() => new Map(this.splashes().map((s) => [s.id, s])));

  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  protected onWall(e: MouseEvent): void {
    if (this.locked()) return;
    const ctm = this.svg().nativeElement.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    this.drop.emit({ x: p.x, y: p.y });
  }

  protected onLeave(e: PointerEvent): void {
    // Touch fires pointerleave right after every tap; keep the tip until it times out.
    if (e.pointerType === 'mouse') this.tip.set(null);
  }

  protected onMove(e: PointerEvent): void {
    const hit = (e.target as Element).closest('[data-sid]');
    const splash = hit ? this.byId().get(hit.getAttribute('data-sid') ?? '') : undefined;
    if (!splash) {
      this.tip.set(null);
      return;
    }
    const rect = this.svg().nativeElement.getBoundingClientRect();
    if (e.pointerType !== 'mouse') {
      clearTimeout(this.tipTimer);
      this.tipTimer = setTimeout(() => this.tip.set(null), 3000);
    }
    const when = new Date(splash.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });
    this.tip.set({
      x: clampTip(e.clientX - rect.left, rect.width),
      y: e.clientY - rect.top,
      title: `Splashed by ${splash.name}`,
      detail: [splash.place, when].filter(Boolean).join(' · '),
    });
  }
}
