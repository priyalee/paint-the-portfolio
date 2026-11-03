import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Celebration } from '@core/celebration';
import { Postcard } from '@core/postcard';
import { Icon } from '@shared/ui/icon';

/** Renders paint-splatter bursts and the "painted!" popup. */
@Component({
  selector: 'app-celebration-layer',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (b of celebration.bursts(); track b.id) {
      <div class="burst" [style.left.px]="b.x" [style.top.px]="b.y" aria-hidden="true">
        @for (p of b.pieces; track $index) {
          <span
            [class]="'piece ' + p.shape"
            [style.--dx.px]="p.dx"
            [style.--dy.px]="p.dy"
            [style.--rot.deg]="p.rot"
            [style.--size.px]="p.size"
            [style.--delay.ms]="p.delay"
            [style.background]="p.color"
          ></span>
        }
      </div>
    }

    <div class="toast-slot" aria-live="polite">
      @if (celebration.toast(); as t) {
        <div class="toast" [class.grand]="t.grand" role="status">
          <span class="medal"><app-icon [name]="t.grand ? 'award' : 'brush'" /></span>
          <div class="text">
            <strong>{{ t.title }}</strong>
            <span>{{ t.detail }}</span>
          </div>
          <div class="actions">
            <button type="button" class="pc" (click)="postcard.open(); celebration.dismiss()">
              <app-icon name="postcard" /> Postcard
            </button>
            <button type="button" class="x" (click)="celebration.dismiss()" aria-label="Close">
              <app-icon name="close" />
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 85;
      pointer-events: none;
    }

    .burst {
      position: absolute;
      width: 0;
      height: 0;
    }

    .piece {
      position: absolute;
      left: calc(var(--size) / -2);
      top: calc(var(--size) / -2);
      width: var(--size);
      height: var(--size);
      border: 1.5px solid var(--ink);
      opacity: 0;
      animation: fly 1.3s cubic-bezier(0.15, 0.7, 0.3, 1) var(--delay) forwards;
    }
    .piece.drop {
      border-radius: 50% 50% 50% 0;
    }
    .piece.dot {
      border-radius: 50%;
      width: calc(var(--size) * 0.7);
      height: calc(var(--size) * 0.7);
    }
    .piece.strip {
      height: calc(var(--size) * 0.35);
      border-radius: 2px;
    }

    @keyframes fly {
      0% {
        opacity: 1;
        transform: translate(0, 0) rotate(0) scale(0.3);
      }
      70% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(var(--dx), calc(var(--dy) + 60px)) rotate(var(--rot)) scale(1);
      }
    }

    .toast-slot {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 104px;
      display: flex;
      justify-content: center;
      padding: 0 12px;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 14px;
      max-width: 520px;
      padding: 14px 14px 14px 16px;
      background: var(--paper);
      color: var(--ink);
      border: 2px solid var(--ink);
      border-radius: 18px;
      box-shadow: 6px 6px 0 var(--ink);
      animation: pop-in 0.55s cubic-bezier(0.2, 1.4, 0.4, 1);
    }

    .toast.grand {
      position: fixed;
      left: 50%;
      top: 50%;
      bottom: auto;
      flex-direction: column;
      text-align: center;
      max-width: min(420px, calc(100vw - 32px));
      padding: 28px 26px 22px;
      transform: translate(-50%, -50%);
      animation: pop-center 0.6s cubic-bezier(0.2, 1.4, 0.4, 1);

      .medal {
        width: 72px;
        height: 72px;
        font-size: 2rem;
      }
      strong {
        font-size: 1.6rem;
      }
    }

    .medal {
      display: grid;
      place-items: center;
      flex: none;
      width: 46px;
      height: 46px;
      border: 2px solid var(--ink);
      border-radius: 50%;
      background: var(--p1);
      color: var(--ink);
      font-size: 1.25rem;
      animation: spin 0.9s cubic-bezier(0.2, 1.2, 0.4, 1);
    }

    .text {
      display: grid;
      gap: 2px;
    }
    strong {
      font-family: var(--font-display);
      font-size: 1.15rem;
      line-height: 1.2;
    }
    .text span {
      color: var(--muted);
      font-size: 0.9rem;
    }

    .actions {
      display: flex;
      gap: 6px;
      flex: none;
    }
    .actions button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      border: 1.5px solid var(--ink);
      border-radius: 999px;
      background: transparent;
      font-weight: 600;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .pc {
      padding: 0 12px;
    }
    .pc:hover {
      background: var(--ink);
      color: var(--paper);
    }
    .x {
      justify-content: center;
      width: 36px;
    }

    @keyframes pop-in {
      from {
        opacity: 0;
        transform: translateY(24px) scale(0.85);
      }
    }
    @keyframes pop-center {
      from {
        opacity: 0;
        transform: translate(-50%, -40%) scale(0.7);
      }
    }
    @keyframes spin {
      from {
        transform: rotate(-200deg) scale(0.2);
      }
    }

    @media (max-width: 560px) {
      .toast:not(.grand) {
        flex-wrap: wrap;
      }
      .toast-slot {
        bottom: 120px;
      }
    }
  `,
})
export class CelebrationLayer {
  protected readonly celebration = inject(Celebration);
  protected readonly postcard = inject(Postcard);
}
