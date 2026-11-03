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
import { startPageTurn } from '@core/page-turn';
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
      // Page changes turn like sketchbook pages (see styles/_page-turn.scss).
      withViewTransitions({ onViewTransitionCreated: startPageTurn }),
    ),
    { provide: TitleStrategy, useClass: PortfolioTitleStrategy },
  ],
};
