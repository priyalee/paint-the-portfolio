import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';
import { Artwork } from '@shared/art/art';
import { PaintScope } from '@core/paint-state';
import { svgToImage } from '@core/snapshot';
import { Paintable } from '@shared/paint/paintable.directive';

/** Renders an Artwork as paintable SVG line art. */
@Component({
  selector: 'app-art',
  imports: [Paintable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      #svg
      class="art"
      [attr.viewBox]="art().viewBox"
      [attr.aria-label]="label() || art().title + ' — click shapes to paint them'"
      role="group"
    >
      @for (s of art().shapes; track s.id) {
        @if (s.slot === 'line') {
          <path class="line" [attr.d]="s.d" />
        } @else {
          <path
            [appPaintable]="prefix() + s.id"
            [scope]="scope()"
            [trueColor]="s.slot"
            [label]="s.label"
            [attr.d]="s.d"
          />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
    }
  `,
})
export class ArtCanvas {
  readonly art = input.required<Artwork>();
  readonly scope = input<PaintScope>('site');
  readonly prefix = input('');
  readonly label = input('');

  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  snapshot(scale = 2): Promise<HTMLImageElement> {
    return svgToImage(this.svg().nativeElement, scale);
  }

  element(): SVGSVGElement {
    return this.svg().nativeElement;
  }
}
