import { ChangeDetectionStrategy, Component, DestroyRef, inject, viewChild } from '@angular/core';
import { Postcard } from '@core/postcard';
import { PORTRAIT } from '@shared/art/art';
import { ArtCanvas } from '@shared/paint/art-canvas';
import { PaintBlock } from '@shared/paint/paint-block.directive';

/** The paintable line-art portrait on the About page. */
@Component({
  selector: 'app-portrait-card',
  imports: [ArtCanvas, PaintBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card frame" appPaintBlock="about-" blockTitle="Portrait">
      <app-art [art]="art" prefix="about-" label="Portrait sketch — click shapes to paint" />
    </div>
    <p class="hand note">That's me. Give me a new sweater?</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 12px;
      justify-items: center;
    }
    .frame {
      width: 100%;
      max-width: 440px;
      padding: 20px;
      transform: rotate(-1.5deg);
    }
    .note {
      margin: 0;
    }
  `,
})
export class PortraitCard {
  protected readonly art = PORTRAIT;
  private readonly canvas = viewChild.required(ArtCanvas);

  constructor() {
    inject(DestroyRef).onDestroy(
      inject(Postcard).register({
        id: 'about',
        order: 1,
        snapshot: () => this.canvas().snapshot(),
      }),
    );
  }
}
