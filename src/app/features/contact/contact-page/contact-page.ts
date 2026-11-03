import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentStore } from '@core/content-store';
import { Reveal } from '@shared/directives/reveal.directive';
import { Icon } from '@shared/ui/icon';
import { SectionHeader } from '@shared/ui/section-header';
import { EnvelopeArt } from '../components/envelope-art/envelope-art';
import { PostcardCta } from '../components/postcard-cta/postcard-cta';
import { PostcardRack } from '../components/postcard-rack/postcard-rack';
import { SocialLinks } from '../components/social-links/social-links';

@Component({
  selector: 'app-contact-page',
  imports: [EnvelopeArt, PostcardCta, PostcardRack, SocialLinks, SectionHeader, Reveal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" id="contact">
      <div class="container grid">
        <div class="text" appReveal>
          <app-section-header
            eyebrow="06 — Contact"
            before="Let's make something"
            accent="colourful"
          />
          <p class="lede">Have a project, a role or just want to say hi? My inbox is always open.</p>
          <a class="btn mail" [href]="'mailto:' + data().email">
            <app-icon name="mail" /> {{ data().email }}
          </a>
          <app-social-links [links]="data().socials" />
          <app-postcard-cta />
        </div>
        <app-envelope-art appReveal />
      </div>
      <div class="container">
        <app-postcard-rack class="rack" />
      </div>
    </section>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
      gap: clamp(32px, 6vw, 80px);
      align-items: center;
    }
    .rack {
      margin-top: clamp(48px, 8vw, 88px);
    }
    .rack:empty {
      display: none;
    }
    .mail {
      margin: 8px 0 28px;
      word-break: break-all;
    }
    @media (max-width: 860px) {
      .grid {
        grid-template-columns: 1fr;
      }
      app-envelope-art {
        grid-row: 1;
        max-width: 340px;
      }
    }
  `,
})
export class ContactPage {
  protected readonly data = inject(ContentStore).content;
}
