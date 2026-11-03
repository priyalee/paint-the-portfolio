import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CHAPTERS } from '@core/chapters';
import { Reveal } from '@shared/directives/reveal.directive';
import { SectionHeader } from '@shared/ui/section-header';
import { ChapterCard } from '../components/chapter-card/chapter-card';
import { Hero } from '../components/hero/hero';

/** Landing page: brush-reveal hero + the "sketchbook" index of every chapter page. */
@Component({
  selector: 'app-home-page',
  imports: [Hero, ChapterCard, SectionHeader, Reveal],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly chapters = CHAPTERS;
}
