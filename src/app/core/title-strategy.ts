import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { ContentStore } from '@core/content-store';

/** "Work · Your Name" on chapter pages, "Your Name — Role" on home. */
@Injectable({ providedIn: 'root' })
export class PortfolioTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly content = inject(ContentStore).content;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    const { name, role } = this.content();
    this.title.setTitle(page ? `${page} · ${name}` : `${name} — ${role}`);
  }
}
