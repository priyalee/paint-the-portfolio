import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SkillItem } from '@data/portfolio.data';
import { Paintable } from '@shared/paint/paintable.directive';

const JAR = 'M24 22h42v8q12 7 12 20v54q0 12-12 12H24q-12 0-12-12V50q0-13 12-20Z';
const LID = 'M18 6h54a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4Z';

/** One skill as a paint jar — liquid level = skill level; liquid and lid are paintable. */
@Component({
  selector: 'app-paint-jar',
  imports: [Paintable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = skill();
    <svg class="art" viewBox="0 0 90 120" role="group" [attr.aria-label]="s.name + ' ' + s.level + '%'">
      <defs>
        <clipPath [attr.id]="clipId()"><path [attr.d]="jar" /></clipPath>
      </defs>
      <path class="glass" [attr.d]="jar" />
      <path
        [appPaintable]="id() + '-paint'"
        [trueColor]="(group() * 2 + index()) % 6"
        [label]="s.name + ' paint'"
        [attr.d]="liquid()"
        [attr.clip-path]="'url(#' + clipId() + ')'"
      />
      <path class="shine line" d="M22 56v34" />
      <path
        [appPaintable]="id() + '-lid'"
        [trueColor]="(group() + index() + 3) % 6"
        [label]="s.name + ' lid'"
        [attr.d]="lid"
      />
      <path class="line" [attr.d]="jar" />
    </svg>
    <span class="name">{{ s.name }}</span>
    <span class="level">{{ s.level }}%</span>
  `,
  styles: `
    :host {
      display: grid;
      justify-items: center;
      gap: 2px;
      width: 104px;
    }
    svg {
      --sw: 2.5;
      width: 90px;
      height: 120px;
      transition: transform 0.3s var(--ease);
    }
    :host(:hover) svg {
      transform: translateY(-4px) rotate(-3deg);
    }
    .glass {
      fill: var(--paper-2);
      stroke: none;
    }
    .shine {
      stroke-width: 3;
      opacity: 0.35;
    }
    .name {
      font-weight: 600;
      font-size: 0.92rem;
      text-align: center;
      line-height: 1.25;
    }
    .level {
      font-family: var(--font-hand);
      font-size: 1.2rem;
      color: var(--muted);
    }
  `,
})
export class PaintJar {
  readonly skill = input.required<SkillItem>();
  /** Shelf index and position on the shelf — together they form the region id. */
  readonly group = input.required<number>();
  readonly index = input.required<number>();

  protected readonly jar = JAR;
  protected readonly lid = LID;
  /** Must match siteRegionIds() in core/chapters.ts */
  protected readonly id = computed(() => `skill-${this.group()}-${this.index()}`);
  protected readonly clipId = computed(() => `jar-clip-${this.group()}-${this.index()}`);

  /** Wavy-topped liquid (y 116 = empty, y 34 = full). */
  protected readonly liquid = computed(() => {
    const level = Math.max(0, Math.min(100, this.skill().level));
    const y = 116 - (level / 100) * 82;
    return `M8 ${y}q10-6 20 0t20 0t20 0t20 0V120H8Z`;
  });
}
