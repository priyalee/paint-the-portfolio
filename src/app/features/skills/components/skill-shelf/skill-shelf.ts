import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { skillJarId, skillShelfPrefix } from '@core/paint-keys';
import { SkillGroup } from '@data/portfolio.data';
import { PaintBlock } from '@shared/paint/paint-block.directive';
import { PaintJar } from '../paint-jar/paint-jar';

/** A labelled shelf of paint jars. Celebrates when every jar on it is painted. */
@Component({
  selector: 'app-skill-shelf',
  imports: [PaintJar, PaintBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [appPaintBlock]="shelfPrefix(groupKey())" [blockTitle]="group().name + ' shelf'">
      <h3>{{ group().name }}</h3>
      <ul>
        @for (skill of group().items; track $index; let i = $index) {
          <li>
            <app-paint-jar [skill]="skill" [regionId]="jarId(groupKey(), skillKeys()[i])" [group]="index()" [index]="i" />
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    h3 {
      font-size: 1.4rem;
      margin-bottom: 14px;
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 20px 28px;
      margin: 0;
      padding: 0 8px 14px;
      list-style: none;
      border-bottom: 6px double var(--ink);
    }
  `,
})
export class SkillShelf {
  /** Stable keys from core/paint-keys: the shelf's, and one per skill on it. */
  readonly groupKey = input.required<string>();
  readonly skillKeys = input.required<string[]>();
  protected readonly shelfPrefix = skillShelfPrefix;
  protected readonly jarId = skillJarId;
  readonly group = input.required<SkillGroup>();
  readonly index = input.required<number>();
}
