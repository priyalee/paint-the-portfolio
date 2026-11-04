import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WALL_COLOURS, WallColour } from '@core/wall-colours';
import { Icon } from '@shared/ui/icon';

/** The row of wall colours under the mural / splash wall, plus a custom colour picker. */
@Component({
  selector: 'app-wall-palette',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="head">
      <span class="label">Wall colours</span>
      <span class="current">
        <span class="dot" [style.background]="paint.colour().hex"></span>
        {{ paint.colour().name }}
      </span>
    </div>
    <div class="swatches" role="radiogroup" aria-label="Wall colours">
      @for (c of colours; track c.hex) {
        <button
          type="button"
          class="swatch"
          role="radio"
          [attr.aria-checked]="c.hex === paint.colour().hex"
          [attr.aria-label]="c.name"
          [title]="c.name"
          [style.background]="c.hex"
          (click)="paint.pick(c)"
        ></button>
      }
      <label class="swatch custom" title="Pick any colour">
        <app-icon name="palette" />
        <span class="sr-only">Custom colour</span>
        <input type="color" [value]="paint.colour().hex" (input)="onCustom($event)" />
      </label>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .current {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .dot {
      width: 14px;
      height: 14px;
      border: 1.5px solid var(--ink);
      border-radius: 50%;
    }
    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .swatch {
      position: relative;
      width: 30px;
      height: 30px;
      padding: 0;
      border: 2px solid var(--ink);
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.15s var(--ease);
    }
    .swatch:hover {
      transform: translateY(-2px);
    }
    .swatch[aria-checked='true'] {
      outline: 2px solid var(--ink);
      outline-offset: 3px;
    }
    .swatch:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 3px;
    }
    .custom {
      display: grid;
      place-items: center;
      background: var(--paper);
      color: var(--ink);
      font-size: 0.8rem;
    }
    .custom input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `,
})
export class WallPalette {
  protected readonly paint = inject(WallColour);
  protected readonly colours = WALL_COLOURS;

  protected onCustom(event: Event): void {
    this.paint.pickCustom((event.target as HTMLInputElement).value);
  }
}
