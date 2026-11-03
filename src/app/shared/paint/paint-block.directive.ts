import { Directive, ElementRef, effect, inject, input, signal, untracked } from '@angular/core';
import { Celebration } from '@core/celebration';
import { PaintScope, PaintState } from '@core/paint-state';

/**
 * Marks a container as a "block" of paintable regions (all ids starting with
 * the given prefix). When the visitor fills the last region, it celebrates.
 *
 *   <div appPaintBlock="about-" blockTitle="Portrait">…</div>
 *
 * Only fires on the transition to complete — not on page load when the
 * block was already finished in a previous visit.
 */
@Directive({
  selector: '[appPaintBlock]',
  host: { '[class.block-complete]': 'complete()' },
})
export class PaintBlock {
  readonly prefix = input.required<string>({ alias: 'appPaintBlock' });
  readonly title = input.required<string>({ alias: 'blockTitle' });
  readonly scope = input<PaintScope>('site');
  /** The whole-site block: bigger celebration. */
  readonly grand = input(false);

  protected readonly complete = signal(false);
  private baselineFor: string | null = null;

  constructor() {
    const state = inject(PaintState);
    const celebration = inject(Celebration);
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    effect(() => {
      const key = `${this.scope()}|${this.prefix()}`;
      const p = state.progressFor(this.scope(), this.prefix());
      if (!p.total) return;
      const done = p.painted === p.total;

      // First time we see this block (or the prefix changed): record, don't celebrate.
      if (this.baselineFor !== key) {
        this.baselineFor = key;
        this.complete.set(done);
        return;
      }
      if (done && !untracked(this.complete)) {
        celebration.celebrate({
          title: this.grand() ? 'You painted the whole portfolio!' : `${this.title()} — painted!`,
          detail: this.grand()
            ? `Every one of the ${p.total} shapes is in colour. You're officially a co-artist.`
            : `All ${p.total} ${p.total === 1 ? 'shape' : 'shapes'} filled with colour.`,
          el: this.grand() ? null : el,
          grand: this.grand(),
        });
      }
      this.complete.set(done);
    });
  }
}
