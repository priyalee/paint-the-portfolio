import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { PaintState } from '@core/paint-state';
import { Project } from '@data/portfolio.data';
import { DEFAULT_SKETCH, SKETCH_ART } from '@shared/art/project-sketches';
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
  /** Paint-region id from core/paint-keys; must match siteRegionIds() in core/chapters.ts */
  readonly regionId = input.required<string>();

  private readonly state = inject(PaintState);
  protected readonly flipped = signal(false);

  /** The line sketch drawn over the swatch. */
  protected readonly sketch = computed(() => SKETCH_ART[this.project().sketch ?? DEFAULT_SKETCH]);

  /** The chip's "paint name": whatever pigment currently shows on it. */
  protected readonly colourName = computed(() => {
    const painted = this.state.fillOf('site', this.regionId());
    const colors = this.state.palette().colors;
    if (painted !== undefined) return colors[painted].name;
    if (this.state.mode() === 'color') return colors[this.project().slot].name;
    return 'Unpainted · click to fill';
  });
}
