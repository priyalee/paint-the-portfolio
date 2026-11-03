import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chapter } from '@core/chapters';
import { PaintState } from '@core/paint-state';
import { Icon } from '@shared/ui/icon';

/** One card in the home "sketchbook" grid, linking to a chapter page with its paint progress. */
@Component({
  selector: 'app-chapter-card',
  imports: [RouterLink, Icon],
  templateUrl: './chapter-card.html',
  styleUrl: './chapter-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterCard {
  readonly chapter = input.required<Chapter>();
  /** Position in the grid — picks the pigment for the corner blob. */
  readonly index = input(0);

  private readonly state = inject(PaintState);

  protected readonly progress = computed(() => {
    const c = this.chapter();
    return c.prefix === null ? null : this.state.progressFor(c.scope, c.prefix);
  });

  protected readonly done = computed(() => {
    const p = this.progress();
    return p !== null && p.total > 0 && p.painted === p.total;
  });

  /** Blob stays paper until the chapter is fully painted (or the site is in colour mode). */
  protected readonly blob = computed(() =>
    this.done() || this.state.mode() === 'color' ? `var(--p${this.index() % 6})` : 'var(--paper-2)',
  );
}
