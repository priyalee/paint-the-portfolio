import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { PaintState } from '@core/paint-state';
import { Project } from '@data/portfolio.data';
import { Paintable } from '@shared/paint/paintable.directive';
import { Icon } from '@shared/ui/icon';

/** A project as a paint-store colour chip: paint the swatch, flip for details. */
@Component({
  selector: 'app-project-chip',
  imports: [Paintable, Icon, DecimalPipe],
  templateUrl: './project-chip.html',
  styleUrl: './project-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.flipped]': 'flipped()' },
})
export class ProjectChip {
  readonly project = input.required<Project>();
  readonly index = input.required<number>();

  private readonly state = inject(PaintState);
  protected readonly flipped = signal(false);
  /** Must match siteRegionIds() in core/chapters.ts */
  protected readonly regionId = computed(() => `work-${this.index()}`);

  /** The chip's "paint name": whatever pigment currently shows on it. */
  protected readonly colourName = computed(() => {
    const painted = this.state.fillOf('site', this.regionId());
    const colors = this.state.palette().colors;
    if (painted !== undefined) return colors[painted].name;
    if (this.state.mode() === 'color') return colors[this.project().slot].name;
    return 'Unpainted · click to fill';
  });
}
