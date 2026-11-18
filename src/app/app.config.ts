import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  NavigationError,
  TitleStrategy,
  provideRouter,
  withInMemoryScrolling,
  withNavigationErrorHandler,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { ApiStatus } from '@core/api';
import { Connection } from '@core/connection';
import { ContentStore } from '@core/content-store';
import { PaintState, reducedMotion } from '@core/paint-state';
import { legacyRegionMap } from '@core/paint-keys';
import { PortfolioTitleStrategy } from '@core/title-strategy';

const RELOADED_KEY = 'ink-pigment:reloaded-for';

function reloadOnStaleChunk(e: NavigationError): void {
  const message = String((e.error as Error | undefined)?.message ?? e.error ?? '');
  if (!/dynamically imported module|Importing a module script failed|module script|ChunkLoadError|Loading chunk/i.test(message)) {
    return;
  }
  // Offline, not stale: a reload would swap the site for the browser's "no internet"
  // page. Show the offline note instead and open the page once the connection is back.
  const connection = inject(Connection);
  void (async () => {
    if (!navigator.onLine || !(await connection.tryNow())) {
      connection.retryNavigationLater(e.url);
      return;
    }
    reloadOnce(e.url);
  })();
}

/** Reloads to `url` once per address, so a real outage can't cause a reload loop. */
function reloadOnce(url: string): void {
  try {
    if (sessionStorage.getItem(RELOADED_KEY) === url) return;
    sessionStorage.setItem(RELOADED_KEY, url);
  } catch {
    /* storage blocked: still worth one reload */
  }
  location.assign(url);
}

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
      // After a new deploy, a tab opened earlier asks for page code that no longer exists.
      // Reload once to the page the visitor wanted, which fetches the new version.
      withNavigationErrorHandler(reloadOnStaleChunk),
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
