import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentStore } from '@core/content-store';
import { Reveal } from '@shared/directives/reveal.directive';
import { PostcardSource } from '@shared/directives/postcard-source.directive';
import { SectionHeader } from '@shared/ui/section-header';
import { SkillShelf } from '../components/skill-shelf/skill-shelf';

@Component({
  selector: 'app-skills-page',
  imports: [SkillShelf, SectionHeader, Reveal, PostcardSource],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" id="skills">
      <div class="container">
        <app-section-header
          eyebrow="02 — Skills"
          before="My paint"
          accent="shelf"
          note="Each jar is filled to how comfortable I am. Paint the lids, too."
        />
        <div class="shelves" appPostcardSource="skills">
          @for (group of data().skills; track $index; let g = $index) {
            <app-skill-shelf [group]="group" [index]="g" appReveal />
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .shelves {
      display: grid;
      gap: 44px;
    }
  `,
})
export class SkillsPage {
  protected readonly data = inject(ContentStore).content;
}
