import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '@shared/directives/reveal.directive';

/**
 * Shared page heading: eyebrow, title with one italic accent word, and an
 * optional handwritten note.
 *
 *   <app-section-header eyebrow="02 — Skills" before="My paint" accent="shelf" note="…" />
 */
@Component({
  selector: 'app-section-header',
  imports: [Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="section-head" appReveal>
      <span class="eyebrow">{{ eyebrow() }}</span>
      <h2>
        {{ before() }} <em>{{ accent() }}</em> {{ after() }}
      </h2>
      @if (note()) {
        <p class="hand">{{ note() }}</p>
      }
    </header>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class SectionHeader {
  readonly eyebrow = input.required<string>();
  readonly before = input('');
  readonly accent = input.required<string>();
  readonly after = input('');
  readonly note = input('');
}
