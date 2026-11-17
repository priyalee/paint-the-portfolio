import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { ApiStatus } from '@core/api';
import { ContentStore } from '@core/content-store';
import { PaintState, reducedMotion } from '@core/paint-state';
import { legacyRegionMap } from '@core/paint-keys';
import { PortfolioTitleStrategy } from '@core/title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Find out whether the backend is up, then load the published content
    // before first render so there is no placeholder flash.
    provideAppInitializer(() => {
      const apiStatus = inject(ApiStatus);
      const content = inject(ContentStore);
      const paint = inject(PaintState);
      return apiStatus
        .check()
        .then(() => content.load())
        // Paint used to be saved by list position; move it to stable keys once.
        .then(() => paint.migrateRegions(legacyRegionMap(content.content())));
    }),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
      // Page changes roll in like a fresh coat of paint (see .page-transition in styles.scss).
      withViewTransitions({
        onViewTransitionCreated: ({ transition }) => {
          if (reducedMotion()) {
            transition.skipTransition();
            return;
          }
          const root = document.documentElement;
          root.classList.add('page-transition');
          transition.finished.finally(() => root.classList.remove('page-transition'));
        },
      }),
    ),
    { provide: TitleStrategy, useClass: PortfolioTitleStrategy },
  ],
};
