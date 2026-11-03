import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PaintState } from '@core/paint-state';
import { CHAPTERS } from '@core/chapters';
import { ContentStore } from '@core/content-store';
import { Icon } from '@shared/ui/icon';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.scrolled]': 'scrolled()',
    '(window:scroll)': 'onScroll()',
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
})
export class Navbar {
  protected readonly state = inject(PaintState);
  protected readonly data = inject(ContentStore).content;
  protected readonly menuOpen = signal(false);
  protected readonly scrolled = signal(false);

  protected readonly links = CHAPTERS;

  protected readonly percent = computed(() => {
    const p = this.state.siteProgress();
    return p.total ? Math.round(p.ratio * 100) : null;
  });

  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }
}
