import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { siteRegionIds, studioRegionIds } from '@core/chapters';
import { ContentStore } from '@core/content-store';
import { PaintState } from '@core/paint-state';
import { CelebrationLayer } from '@layout/celebration-layer/celebration-layer';
import { ContentEditor } from '@layout/content-editor/content-editor';
import { Footer } from '@layout/footer/footer';
import { Navbar } from '@layout/navbar/navbar';
import { PageNav } from '@layout/page-nav/page-nav';
import { PostcardDialog } from '@layout/postcard-dialog/postcard-dialog';
import { PaintDock } from '@layout/paint-dock/paint-dock';
import { PaintBlock } from '@shared/paint/paint-block.directive';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Navbar,
    PaintDock,
    Footer,
    ContentEditor,
    CelebrationLayer,
    PageNav,
    PostcardDialog,
    PaintBlock,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    // Instantiate early so theme/palette CSS variables are applied on first paint.
    const paint = inject(PaintState);
    // Site progress counts every region on every page, opened or not.
    const content = inject(ContentStore).content;
    effect(() => paint.setKnown('site', siteRegionIds(content())));
    paint.setKnown('studio', studioRegionIds());
    // Keep anchor targets clear of the fixed navbar.
    inject(ViewportScroller).setOffset([0, 80]);
  }
}
