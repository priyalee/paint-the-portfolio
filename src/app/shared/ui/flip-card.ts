import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

export type FlipSide = 'front' | 'back';

/**
 * A two-sided postcard that turns over when clicked (or with Enter/Space).
 * Without a back image it simply shows the front and doesn't turn.
 */
@Component({
  selector: 'app-flip-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="flip"
      [class.flipped]="showBack()"
      [class.static]="!back()"
      [disabled]="!back()"
      [attr.aria-label]="label()"
      (click)="turn()"
    >
      <span class="inner">
        <span class="face front" [attr.aria-hidden]="showBack()">
          @if (front(); as src) {
            <img [src]="src" [alt]="alt() + ', front'" draggable="false" />
          } @else {
            <span class="wait">Printing…</span>
          }
        </span>
        @if (back(); as src) {
          <span class="face back" [attr.aria-hidden]="!showBack()">
            <img [src]="src" [alt]="alt() + ', back'" draggable="false" />
          </span>
        }
      </span>
    </button>
  `,
  styles: `
    :host {
      display: block;
    }
    .flip {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 10;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
      perspective: 1800px;
    }
    .flip.static {
      cursor: default;
    }
    .flip:focus-visible {
      outline: 3px solid var(--accent, var(--ink));
      outline-offset: 4px;
      border-radius: 8px;
    }
    .inner {
      position: relative;
      display: block;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      transition: transform 0.7s var(--ease, ease);
    }
    .flipped .inner {
      transform: rotateY(180deg);
    }
    .face {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      overflow: hidden;
      border: 2px solid var(--ink);
      border-radius: 8px;
      background: var(--paper);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    .back {
      transform: rotateY(180deg);
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      user-select: none;
    }
    .wait {
      color: var(--muted);
    }
    @media (prefers-reduced-motion: reduce) {
      .inner {
        transition: none;
      }
    }
  `,
})
export class FlipCard {
  readonly front = input<string | null>(null);
  readonly back = input<string | null>(null);
  /** Describes the card for screen readers, e.g. "Postcard from Sam". */
  readonly alt = input('Postcard');
  readonly side = model<FlipSide>('front');

  protected readonly showBack = computed(() => !!this.back() && this.side() === 'back');
  protected readonly label = computed(() =>
    this.back() ? `${this.alt()}: showing the ${this.showBack() ? 'back' : 'front'}. Turn it over` : this.alt(),
  );

  protected turn(): void {
    if (this.back()) this.side.set(this.showBack() ? 'front' : 'back');
  }
}
