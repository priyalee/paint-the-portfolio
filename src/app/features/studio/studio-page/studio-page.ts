import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { STUDIO_ART } from '@shared/art/art';
import { SectionHeader } from '@shared/ui/section-header';
import { ArtworkPicker } from '../components/artwork-picker/artwork-picker';
import { Easel } from '../components/easel/easel';

/** Free-play colouring studio: pick a page, flood it, download it. */
@Component({
  selector: 'app-studio-page',
  imports: [ArtworkPicker, Easel, SectionHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container">
        <app-section-header
          eyebrow="07 — Studio"
          before="Colour"
          accent="anything"
          note="Pick a page, choose pigments from the dock, flood every shape. Press M for a new palette mood."
        />
        <div class="layout">
          <app-artwork-picker [artworks]="artworks" [(selected)]="selectedId" />
          <app-easel [art]="art()" />
        </div>
      </div>
    </section>
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 240px minmax(0, 1fr);
      gap: clamp(20px, 4vw, 40px);
      align-items: start;
    }
    @media (max-width: 820px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class StudioPage {
  protected readonly artworks = STUDIO_ART;
  protected readonly selectedId = signal(STUDIO_ART[0].id);
  protected readonly art = computed(
    () => this.artworks.find((a) => a.id === this.selectedId()) ?? this.artworks[0],
  );
}
