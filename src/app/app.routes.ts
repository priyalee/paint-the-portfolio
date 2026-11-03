import { Routes } from '@angular/router';

/**
 * Every page is an independent, lazy-loaded feature module
 * (src/app/features/<name>/<name>.routes.ts).
 */
export const routes: Routes = [
  { path: '', loadChildren: () => import('@features/home/home.routes') },
  { path: 'about', loadChildren: () => import('@features/about/about.routes') },
  { path: 'skills', loadChildren: () => import('@features/skills/skills.routes') },
  { path: 'work', loadChildren: () => import('@features/work/work.routes') },
  { path: 'journey', loadChildren: () => import('@features/journey/journey.routes') },
  { path: 'wall', loadChildren: () => import('@features/wall/wall.routes') },
  { path: 'contact', loadChildren: () => import('@features/contact/contact.routes') },
  { path: 'studio', loadChildren: () => import('@features/studio/studio.routes') },
  // Owner-only back office: not in the navigation, not indexed.
  { path: 'admin', loadChildren: () => import('@features/admin/admin.routes') },
  { path: '**', redirectTo: '' },
];
