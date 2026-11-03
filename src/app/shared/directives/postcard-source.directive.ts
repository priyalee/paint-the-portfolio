import { DestroyRef, Directive, ElementRef, OnInit, inject, input } from '@angular/core';
import { Postcard } from '@core/postcard';
import { collage, cssVar, svgToImage } from '@core/snapshot';

const MAX_PIECES = 12;

/**
 * Puts the painted SVG art inside this element on the postcard.
 * One SVG becomes a panel as-is; several (jars, chips, dots) are tiled.
 *
 *   <div appPostcardSource="skills" [postcardOrder]="1">…</div>
 *   <div appPostcardSource="wall" postcardSelect="svg">…</div>
 */
@Directive({ selector: '[appPostcardSource]' })
export class PostcardSource implements OnInit {
  /** Unique id for this source (one per page section). */
  readonly appPostcardSource = input.required<string>();
  /** Lower comes first on the card; the first source gets the big panel. */
  readonly postcardOrder = input(1);
  /** Which SVGs inside the host to capture. */
  readonly postcardSelect = input('svg.art');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly postcard = inject(Postcard);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.destroyRef.onDestroy(
      this.postcard.register({
        id: this.appPostcardSource(),
        order: this.postcardOrder(),
        snapshot: () => this.snapshot(),
      }),
    );
  }

  private async snapshot(): Promise<CanvasImageSource | null> {
    const svgs = [
      ...this.host.nativeElement.querySelectorAll<SVGSVGElement>(this.postcardSelect()),
    ].slice(0, MAX_PIECES);
    if (!svgs.length) return null;
    const images = await Promise.all(svgs.map((svg) => svgToImage(svg)));
    return collage(images, cssVar('--paper') || '#F6F2E9');
  }
}
