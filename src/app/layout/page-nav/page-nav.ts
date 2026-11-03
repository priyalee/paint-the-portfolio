import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { CHAPTERS } from '@core/chapters';
import { Icon } from '@shared/ui/icon';

/** Previous / next chapter links at the bottom of every chapter page. */
@Component({
  selector: 'app-page-nav',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (index() >= 0) {
      <nav class="container nav" aria-label="Chapters">
        @if (prev(); as p) {
          <a class="link prev" [routerLink]="'/' + p.path">
            <span class="dir"><app-icon name="arrow-left" /> Previous</span>
            <span class="name">{{ p.no }} · {{ p.label }}</span>
          </a>
        } @else {
          <a class="link prev" routerLink="/">
            <span class="dir"><app-icon name="arrow-left" /> Back</span>
            <span class="name">Home</span>
          </a>
        }
        @if (next(); as n) {
          <a class="link next" [routerLink]="'/' + n.path">
            <span class="dir">Next <app-icon name="arrow" /></span>
            <span class="name">{{ n.no }} · {{ n.label }}</span>
          </a>
        }
      </nav>
    }
  `,
  styles: `
    .nav {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding-block: 8px 72px;
    }
    .link {
      display: grid;
      gap: 4px;
      padding: 18px 22px;
      border: 2px solid var(--ink);
      border-radius: var(--radius-lg);
      text-decoration: none;
      transition:
        transform 0.25s var(--ease),
        box-shadow 0.25s var(--ease);
    }
    .link:hover {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0 var(--ink);
    }
    .next {
      grid-column: 2;
      text-align: right;
    }
    .dir {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .next .dir {
      justify-content: flex-end;
    }
    .name {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 1.35rem;
    }
    @media (max-width: 560px) {
      .name {
        font-size: 1.1rem;
      }
      .link {
        padding: 14px 16px;
      }
    }
  `,
})
export class PageNav {
  private readonly router = inject(Router);
  private readonly url = signal(this.router.url);

  protected readonly index = computed(() => {
    const path = this.url().split(/[?#]/)[0].replace(/^\//, '');
    return CHAPTERS.findIndex((c) => c.path === path);
  });
  protected readonly prev = computed(() => CHAPTERS[this.index() - 1] ?? null);
  protected readonly next = computed(() => CHAPTERS[this.index() + 1] ?? null);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.url.set(e.urlAfterRedirects));
  }
}
