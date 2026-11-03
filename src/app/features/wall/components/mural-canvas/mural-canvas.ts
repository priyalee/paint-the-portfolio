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
import { MuralClaim } from '@core/mural-store';
import { ArtShape, Artwork } from '@shared/art/art';
import { floodShape } from '@shared/paint/flood';

interface Tip {
  x: number;
  y: number;
  title: string;
  detail: string;
}

/**
 * The shared mural. Claimed regions show their painter's colour and a
 * "painted by" tooltip; free regions can be picked (one per visitor).
 */
@Component({
  selector: 'app-mural-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame" (pointerleave)="onLeave($event)">
      <svg #svg class="art" [attr.viewBox]="art().viewBox" role="group" [attr.aria-label]="art().title + ' community mural'">
        @for (s of art().shapes; track s.id) {
          @let claim = claims().get(s.id);
          <path
            [attr.d]="s.d"
            [class.claimed]="!!claim"
            [class.pending]="pending() === s.id"
            [class.free]="!claim && !locked()"
            [style.fill]="fillFor(s.id, claim)"
            [attr.tabindex]="!claim && !locked() ? 0 : null"
            [attr.role]="!claim && !locked() ? 'button' : null"
            [attr.aria-label]="ariaFor(s, claim)"
            (click)="onPick(s, $event)"
            (keydown.enter)="onPick(s)"
            (pointermove)="hover(s, claim, $event)"
            (pointerdown)="hover(s, claim, $event)"
          />
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
      --sw: 1.8;
      display: block;
      width: 100%;
      height: auto;
      border: 2px solid var(--ink);
      border-radius: 8px;
      overflow: hidden;
    }
    path {
      transition: fill 0.4s var(--ease), opacity 0.2s;
      outline: none;
    }
    path.free {
      cursor: pointer;
    }
    path.free:hover {
      opacity: 0.8;
    }
    path.free:focus-visible,
    path.pending {
      stroke: var(--accent);
      stroke-width: 4;
      stroke-dasharray: 6 5;
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
export class MuralCanvas {
  readonly art = input.required<Artwork>();
  /** regionId → claim */
  readonly claims = input.required<Map<string, MuralClaim>>();
  /** Region the visitor has picked but not signed yet. */
  readonly pending = input<string | null>(null);
  readonly pendingColor = input('var(--p0)');
  /** The visitor already signed — nothing else can be picked. */
  readonly locked = input(false);

  readonly pick = output<ArtShape>();

  protected readonly tip = signal<Tip | null>(null);
  private tipTimer?: ReturnType<typeof setTimeout>;
  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private readonly frameEl = computed(() => this.svg().nativeElement.parentElement!);

  protected fillFor(id: string, claim: MuralClaim | undefined): string {
    if (claim) return claim.color;
    if (this.pending() === id) return this.pendingColor();
    return 'var(--paper)';
  }

  protected ariaFor(s: ArtShape, claim: MuralClaim | undefined): string {
    if (claim) return `${s.label}, painted by ${claim.name}${claim.place ? ' from ' + claim.place : ''}`;
    return `${s.label}, not painted yet`;
  }

  protected onPick(s: ArtShape, event?: MouseEvent): void {
    if (this.locked() || this.claims().has(s.id) || this.pending() === s.id) return;
    const el = (event?.target ?? this.find(s.id)) as SVGGraphicsElement | null;
    if (!el) return;
    const point = event ? { x: event.clientX, y: event.clientY } : undefined;
    floodShape(el, this.pendingColor(), point, () => this.pick.emit(s));
  }

  protected onLeave(e: PointerEvent): void {
    // Touch fires pointerleave right after every tap; keep the tip until it times out.
    if (e.pointerType === 'mouse') this.tip.set(null);
  }

  protected hover(s: ArtShape, claim: MuralClaim | undefined, e: PointerEvent): void {
    const rect = this.frameEl().getBoundingClientRect();
    const x = clampTip(e.clientX - rect.left, rect.width);
    const y = e.clientY - rect.top;
    if (e.pointerType !== 'mouse') {
      clearTimeout(this.tipTimer);
      this.tipTimer = setTimeout(() => this.tip.set(null), 3000);
    }
    if (claim) {
      const when = new Date(claim.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });
      this.tip.set({
        x,
        y,
        title: `Painted by ${claim.name}`,
        detail: [claim.place, when].filter(Boolean).join(' · '),
      });
    } else if (!this.locked()) {
      this.tip.set({ x, y, title: s.label, detail: 'Free — click to paint it' });
    } else {
      this.tip.set(null);
    }
  }

  private find(id: string): Element | null {
    const i = this.art().shapes.findIndex((s) => s.id === id);
    return this.svg().nativeElement.querySelectorAll('path')[i] ?? null;
  }
}

/** Keeps the centred tooltip from running off a narrow (phone) frame. */
export function clampTip(x: number, width: number): number {
  const half = Math.min(110, width / 2);
  return Math.min(Math.max(x, half), width - half);
}
