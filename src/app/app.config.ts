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
import { reducedMotion } from '@core/paint-state';
import { PortfolioTitleStrategy } from '@core/title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Find out whether the backend is up, then load the published content
    // before first render so there is no placeholder flash.
    provideAppInitializer(() => {
      const apiStatus = inject(ApiStatus);
      const content = inject(ContentStore);
      return apiStatus.check().then(() => content.load());
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
