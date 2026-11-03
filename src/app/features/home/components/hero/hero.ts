import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentStore } from '@core/content-store';
import { PaintState } from '@core/paint-state';
import { LANDSCAPE } from '@shared/art/art';
import { Icon } from '@shared/ui/icon';
import { BrushReveal } from '../brush-reveal/brush-reveal';

/** Landing hero: intro copy + the taped-on brush-reveal sketch. */
@Component({
  selector: 'app-hero',
  imports: [RouterLink, Icon, DecimalPipe, BrushReveal],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected readonly state = inject(PaintState);
  protected readonly data = inject(ContentStore).content;
  protected readonly art = LANDSCAPE;
  protected readonly brush = viewChild.required(BrushReveal);

  protected revealAll(e: Event): void {
    if (this.state.mode() === 'mono') this.state.toggleMode(e);
  }
}
