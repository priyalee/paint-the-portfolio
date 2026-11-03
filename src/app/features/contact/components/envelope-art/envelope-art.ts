import { ChangeDetectionStrategy, Component, DestroyRef, inject, viewChild } from '@angular/core';
import { Postcard } from '@core/postcard';
import { ENVELOPE } from '@shared/art/art';
import { ArtCanvas } from '@shared/paint/art-canvas';
import { PaintBlock } from '@shared/paint/paint-block.directive';

/** Paintable envelope illustration on the Contact page. */
@Component({
  selector: 'app-envelope-art',
  imports: [ArtCanvas, PaintBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tilt" appPaintBlock="contact-" blockTitle="Envelope">
      <app-art [art]="art" prefix="contact-" label="Envelope sketch — click shapes to paint" />
    </div>
  `,
  styles: `
    :host {
      --sw: 2.5;
      display: block;
      width: 100%;
      max-width: 460px;
      justify-self: center;
    }
    .tilt {
      transform: rotate(3deg);
    }
  `,
})
export class EnvelopeArt {
  protected readonly art = ENVELOPE;
  private readonly canvas = viewChild.required(ArtCanvas);

  constructor() {
    inject(DestroyRef).onDestroy(
      inject(Postcard).register({
        id: 'contact',
        order: 2,
        snapshot: () => this.canvas().snapshot(),
      }),
    );
  }
}
