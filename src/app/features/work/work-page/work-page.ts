import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentStore } from '@core/content-store';
import { Reveal } from '@shared/directives/reveal.directive';
import { PostcardSource } from '@shared/directives/postcard-source.directive';
import { PaintBlock } from '@shared/paint/paint-block.directive';
import { SectionHeader } from '@shared/ui/section-header';
import { ProjectChip } from '../components/project-chip/project-chip';

@Component({
  selector: 'app-work-page',
  imports: [ProjectChip, SectionHeader, Reveal, PaintBlock, PostcardSource],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" id="work">
      <div class="container">
        <app-section-header
          eyebrow="03 — Work"
          before="Selected"
          accent="swatches"
          note="Paint a chip, then flip it to read the project."
        />
        <div class="chips" appPaintBlock="work-" blockTitle="Project swatches" appPostcardSource="work">
          @for (p of data().projects; track $index; let i = $index) {
            <app-project-chip
              [project]="p"
              [index]="i"
              [class.tilt-left]="i % 2 === 0"
              [class.tilt-right]="i % 2 === 1"
              appReveal
            />
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .chips {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: clamp(20px, 3vw, 32px);
    }
  `,
})
export class WorkPage {
  protected readonly data = inject(ContentStore).content;
}
