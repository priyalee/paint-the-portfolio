import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentStore } from '@core/content-store';
import { Reveal } from '@shared/directives/reveal.directive';
import { Icon } from '@shared/ui/icon';
import { SectionHeader } from '@shared/ui/section-header';
import { FactList } from '../components/fact-list/fact-list';
import { PortraitCard } from '../components/portrait-card/portrait-card';

@Component({
  selector: 'app-about-page',
  imports: [PortraitCard, FactList, SectionHeader, Reveal, Icon],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly data = inject(ContentStore).content;
}
